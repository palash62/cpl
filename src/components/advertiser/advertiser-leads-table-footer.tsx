"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdvertiserLeadsTableFooter({
  page,
  totalPages,
  total,
  perPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pageHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    return `${pathname}?${params.toString()}`;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-sm text-slate-600">
        Total ({total}) Per Page ({perPage})
      </p>
      {totalPages > 1 && (
        <div className="flex gap-1">
          {prevDisabled ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
              <ChevronLeft className="h-4 w-4" />
            </span>
          ) : (
            <Link
              href={pageHref(page - 1)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          <span className="inline-flex h-8 items-center px-2 text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          {nextDisabled ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300">
              <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <Link
              href={pageHref(page + 1)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
