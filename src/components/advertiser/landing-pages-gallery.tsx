"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, LayoutTemplate, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type LandingPage = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
};

type Template = {
  id: string;
  name: string;
  category: string;
  isFavorite: boolean;
};

export function LandingPagesGallery() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/advertiser/landing-pages").then((r) => r.json()),
      fetch("/api/v1/advertiser/landing-pages/templates").then((r) => r.json()),
    ]).then(([pagesRes, templatesRes]) => {
      setPages(pagesRes.data ?? []);
      setTemplates(templatesRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function createFromTemplate(templateId: string, name: string) {
    const res = await fetch("/api/v1/advertiser/landing-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, templateId }),
    });
    if (!res.ok) {
      toast.error("Failed to create page");
      return;
    }
    const { data } = await res.json();
    router.push(`/advertiser/landing-pages/${data.id}/edit`);
  }

  async function duplicatePage(id: string) {
    const res = await fetch(`/api/v1/advertiser/landing-pages/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast.error("Duplicate failed");
      return;
    }
    const { data } = await res.json();
    toast.success("Page duplicated");
    router.push(`/advertiser/landing-pages/${data.id}/edit`);
  }

  async function deletePage(id: string) {
    if (!confirm("Archive this landing page?")) return;
    const res = await fetch(`/api/v1/advertiser/landing-pages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setPages((p) => p.filter((x) => x.id !== id));
    toast.success("Page archived");
  }

  async function toggleFavorite(templateId: string) {
    await fetch("/api/v1/advertiser/landing-pages/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "favorite", templateId }),
    });
    setTemplates((t) =>
      t.map((x) => (x.id === templateId ? { ...x, isFavorite: !x.isFavorite } : x)),
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Landing Pages</h2>
          <Button onClick={() => createFromTemplate("", "New Landing Page")}>
            <Plus className="mr-2 h-4 w-4" />
            Blank page
          </Button>
        </div>
        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No landing pages yet. Pick a template below or create a blank page.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{page.name}</CardTitle>
                    <Badge variant={page.status === "PUBLISHED" ? "default" : "secondary"}>
                      {page.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">/p/{page.slug}</p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Link href={`/advertiser/landing-pages/${page.id}/edit`}>
                    <Button size="sm">
                      <LayoutTemplate className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/p/${page.slug}?preview=1`} target="_blank">
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => duplicatePage(page.id)}>
                    <Copy className="mr-1 h-3 w-3" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePage(page.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Template Library</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <button type="button" onClick={() => toggleFavorite(t.id)} className="text-muted-foreground hover:text-amber-500">
                    <Star className={`h-4 w-4 ${t.isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
                  </button>
                </div>
                <p className="text-xs capitalize text-muted-foreground">{t.category.replace("_", " ")}</p>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full" onClick={() => createFromTemplate(t.id, t.name)}>
                  Use template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
