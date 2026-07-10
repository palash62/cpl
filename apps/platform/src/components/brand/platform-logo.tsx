import { cn } from "@/lib/utils";

export interface PlatformLogoProps {
  className?: string;
  markClassName?: string;
  collapsed?: boolean;
  variant?: "default" | "sidebar";
}

export function PlatformLogo({
  className,
  markClassName,
  collapsed,
  variant = "default",
}: PlatformLogoProps) {
  if (collapsed) {
    return (
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-[#8b3dff]",
          className,
        )}
        aria-label="LEADVIX"
      >
        ✦
      </span>
    );
  }

  if (variant === "sidebar") {
    return (
      <span className={cn("inline-flex items-center gap-2.5 font-bold text-white", className)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-[#8b3dff]">
          ✦
        </span>
        <span className="text-[15px] tracking-tight">LEADVIX</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("text-[#8b3dff]", markClassName)}>✦</span>
      LEADVIX
    </span>
  );
}
