import {
  Section,
  Container,
  Columns,
  Spacer,
  Divider,
  CanvasRoot,
} from "@/modules/page-builder/blocks/basic";
import { Heading, Paragraph, List } from "@/modules/page-builder/blocks/typography";
import { ImageBlock, VideoBlock, IconBlock } from "@/modules/page-builder/blocks/media";
import {
  LeadForm,
  FormInput,
  FormTextarea,
  FormCheckbox,
  FormRadio,
  FormSelect,
  SubmitButton,
} from "@/modules/page-builder/blocks/lead-form";
import {
  CtaButton,
  Countdown,
  Testimonials,
  Faq,
  PricingTable,
  FeatureCards,
  TrustBadges,
} from "@/modules/page-builder/blocks/marketing";
import {
  SocialFacebook,
  SocialInstagram,
  SocialWhatsApp,
  SocialYouTube,
} from "@/modules/page-builder/blocks/social";
import { HtmlBlock, CustomCss, EmbedCode } from "@/modules/page-builder/blocks/advanced";

export const craftResolver = {
  CanvasRoot,
  Section,
  Container,
  Columns,
  Spacer,
  Divider,
  Heading,
  Paragraph,
  List,
  Image: ImageBlock,
  Video: VideoBlock,
  Icon: IconBlock,
  LeadForm,
  FormInput,
  FormTextarea,
  FormCheckbox,
  FormRadio,
  FormSelect,
  SubmitButton,
  CtaButton,
  Countdown,
  Testimonials,
  Faq,
  PricingTable,
  FeatureCards,
  TrustBadges,
  SocialFacebook,
  SocialInstagram,
  SocialWhatsApp,
  SocialYouTube,
  HtmlBlock,
  CustomCss,
  EmbedCode,
};

export type CraftBlockName = keyof typeof craftResolver;

export const COMPONENT_LIBRARY: Array<{
  category: string;
  items: Array<{ name: CraftBlockName; label: string }>;
}> = [
  {
    category: "Basic",
    items: [
      { name: "Section", label: "Section" },
      { name: "Container", label: "Container" },
      { name: "Columns", label: "Columns" },
      { name: "Spacer", label: "Spacer" },
      { name: "Divider", label: "Divider" },
    ],
  },
  {
    category: "Typography",
    items: [
      { name: "Heading", label: "Heading" },
      { name: "Paragraph", label: "Paragraph" },
      { name: "List", label: "List" },
    ],
  },
  {
    category: "Media",
    items: [
      { name: "Image", label: "Image" },
      { name: "Video", label: "Video" },
      { name: "Icon", label: "Icon" },
    ],
  },
  {
    category: "Lead Generation",
    items: [
      { name: "LeadForm", label: "Lead Form" },
      { name: "FormInput", label: "Input" },
      { name: "FormTextarea", label: "Textarea" },
      { name: "FormCheckbox", label: "Checkbox" },
      { name: "FormRadio", label: "Radio" },
      { name: "FormSelect", label: "Dropdown" },
      { name: "SubmitButton", label: "Submit Button" },
    ],
  },
  {
    category: "Marketing",
    items: [
      { name: "CtaButton", label: "CTA Button" },
      { name: "Countdown", label: "Countdown" },
      { name: "Testimonials", label: "Testimonials" },
      { name: "Faq", label: "FAQ" },
      { name: "PricingTable", label: "Pricing Table" },
      { name: "FeatureCards", label: "Feature Cards" },
      { name: "TrustBadges", label: "Trust Badges" },
    ],
  },
  {
    category: "Social",
    items: [
      { name: "SocialFacebook", label: "Facebook" },
      { name: "SocialInstagram", label: "Instagram" },
      { name: "SocialWhatsApp", label: "WhatsApp" },
      { name: "SocialYouTube", label: "YouTube" },
    ],
  },
  {
    category: "Advanced",
    items: [
      { name: "HtmlBlock", label: "HTML Block" },
      { name: "CustomCss", label: "Custom CSS" },
      { name: "EmbedCode", label: "Embed Code" },
    ],
  },
];
