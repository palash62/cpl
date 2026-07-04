import { recordSesEvent, suppressContact } from "@/modules/email-marketing";

type SnsMessage = {
  Type: string;
  Message?: string;
  SubscribeURL?: string;
  Token?: string;
  TopicArn?: string;
};

type SesNotification = {
  notificationType?: string;
  eventType?: string;
  mail?: { messageId?: string };
  bounce?: { bouncedRecipients?: { emailAddress?: string }[] };
  complaint?: { complainedRecipients?: { emailAddress?: string }[] };
};

async function handleSubscriptionConfirmation(body: SnsMessage) {
  if (body.SubscribeURL) {
    await fetch(body.SubscribeURL);
  }
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SnsMessage;

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
