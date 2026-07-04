import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";

export type CraftNode = {
  type: { resolvedName: string };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName?: string;
  parent: string | null;
  nodes: string[];
  linkedNodes?: Record<string, string>;
  hidden?: boolean;
  custom?: Record<string, unknown>;
};

export type CraftSerializedState = Record<string, CraftNode>;

export type PageDocumentMeta = {
  schemaVersion: 1;
  editorBreakPoint: "desktop" | "tablet" | "mobile";
};

export type PageDocument = {
  craft: CraftSerializedState;
  meta: PageDocumentMeta;
};

export type LandingPageSnapshot = {
  id: string;
  slug: string;
  name: string;
  status: string;
  campaignId: string | null;
  craftState: PageDocument;
  themeJson: ThemeJson;
  formJson: FormJson | null;
  publishedVersionId: string | null;
  autosaveAt: string | null;
  updatedAt: string;
};

export type TemplateExport = {
  templateMeta: {
    name: string;
    category: string;
    schemaVersion: 1;
  };
  craft: CraftSerializedState;
  theme: ThemeJson;
};
