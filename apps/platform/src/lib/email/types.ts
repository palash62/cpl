export type EmailTemplateId =
  | "welcome"
  | "admin_alert"
  | "approved"
  | "rejected"
  | "generic"
  | "password_changed"
  | "password_reset"
  | "email_verification"
  | "credentials"
  | "receipt";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template?: EmailTemplateId;
  metadata?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
  listUnsubscribeUrl?: string;
  attachment?: EmailAttachment;
};
