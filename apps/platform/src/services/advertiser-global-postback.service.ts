import type { GlobalPostbackStatus, GlobalPostbackType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";

export type SerializedAdvertiserGlobalPostback = {
  id: string | null;
  type: GlobalPostbackType;
  status: GlobalPostbackStatus;
  endpoint: string;
  updatedAt: string | null;
};

const DEFAULT: SerializedAdvertiserGlobalPostback = {
  id: null,
  type: "S2S",
  status: "INACTIVE",
  endpoint: "",
  updatedAt: null,
};

function serialize(
  row: {
    id: string;
    type: GlobalPostbackType;
    status: GlobalPostbackStatus;
    endpoint: string;
    updatedAt: Date;
  } | null,
): SerializedAdvertiserGlobalPostback {
  if (!row) return { ...DEFAULT };
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    endpoint: row.endpoint,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertHttpTemplateUrl(endpoint: string) {
  const withoutMacros = endpoint.replace(/\{[a-z0-9_]+\}/gi, "placeholder");
  let parsed: URL;
  try {
    parsed = new URL(withoutMacros);
  } catch {
    throw Errors.validation("Enter a valid http(s) postback URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw Errors.validation("Postback URL must start with http:// or https://");
  }
}

export async function getAdvertiserGlobalPostback(
  advertiserId: string,
): Promise<SerializedAdvertiserGlobalPostback> {
  const row = await prisma.advertiserGlobalPostback.findUnique({
    where: { advertiserId },
  });
  return serialize(row);
}

export async function upsertAdvertiserGlobalPostback(
  advertiserId: string,
  input: {
    type: GlobalPostbackType;
    status: GlobalPostbackStatus;
    endpoint: string;
  },
): Promise<SerializedAdvertiserGlobalPostback> {
  const type = input.type;
  const status = input.status;
  const endpoint = input.endpoint.trim();

  if (status === "ACTIVE" && !endpoint) {
    throw Errors.validation("Endpoint is required when status is Active.");
  }

  if ((type === "S2S" || type === "IMAGE") && endpoint) {
    assertHttpTemplateUrl(endpoint);
  }

  if (type === "HTML" && endpoint.length > 20_000) {
    throw Errors.validation("HTML/Javascript code is too long.");
  }

  const row = await prisma.advertiserGlobalPostback.upsert({
    where: { advertiserId },
    create: {
      advertiserId,
      type,
      status,
      endpoint,
    },
    update: {
      type,
      status,
      endpoint,
    },
  });

  return serialize(row);
}
