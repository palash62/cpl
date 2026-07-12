export type LeadEmailField = {
  fieldName: string;
  fieldType: string;
};

/** Resolve the lead email from submitted form data and optional field definitions. */
export function resolveLeadEmail(
  data: Record<string, string>,
  fields?: LeadEmailField[],
): string | undefined {
  const direct = data.email?.trim();
  if (direct) return direct.toLowerCase();

  if (fields?.length) {
    for (const field of fields) {
      if (field.fieldType !== "email") continue;
      const value = data[field.fieldName]?.trim();
      if (value) return value.toLowerCase();
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes("email")) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed.toLowerCase();
    }
  }

  return undefined;
}

/** Copy lead data with a normalized `email` key when resolvable. */
export function withResolvedLeadEmail(
  data: Record<string, string>,
  fields?: LeadEmailField[],
): Record<string, string> {
  const email = resolveLeadEmail(data, fields);
  if (!email) return data;
  return { ...data, email };
}
