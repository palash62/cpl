import { craftResolver } from "@/modules/page-builder/blocks/index";
import { createRowWithColumns } from "@/modules/page-builder/lib/row-column";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { linkChildren, makeNode, mergeCraftStates } from "./craft-node";

export const FULL_COVERAGE_TEMPLATE_NAME = "Full Coverage Page Builder QA";

export const FULL_COVERAGE_THEME: ThemeJson = {
  primaryColor: "#7c3aed",
  secondaryColor: "#f97316",
  backgroundColor: "#0f172a",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "solid",
  borderRadius: "10px",
  spacingScale: "normal",
};

export type BlockMarker = {
  text?: string;
  color?: string;
  bgColor?: string;
  role?: "heading" | "button" | "text";
};

/** Searchable markers and expected styles for parity assertions. */
export const BLOCK_MARKERS: Record<string, BlockMarker> = {
  Heading: { text: "[BLOCK:Heading-H2]", color: "rgb(168, 85, 247)", role: "heading" },
  Paragraph: { text: "[BLOCK:Paragraph]", color: "rgb(253, 186, 116)", role: "text" },
  List: { text: "[BLOCK:List-item-1]" },
  CtaButton: { text: "[BLOCK:CtaButton]", bgColor: "rgb(124, 58, 237)", role: "button" },
  SubmitButton: { text: "[BLOCK:SubmitButton]", bgColor: "rgb(212, 175, 55)", role: "button" },
  Testimonials: { text: "[BLOCK:Testimonial-quote]" },
  Faq: { text: "[BLOCK:Faq-question]" },
  PricingTable: { text: "[BLOCK:Pricing-plan]" },
  ProgressBar: { text: "[BLOCK:ProgressBar-label]" },
  HtmlBlock: { text: "[BLOCK:HtmlBlock]" },
  FormInput: { text: "[BLOCK:FormInput-email]" },
  FormTextarea: { text: "[BLOCK:FormTextarea]" },
  FormCheckbox: { text: "[BLOCK:FormCheckbox]" },
  FormRadio: { text: "[BLOCK:FormRadio]" },
  FormSelect: { text: "[BLOCK:FormSelect]" },
};

export const THANK_YOU_BLOCK_MARKERS: Record<string, BlockMarker> = {
  ThankYouHeading: { text: "[BLOCK:ThankYou-Heading]", color: "rgb(34, 197, 94)", role: "heading" },
};

export type BlockMarkerWithDom = BlockMarker & { domOnly?: boolean };

/** DOM-only markers rendered by stub blocks (not stored in craft JSON). */
export const DOM_ONLY_MARKERS: BlockMarkerWithDom[] = [
  { text: "Subscribe to Mailing List", role: "button", domOnly: true },
  { text: "Excellent quality leads", domOnly: true },
  { text: "Home", domOnly: true },
  { text: "Quick survey", domOnly: true },
  { text: "Feature headline", domOnly: true },
  { text: "How to scale leads", domOnly: true },
  { text: "Marketing", domOnly: true },
  { text: "Share on Facebook", domOnly: true },
  { text: "Stripe", domOnly: true },
  { text: "Facebook", domOnly: true },
  { text: "Instagram", domOnly: true },
  { text: "WhatsApp", domOnly: true },
  { text: "YouTube", domOnly: true },
  { text: "★", domOnly: true },
  { text: "Add video embed URL", domOnly: true },
  { text: "Add a valid HTTPS embed URL", domOnly: true },
];

/** Markers stored in craft JSON (unit-testable without browser). */
export const CRAFT_JSON_MARKERS = Object.values(BLOCK_MARKERS)
  .map((m) => m.text)
  .filter((text): text is string => Boolean(text));

/** Tier A: all marker strings that must appear in editor + preview. */
export const TIER_A_MARKERS = [
  ...CRAFT_JSON_MARKERS,
  ...DOM_ONLY_MARKERS.map((m) => m.text).filter((text): text is string => Boolean(text)),
];

export const ALL_RESOLVER_NAMES = Object.keys(craftResolver) as Array<keyof typeof craftResolver>;

function sectionContainer(
  sectionId: string,
  containerId: string,
  sectionName: string,
  bgColor: string,
  childIds: string[],
): CraftSerializedState {
  return {
    [sectionId]: makeNode({
      id: sectionId,
      type: "Section",
      parent: "ROOT",
      isCanvas: true,
      displayName: sectionName,
      children: [containerId],
      props: {
        name: sectionName,
        style: { backgroundColor: bgColor },
        layout: { padding: "32px 24px" },
      },
    }),
    [containerId]: makeNode({
      id: containerId,
      type: "Container",
      parent: sectionId,
      isCanvas: true,
      displayName: "Container",
      children: childIds,
      props: {
        layout: {
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        },
      },
    }),
  };
}

export function buildFullCoverageCraft(): CraftSerializedState {
  const layoutBlocks: CraftSerializedState = {
    spacer_layout: makeNode({
      id: "spacer_layout",
      type: "Spacer",
      parent: "cont_layout",
      props: { height: "24px" },
    }),
    divider_layout: makeNode({
      id: "divider_layout",
      type: "Divider",
      parent: "cont_layout",
      props: {
        style: { borderTop: "3px solid #7c3aed" },
        layout: { margin: "8px 0" },
      },
    }),
    heading_h1: makeNode({
      id: "heading_h1",
      type: "Heading",
      parent: "row_layout_col_0",
      props: {
        text: "[BLOCK:Heading-H1] Layout Column A",
        level: 1,
        typography: { fontSize: "1.5rem", fontWeight: "700", color: "#e2e8f0" },
      },
    }),
    heading_responsive: makeNode({
      id: "heading_responsive",
      type: "Heading",
      parent: "row_layout_col_1",
      props: {
        text: "[BLOCK:Heading-Responsive] Tablet Purple",
        level: 3,
        typography: { fontSize: "1.25rem", fontWeight: "600", color: "#f97316" },
        responsive: {
          tablet: { typography: { color: "#a855f7", fontSize: "1.1rem" } },
          mobile: { visible: false },
        },
      },
    }),
    heading_h3: makeNode({
      id: "heading_h3",
      type: "Heading",
      parent: "row_layout_col_2",
      props: {
        text: "[BLOCK:Heading-H3] Layout Column C",
        level: 3,
        typography: { fontSize: "1rem", color: "#94a3b8" },
      },
    }),
  };

  const rowState = createRowWithColumns("row_layout", "cont_layout", 3);
  rowState.row_layout_col_0.nodes = ["heading_h1"];
  rowState.row_layout_col_0.parent = "row_layout";
  rowState.row_layout_col_1.nodes = ["heading_responsive"];
  rowState.row_layout_col_1.parent = "row_layout";
  rowState.row_layout_col_2.nodes = ["heading_h3"];
  rowState.row_layout_col_2.parent = "row_layout";

  const typographyBlocks: CraftSerializedState = {
    heading_typo: makeNode({
      id: "heading_typo",
      type: "Heading",
      parent: "cont_typography",
      props: {
        text: "[BLOCK:Heading-H2] Full Coverage Typography",
        level: 2,
        typography: {
          fontSize: "2rem",
          fontWeight: "700",
          textAlign: "center",
          color: "#a855f7",
        },
      },
    }),
    paragraph_typo: makeNode({
      id: "paragraph_typo",
      type: "Paragraph",
      parent: "cont_typography",
      props: {
        text: "[BLOCK:Paragraph] Every block type is represented in this QA template.",
        typography: {
          fontSize: "1.125rem",
          textAlign: "center",
          color: "#fdba74",
          lineHeight: "1.6",
        },
      },
    }),
    list_ordered: makeNode({
      id: "list_ordered",
      type: "List",
      parent: "cont_typography",
      props: {
        items: ["[BLOCK:List-item-1] Editor parity", "[BLOCK:List-item-2] Preview parity", "[BLOCK:List-item-3] Publish parity"],
        ordered: true,
        typography: { color: "#c4b5fd" },
      },
    }),
    list_unordered: makeNode({
      id: "list_unordered",
      type: "List",
      parent: "cont_typography",
      props: {
        items: ["[BLOCK:List-item-1]", "[BLOCK:List-item-2]", "[BLOCK:List-item-3]"],
        ordered: false,
        markerStyle: "check",
        markerColor: "#22c55e",
        typography: { color: "#fde68a", textAlign: "center" },
      },
    }),
  };

  const mediaBlocks: CraftSerializedState = {
    image_media: makeNode({
      id: "image_media",
      type: "Image",
      parent: "cont_media",
      props: {
        src: "https://placehold.co/800x200/7c3aed/ffffff?text=%5BBLOCK%3AImage%5D",
        alt: "[BLOCK:Image-alt]",
        style: { borderRadius: "12px" },
      },
    }),
    video_media: makeNode({
      id: "video_media",
      type: "Video",
      parent: "cont_media",
      props: { url: "" },
    }),
    icon_media: makeNode({
      id: "icon_media",
      type: "Icon",
      parent: "cont_media",
      props: {
        icon: "★",
        size: "2.5rem",
        typography: { textAlign: "center", color: "#f97316" },
      },
    }),
  };

  const formBlocks: CraftSerializedState = {
    form_main: makeNode({
      id: "form_main",
      type: "LeadForm",
      parent: "cont_form",
      isCanvas: true,
      children: [
        "input_email",
        "input_phone",
        "input_text",
        "textarea_msg",
        "checkbox_agree",
        "radio_choice",
        "select_plan",
        "submit_main",
      ],
      props: {
        successTitle: "You're in!",
        successMessage: "Check your inbox.",
        style: { backgroundColor: "#1e1b4b", borderRadius: "12px" },
        layout: { padding: "24px", gap: "12px" },
      },
    }),
    input_email: makeNode({
      id: "input_email",
      type: "FormInput",
      parent: "form_main",
      props: {
        name: "email",
        label: "[BLOCK:FormInput-email]",
        fieldType: "email",
        required: true,
        placeholder: "you@example.com",
      },
    }),
    input_phone: makeNode({
      id: "input_phone",
      type: "FormInput",
      parent: "form_main",
      props: {
        name: "phone",
        label: "[BLOCK:FormInput-phone]",
        fieldType: "phone",
        required: true,
        placeholder: "+1 555 0100",
      },
    }),
    input_text: makeNode({
      id: "input_text",
      type: "FormInput",
      parent: "form_main",
      props: {
        name: "name",
        label: "[BLOCK:FormInput-name]",
        fieldType: "text",
        required: true,
        placeholder: "Jane Doe",
      },
    }),
    textarea_msg: makeNode({
      id: "textarea_msg",
      type: "FormTextarea",
      parent: "form_main",
      props: {
        name: "message",
        label: "[BLOCK:FormTextarea]",
        required: true,
        placeholder: "Your message",
      },
    }),
    checkbox_agree: makeNode({
      id: "checkbox_agree",
      type: "FormCheckbox",
      parent: "form_main",
      props: { name: "agree", label: "[BLOCK:FormCheckbox]" },
    }),
    radio_choice: makeNode({
      id: "radio_choice",
      type: "FormRadio",
      parent: "form_main",
      props: {
        name: "choice",
        label: "[BLOCK:FormRadio]",
        options: [
          { label: "Option Alpha", value: "a" },
          { label: "Option Beta", value: "b" },
        ],
      },
    }),
    select_plan: makeNode({
      id: "select_plan",
      type: "FormSelect",
      parent: "form_main",
      props: {
        name: "plan",
        label: "[BLOCK:FormSelect]",
        required: true,
        options: [
          { label: "Starter", value: "starter" },
          { label: "Pro", value: "pro" },
        ],
      },
    }),
    submit_main: makeNode({
      id: "submit_main",
      type: "SubmitButton",
      parent: "form_main",
      props: {
        text: "[BLOCK:SubmitButton]",
        buttonAppearance: { backgroundColor: "#D4AF37", textColor: "#ffffff" },
        typography: { fontSize: "16px" },
        layout: { width: "200px", blockAlign: "center" },
      },
    }),
  };

  const marketingBlocks: CraftSerializedState = {
    cta_marketing: makeNode({
      id: "cta_marketing",
      type: "CtaButton",
      parent: "cont_marketing",
      props: {
        text: "[BLOCK:CtaButton]",
        href: "#form",
        buttonAppearance: { backgroundColor: "#7c3aed", textColor: "#ffffff" },
        typography: { fontSize: "16px" },
      },
    }),
    countdown_marketing: makeNode({
      id: "countdown_marketing",
      type: "Countdown",
      parent: "cont_marketing",
      props: {
        targetDate: new Date(Date.now() + 86400000).toISOString(),
        typography: { fontSize: "1.25rem", fontWeight: "700", textAlign: "center", color: "#a855f7" },
      },
    }),
    minute_timer: makeNode({ id: "minute_timer", type: "MinuteTimer", parent: "cont_marketing", props: {} }),
    day_timer: makeNode({ id: "day_timer", type: "DayTimer", parent: "cont_marketing", props: {} }),
    testimonials: makeNode({
      id: "testimonials",
      type: "Testimonials",
      parent: "cont_marketing",
      props: {
        items: [{ quote: "[BLOCK:Testimonial-quote]", author: "QA Tester", role: "Admin" }],
      },
    }),
    faq: makeNode({
      id: "faq",
      type: "Faq",
      parent: "cont_marketing",
      props: {
        items: [{ question: "[BLOCK:Faq-question]", answer: "Editor and preview must match." }],
      },
    }),
    pricing: makeNode({
      id: "pricing",
      type: "PricingTable",
      parent: "cont_marketing",
      props: {
        plans: [{ name: "[BLOCK:Pricing-plan]", price: "$49/mo", features: ["All blocks", "WYSIWYG parity"] }],
      },
    }),
    features: makeNode({
      id: "features",
      type: "FeatureCards",
      parent: "cont_marketing",
      props: {
        features: [{ title: "[BLOCK:FeatureCards]", description: "High converting layouts." }],
      },
    }),
    trust_badges: makeNode({
      id: "trust_badges",
      type: "TrustBadges",
      parent: "cont_marketing",
      props: { badges: ["[BLOCK:TrustBadges-1]", "[BLOCK:TrustBadges-2]"] },
    }),
    progress_bar: makeNode({
      id: "progress_bar",
      type: "ProgressBar",
      parent: "cont_marketing",
      props: { label: "[BLOCK:ProgressBar-label]", value: 72, max: 100, showValue: true },
    }),
    map_block: makeNode({
      id: "map_block",
      type: "MapBlock",
      parent: "cont_marketing",
      props: { location: "San Francisco, CA", height: 200 },
    }),
    calendar_block: makeNode({
      id: "calendar_block",
      type: "CalendarBlock",
      parent: "cont_marketing",
      props: { embedUrl: "", height: 200 },
    }),
    blog_posts: makeNode({ id: "blog_posts", type: "BlogPosts", parent: "cont_marketing", props: {} }),
    category_nav: makeNode({ id: "category_nav", type: "CategoryNavigation", parent: "cont_marketing", props: {} }),
    social_share: makeNode({ id: "social_share", type: "SocialShare", parent: "cont_marketing", props: {} }),
    subscribe: makeNode({ id: "subscribe", type: "SubscribeToMailingList", parent: "cont_marketing", props: {} }),
    image_slider: makeNode({ id: "image_slider", type: "ImageSlider", parent: "cont_marketing", props: {} }),
    photo_gallery: makeNode({ id: "photo_gallery", type: "PhotoGallery", parent: "cont_marketing", props: {} }),
    logo_showcase: makeNode({ id: "logo_showcase", type: "LogoShowcase", parent: "cont_marketing", props: {} }),
    survey: makeNode({ id: "survey", type: "Survey", parent: "cont_marketing", props: {} }),
    reviews: makeNode({ id: "reviews", type: "Reviews", parent: "cont_marketing", props: {} }),
    nav_menu: makeNode({ id: "nav_menu", type: "NavigationMenu", parent: "cont_marketing", props: {} }),
    image_feature: makeNode({ id: "image_feature", type: "ImageFeature", parent: "cont_marketing", props: {} }),
  };

  const socialBlocks: CraftSerializedState = {
    social_fb: makeNode({
      id: "social_fb",
      type: "SocialFacebook",
      parent: "cont_social",
      props: { url: "https://facebook.com" },
    }),
    social_ig: makeNode({
      id: "social_ig",
      type: "SocialInstagram",
      parent: "cont_social",
      props: { url: "https://instagram.com" },
    }),
    social_wa: makeNode({
      id: "social_wa",
      type: "SocialWhatsApp",
      parent: "cont_social",
      props: { url: "https://wa.me" },
    }),
    social_yt: makeNode({
      id: "social_yt",
      type: "SocialYouTube",
      parent: "cont_social",
      props: { url: "https://youtube.com" },
    }),
    social_group: makeNode({
      id: "social_group",
      type: "SocialIconsGroup",
      parent: "cont_social",
      props: { iconSet: "brand", iconSize: 40 },
    }),
  };

  const advancedBlocks: CraftSerializedState = {
    html_block: makeNode({
      id: "html_block",
      type: "HtmlBlock",
      parent: "cont_advanced",
      props: {
        html: '<p style="color:#a855f7;font-weight:700">[BLOCK:HtmlBlock] Custom HTML rendered safely.</p>',
      },
    }),
    custom_css: makeNode({
      id: "custom_css",
      type: "CustomCss",
      parent: "cont_advanced",
      props: {
        css: "#pb-page .pb-custom-css-target { color: #f97316; font-weight: 600; }",
        scopeId: "pb-page",
      },
    }),
    css_target: makeNode({
      id: "css_target",
      type: "Paragraph",
      parent: "cont_advanced",
      props: {
        text: "[BLOCK:CustomCss-target] Scoped orange text",
        typography: { color: "#64748b" },
        name: "pb-custom-css-target",
      },
    }),
    embed_block: makeNode({
      id: "embed_block",
      type: "EmbedCode",
      parent: "cont_advanced",
      props: { embedUrl: "" },
    }),
  };

  const sections = mergeCraftStates(
    sectionContainer("section_layout", "cont_layout", "Layout Blocks", "#1e1b4b", [
      "spacer_layout",
      "divider_layout",
      "row_layout",
    ]),
    sectionContainer("section_typography", "cont_typography", "Typography Blocks", "#312e81", [
      "heading_typo",
      "paragraph_typo",
      "list_ordered",
      "list_unordered",
    ]),
    sectionContainer("section_media", "cont_media", "Media Blocks", "#1e293b", [
      "image_media",
      "video_media",
      "icon_media",
    ]),
    sectionContainer("section_form", "cont_form", "Lead Form Blocks", "#0f172a", ["form_main"]),
    sectionContainer("section_marketing", "cont_marketing", "Marketing Blocks", "#1e1b4b", [
      "cta_marketing",
      "countdown_marketing",
      "minute_timer",
      "day_timer",
      "testimonials",
      "faq",
      "pricing",
      "features",
      "trust_badges",
      "progress_bar",
      "map_block",
      "calendar_block",
      "blog_posts",
      "category_nav",
      "social_share",
      "subscribe",
      "image_slider",
      "photo_gallery",
      "logo_showcase",
      "survey",
      "reviews",
      "nav_menu",
      "image_feature",
    ]),
    sectionContainer("section_social", "cont_social", "Social Blocks", "#312e81", [
      "social_fb",
      "social_ig",
      "social_wa",
      "social_yt",
      "social_group",
    ]),
    sectionContainer("section_advanced", "cont_advanced", "Advanced Blocks", "#0f172a", [
      "html_block",
      "custom_css",
      "css_target",
      "embed_block",
    ]),
  );

  const root: CraftSerializedState = {
    ROOT: makeNode({
      id: "ROOT",
      type: "CanvasRoot",
      parent: null,
      isCanvas: true,
      displayName: "Page",
      children: [
        "section_layout",
        "section_typography",
        "section_media",
        "section_form",
        "section_marketing",
        "section_social",
        "section_advanced",
      ],
      props: {},
    }),
  };

  return mergeCraftStates(
    root,
    sections,
    layoutBlocks,
    rowState,
    typographyBlocks,
    mediaBlocks,
    formBlocks,
    marketingBlocks,
    socialBlocks,
    advancedBlocks,
  );
}

export function buildFullCoverageThankYouCraft(): CraftSerializedState {
  const craft: CraftSerializedState = {
    ROOT: makeNode({
      id: "ROOT",
      type: "CanvasRoot",
      parent: null,
      isCanvas: true,
      displayName: "Page",
      children: ["section_thankyou"],
      props: {},
    }),
    section_thankyou: makeNode({
      id: "section_thankyou",
      type: "Section",
      parent: "ROOT",
      isCanvas: true,
      displayName: "Thank You Section",
      children: ["cont_thankyou"],
      props: {
        name: "Thank You",
        style: { backgroundColor: "#14532d" },
        layout: { padding: "48px 24px" },
      },
    }),
    cont_thankyou: makeNode({
      id: "cont_thankyou",
      type: "Container",
      parent: "section_thankyou",
      isCanvas: true,
      displayName: "Container",
      children: ["heading_thankyou", "paragraph_thankyou", "list_thankyou", "icon_thankyou", "cta_thankyou"],
      props: {
        layout: {
          maxWidth: "640px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        },
      },
    }),
    heading_thankyou: makeNode({
      id: "heading_thankyou",
      type: "Heading",
      parent: "cont_thankyou",
      props: {
        text: "[BLOCK:ThankYou-Heading] You're All Set!",
        level: 2,
        typography: {
          fontSize: "2rem",
          fontWeight: "700",
          textAlign: "center",
          color: "#22c55e",
        },
      },
    }),
    paragraph_thankyou: makeNode({
      id: "paragraph_thankyou",
      type: "Paragraph",
      parent: "cont_thankyou",
      props: {
        text: "[BLOCK:ThankYou-Paragraph] Thank you page parity check.",
        typography: { textAlign: "center", color: "#bbf7d0", lineHeight: "1.6" },
      },
    }),
    list_thankyou: makeNode({
      id: "list_thankyou",
      type: "List",
      parent: "cont_thankyou",
      props: {
        items: ["[BLOCK:ThankYou-List-1]", "[BLOCK:ThankYou-List-2]"],
        ordered: false,
        typography: { color: "#86efac" },
      },
    }),
    icon_thankyou: makeNode({
      id: "icon_thankyou",
      type: "Icon",
      parent: "cont_thankyou",
      props: {
        icon: "✓",
        size: "3rem",
        typography: { textAlign: "center", color: "#22c55e" },
      },
    }),
    cta_thankyou: makeNode({
      id: "cta_thankyou",
      type: "CtaButton",
      parent: "cont_thankyou",
      props: {
        text: "[BLOCK:ThankYou-Cta]",
        href: "https://example.com",
        buttonAppearance: { backgroundColor: "#22c55e", textColor: "#ffffff" },
      },
    }),
  };

  return craft;
}

export function collectResolverNamesInCraft(craft: CraftSerializedState): Set<string> {
  const names = new Set<string>();
  for (const node of Object.values(craft)) {
    const name = (node.type as { resolvedName?: string })?.resolvedName;
    if (name) names.add(name);
  }
  return names;
}

export const THANK_YOU_MARKERS = [
  "[BLOCK:ThankYou-Heading]",
  "[BLOCK:ThankYou-Paragraph]",
  "[BLOCK:ThankYou-List-1]",
  "[BLOCK:ThankYou-Cta]",
];
