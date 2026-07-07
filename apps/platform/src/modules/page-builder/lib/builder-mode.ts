import type { BuilderConfig } from "@/modules/page-builder/lib/builder-store";

export function isGhlBuilderMode(config: BuilderConfig): boolean {
  if (config.ui === "ghl") return true;
  if (config.ui === "classic") return false;
  return (config.chromeTheme ?? "dark") === "light";
}

export function isAdminTemplateBuilder(config: BuilderConfig): boolean {
  return config.apiBasePath.includes("/admin/optin-funnel-templates");
}
