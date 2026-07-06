"use client";

import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FunnelRowActionsProps = {
  funnelId: string;
  slug: string;
  isPublished: boolean;
  onDuplicate: () => void;
  onArchive: () => void;
};

export function FunnelRowActions({
  funnelId,
  slug,
  isPublished,
  onDuplicate,
  onArchive,
}: FunnelRowActionsProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-500")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/advertiser/optin-funnels/${funnelId}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Open funnel
        </DropdownMenuItem>
        {isPublished && (
          <DropdownMenuItem onClick={() => window.open(`/o/${slug}`, "_blank", "noreferrer")}>
            <Eye className="mr-2 h-4 w-4" />
            Preview live
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onArchive}>
          <Trash2 className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
