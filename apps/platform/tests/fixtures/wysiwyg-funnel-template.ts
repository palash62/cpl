import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

/** Distinctive gold/green design for editor ↔ preview parity checks. */
export const WYSIWYG_TEST_THEME: ThemeJson = {
  primaryColor: "#D4AF37",
  secondaryColor: "#22c55e",
  backgroundColor: "#ffffff",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "solid",
  borderRadius: "8px",
  spacingScale: "normal",
};

export const WYSIWYG_TEST_TEMPLATE_NAME = "WYSIWYG Parity Test Template";

export function buildWysiwygTestCraft(): CraftSerializedState {
  const craft = createEmptyCraftState();

  craft.heading_main = {
    ...craft.heading_main,
    props: {
      text: "Discover The Online Business System",
      level: 2,
      typography: {
        fontSize: "2rem",
        fontWeight: "700",
        textAlign: "center",
        color: "#22c55e",
      },
    },
  };

  craft.paragraph_main = {
    ...craft.paragraph_main,
    props: {
      text: "Tell Us Where To Send Free Access Details:",
      typography: { fontSize: "1.125rem", textAlign: "center", color: "#0f172a", lineHeight: "1.6" },
    },
  };

  craft.submit_main = {
    ...craft.submit_main,
    props: {
      text: "Get Instant Access",
      buttonAppearance: { backgroundColor: "#D4AF37", textColor: "#ffffff" },
    },
  };

  return craft;
}
