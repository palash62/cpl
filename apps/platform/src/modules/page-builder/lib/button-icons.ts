import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Mail,
  Megaphone,
  Play,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

export const BUTTON_ICON_OPTIONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "", label: "None", Icon: Megaphone },
  { name: "ArrowRight", label: "Arrow", Icon: ArrowRight },
  { name: "ChevronRight", label: "Chevron", Icon: ChevronRight },
  { name: "Check", label: "Check", Icon: Check },
  { name: "Send", label: "Send", Icon: Send },
  { name: "Mail", label: "Mail", Icon: Mail },
  { name: "Download", label: "Download", Icon: Download },
  { name: "ExternalLink", label: "External", Icon: ExternalLink },
  { name: "Play", label: "Play", Icon: Play },
  { name: "ShoppingCart", label: "Cart", Icon: ShoppingCart },
  { name: "Star", label: "Star", Icon: Star },
  { name: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { name: "Zap", label: "Zap", Icon: Zap },
];

const ICON_MAP = Object.fromEntries(
  BUTTON_ICON_OPTIONS.filter((o) => o.name).map((o) => [o.name, o.Icon]),
);

export function resolveButtonIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? null;
}
