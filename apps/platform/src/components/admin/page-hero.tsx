import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, description, badge, className }: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] px-6 py-5 shadow-md",
        className,
      )}
      style={{
        backgroundImage: "linear-gradient(to right, var(--theme-hero-from), var(--theme-hero-to))",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white" />
        <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white" />
      </div>
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
          {description && (
            <p className="mt-1 max-w-lg text-sm text-white/80">{description}</p>
          )}
        </div>
        {badge && (
          typeof badge === "string" ? (
            <Badge className="w-fit border-white/20 bg-white/15 px-3 py-1 text-sm text-white backdrop-blur-sm hover:bg-white/20">
              {badge}
            </Badge>
          ) : (
            badge
          )
        )}
      </div>
    </div>
  );
}
