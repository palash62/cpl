import { getOptinTemplate, type OptinTemplateId } from "@/lib/optin-templates";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";

const TEMPLATE_BACKGROUNDS: Record<OptinTemplateId, string> = {
  aurora: "#0c0a1d",
  sunrise: "#fffbeb",
  ocean: "#f0f9ff",
  minimal: "#ffffff",
  bold: "#18181b",
  neon: "#09090f",
};

const TEMPLATE_TEXT_COLORS: Record<OptinTemplateId, { heading: string; paragraph: string }> = {
  aurora: { heading: "#f8fafc", paragraph: "#cbd5e1" },
  sunrise: { heading: "#0f172a", paragraph: "#475569" },
  ocean: { heading: "#0c4a6e", paragraph: "#0369a1" },
  minimal: { heading: "#0f172a", paragraph: "#64748b" },
  bold: { heading: "#ffffff", paragraph: "#e2e8f0" },
  neon: { heading: "#f0fdfa", paragraph: "#99f6e4" },
};

const DARK_TEMPLATES = new Set<OptinTemplateId>(["aurora", "bold", "neon"]);

export function themeFromOptinTemplate(templateId: OptinTemplateId): ThemeJson {
  const template = getOptinTemplate(templateId);
  return {
    ...DEFAULT_THEME,
    primaryColor: template.primaryColor,
    secondaryColor: template.accentColor,
    backgroundColor: TEMPLATE_BACKGROUNDS[templateId],
  };
}

function applySplitDarkLayout(
  craft: CraftSerializedState,
  templateId: OptinTemplateId,
  template: ReturnType<typeof getOptinTemplate>,
) {
  const textColors = TEMPLATE_TEXT_COLORS[templateId];

  craft.container_main = {
    ...craft.container_main,
    props: {
      ...craft.container_main.props,
      layout: {
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "40px",
        alignItems: "center",
        padding: "0 16px",
      },
    },
    nodes: ["copy_column", "form_column"],
  };

  craft.copy_column = {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      layout: {
        flex: "1 1 300px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minWidth: "280px",
      },
    },
    displayName: "Container",
    parent: "container_main",
    nodes: ["heading_main", "paragraph_main"],
    linkedNodes: {},
  };

  craft.form_column = {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      layout: {
        flex: "1 1 320px",
        maxWidth: "440px",
        minWidth: "280px",
        margin: "0 auto",
      },
    },
    displayName: "Container",
    parent: "container_main",
    nodes: ["form_main"],
    linkedNodes: {},
  };

  craft.heading_main = {
    ...craft.heading_main,
    parent: "copy_column",
    props: {
      ...craft.heading_main.props,
      text: template.headline,
      typography: {
        ...(craft.heading_main.props.typography as object),
        color: textColors.heading,
        fontSize: "2.5rem",
        fontWeight: "800",
      },
    },
  };

  craft.paragraph_main = {
    ...craft.paragraph_main,
    parent: "copy_column",
    props: {
      ...craft.paragraph_main.props,
      text: template.subheadline,
      typography: {
        ...(craft.paragraph_main.props.typography as object),
        color: textColors.paragraph,
        fontSize: "1.125rem",
      },
    },
  };

  craft.form_main = {
    ...craft.form_main,
    parent: "form_column",
  };

  craft.input_email = { ...craft.input_email, parent: "form_main" };
  craft.input_name = { ...craft.input_name, parent: "form_main" };
  craft.submit_main = { ...craft.submit_main, parent: "form_main" };
}

export function buildCraftFromOptinTemplate(templateId: OptinTemplateId): CraftSerializedState {
  const template = getOptinTemplate(templateId);
  const craft = createEmptyCraftState();
  const textColors = TEMPLATE_TEXT_COLORS[templateId];
  const backgroundColor = TEMPLATE_BACKGROUNDS[templateId];

  craft.section_main = {
    ...craft.section_main,
    props: {
      ...craft.section_main.props,
      style: { backgroundColor },
      layout: { padding: "56px 24px", width: "100%" },
    },
  };

  if (DARK_TEMPLATES.has(templateId)) {
    applySplitDarkLayout(craft, templateId, template);
    return craft;
  }

  craft.heading_main = {
    ...craft.heading_main,
    props: {
      ...craft.heading_main.props,
      text: template.headline,
      typography: {
        ...(craft.heading_main.props.typography as object),
        color: textColors.heading,
      },
    },
  };

  craft.paragraph_main = {
    ...craft.paragraph_main,
    props: {
      ...craft.paragraph_main.props,
      text: template.subheadline,
      typography: {
        ...(craft.paragraph_main.props.typography as object),
        color: textColors.paragraph,
      },
    },
  };

  return craft;
}

export function buildThankYouCraftState(): CraftSerializedState {
  const craft = createEmptyCraftState();

  craft.heading_main = {
    ...craft.heading_main,
    props: {
      ...craft.heading_main.props,
      text: "You're In! 🎉",
      typography: {
        ...(craft.heading_main.props.typography as object),
        color: "#0f172a",
      },
    },
  };

  craft.paragraph_main = {
    ...craft.paragraph_main,
    props: {
      ...craft.paragraph_main.props,
      text: "Check your inbox — your free resource is on its way.",
    },
  };

  craft.container_main = {
    ...craft.container_main,
    nodes: ["heading_main", "paragraph_main"],
  };

  delete craft.form_main;
  delete craft.input_email;
  delete craft.input_name;
  delete craft.submit_main;

  return craft;
}
