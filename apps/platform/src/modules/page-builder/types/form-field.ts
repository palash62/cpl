export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "date"
  | "number"
  | "address"
  | "city"
  | "state"
  | "country";

export type FormFieldDefinition = {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
};

export type FormJson = {
  formId: string;
  campaignId: string;
  fields: FormFieldDefinition[];
  submitButtonNodeId?: string;
  successTitle?: string;
  successMessage?: string;
};
