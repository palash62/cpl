import type {
  AutoresponderProvider,
  AutoresponderTrigger,
  AdvertiserAutoresponder,
} from "@prisma/client";
import type { ConnectionConfig } from "./provider";

export type ConnectionInput = {
  name: string;
  provider: AutoresponderProvider;
  trigger: AutoresponderTrigger;
  campaignId?: string | null;
  isEnabled?: boolean;
  config: ConnectionConfig;
  fieldMapping?: Record<string, string> | null;
};

export type ConnectionPublic = Omit<AdvertiserAutoresponder, "config"> & {
  config: Record<string, unknown>;
};
