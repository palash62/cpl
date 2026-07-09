export { dispatchAutoresponderEvent } from "./services/dispatch.service";
export {
  listConnections,
  getConnection,
  createAdvertiserConnection,
  updateAdvertiserConnection,
  deleteAdvertiserConnection,
} from "./services/connection.service";
export { testConnection } from "./services/test.service";
export { listDeliveries } from "./repositories/delivery.repo";

export type { ConnectionInput, ConnectionPublic } from "./types/connection";
export type { LeadAutoresponderPayload } from "./types/payload";
export type {
  WebhookConfig,
  MailchimpConfig,
  AweberConfig,
  GetResponseConfig,
  SystemeConfig,
  ConnectionConfig,
} from "./types/provider";
export { DEFAULT_AUTORESPONDER_PLATFORM_CONFIG, AUTORESPONDER_SETTINGS_KEY } from "./config/defaults";
