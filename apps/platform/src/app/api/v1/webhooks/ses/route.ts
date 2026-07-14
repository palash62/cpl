import { createVerify } from "node:crypto";
import { assertSafeSnsUrl } from "@/lib/safe-url";
import { recordSesEvent, suppressContact } from "@/modules/email-marketing";

type SnsMessage = {
  Type: string;
  Message?: string;
  MessageId?: string;
  Timestamp?: string;
  TopicArn?: string;
  Subject?: string;
  Token?: string;
  SubscribeURL?: string;
  Signature?: string;
  SignatureVersion?: string;
  SigningCertURL?: string;
  UnsubscribeURL?: string;
};

type SesNotification = {
  notificationType?: string;
  eventType?: string;
  mail?: { messageId?: string };
  bounce?: { bouncedRecipients?: { emailAddress?: string }[] };
  complaint?: { complainedRecipients?: { emailAddress?: string }[] };
};

function buildSnsStringToSign(body: SnsMessage): string | null {
  if (body.Type === "Notification") {
    return [
      "Message",
      body.Message ?? "",
      "MessageId",
      body.MessageId ?? "",
      ...(body.Subject != null ? ["Subject", body.Subject] : []),
      "Timestamp",
      body.Timestamp ?? "",
      "TopicArn",
      body.TopicArn ?? "",
      "Type",
      body.Type,
      "",
    ].join("\n");
  }

  if (body.Type === "SubscriptionConfirmation" || body.Type === "UnsubscribeConfirmation") {
    return [
      "Message",
      body.Message ?? "",
      "MessageId",
      body.MessageId ?? "",
      "SubscribeURL",
      body.SubscribeURL ?? "",
      "Timestamp",
      body.Timestamp ?? "",
      "Token",
      body.Token ?? "",
      "TopicArn",
      body.TopicArn ?? "",
      "Type",
      body.Type,
      "",
    ].join("\n");
  }

  return null;
}

async function verifySnsSignature(body: SnsMessage): Promise<boolean> {
  if (!body.SigningCertURL || !body.Signature || !body.SignatureVersion) {
    return false;
  }

  if (body.SignatureVersion !== "1") {
    return false;
  }

  try {
    await assertSafeSnsUrl(body.SigningCertURL);
  } catch {
    return false;
  }

  const stringToSign = buildSnsStringToSign(body);
  if (!stringToSign) return false;

  try {
    const certRes = await fetch(body.SigningCertURL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!certRes.ok) return false;
    const certPem = await certRes.text();
    const verifier = createVerify("RSA-SHA1");
    verifier.update(stringToSign, "utf8");
    return verifier.verify(certPem, body.Signature, "base64");
  } catch (error) {
    console.error("[ses-webhook] signature verification failed", error);
    return false;
  }
}

async function handleSubscriptionConfirmation(body: SnsMessage) {
  if (!body.SubscribeURL) {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    await assertSafeSnsUrl(body.SubscribeURL);
  } catch {
    return Response.json({ ok: false }, { status: 403 });
  }

  await fetch(body.SubscribeURL, { signal: AbortSignal.timeout(5000) });
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SnsMessage;

    const verified = await verifySnsSignature(body);
    if (!verified) {
      return Response.json({ ok: false }, { status: 403 });
    }

    if (body.Type === "SubscriptionConfirmation") {
      return handleSubscriptionConfirmation(body);
    }

    if (body.Type !== "Notification" || !body.Message) {
      return Response.json({ ok: true });
    }

    const notification = JSON.parse(body.Message) as SesNotification;
    const eventType = notification.eventType ?? notification.notificationType;
    const messageId = notification.mail?.messageId;

    if (eventType === "Delivery" && messageId) {
      await recordSesEvent(messageId, "DELIVERY");
    }

    if (eventType === "Bounce") {
      if (messageId) await recordSesEvent(messageId, "BOUNCE", notification.bounce as never);
      for (const r of notification.bounce?.bouncedRecipients ?? []) {
        if (r.emailAddress) await suppressContact(r.emailAddress, "BOUNCED");
      }
    }

    if (eventType === "Complaint") {
      if (messageId) await recordSesEvent(messageId, "COMPLAINT", notification.complaint as never);
      for (const r of notification.complaint?.complainedRecipients ?? []) {
        if (r.emailAddress) await suppressContact(r.emailAddress, "COMPLAINED");
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[ses-webhook]", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
