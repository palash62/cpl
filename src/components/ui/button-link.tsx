import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonLinkProps = VariantProps<typeof buttonVariants> & {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  className,
  children,
  variant = "default",
  size = "default",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
