"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SerializedCpaOffer } from "@/services/cpa-offer.service";

export type CpaOfferFormValues = {
  name: string;
  network: string;
  category: string;
  country: string;
  previewUrl: string;
  trackingUrl: string;
  payout: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
};

type AdminCpaOfferFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  offer?: SerializedCpaOffer | null;
  onSubmit: (values: CpaOfferFormValues) => void;
};

const emptyValues: CpaOfferFormValues = {
  name: "",
  network: "",
  category: "",
  country: "",
  previewUrl: "",
  trackingUrl: "",
  payout: "",
  status: "PAUSED",
};

export function AdminCpaOfferFormDialog({
  open,
  onOpenChange,
  loading,
  offer,
  onSubmit,
}: AdminCpaOfferFormDialogProps) {
  const [values, setValues] = useState<CpaOfferFormValues>(emptyValues);
  const [copied, setCopied] = useState(false);
  const isEdit = Boolean(offer);

  useEffect(() => {
    if (!open) return;
    if (offer) {
      setValues({
        name: offer.name,
        network: offer.network,
        category: offer.category,
        country: offer.country,
        previewUrl: offer.previewUrl,
        trackingUrl: offer.trackingUrl,
        payout: offer.payout,
        status: offer.status,
      });
    } else {
      setValues(emptyValues);
    }
    setCopied(false);
  }, [open, offer]);

  const payoutNumber = Number(values.payout);
  const canSubmit =
    values.name.trim().length >= 2 &&
    values.network.trim().length >= 1 &&
    values.category.trim().length >= 1 &&
    values.country.trim().length >= 1 &&
    values.previewUrl.trim().length >= 1 &&
    values.trackingUrl.trim().length >= 1 &&
    Number.isFinite(payoutNumber) &&
    payoutNumber > 0;

  async function copyPostback() {
    if (!offer?.postbackUrl) return;
    await navigator.clipboard.writeText(offer.postbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit CPA offer" : "Add CPA offer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpa-name">Offer name</Label>
            <Input
              id="cpa-name"
              value={values.name}
              onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Finance Lead US"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpa-network">Network</Label>
              <Input
                id="cpa-network"
                value={values.network}
                onChange={(e) => setValues((prev) => ({ ...prev, network: e.target.value }))}
                placeholder="MaxBounty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpa-category">Category</Label>
              <Input
                id="cpa-category"
                value={values.category}
                onChange={(e) => setValues((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Finance"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpa-country">Country</Label>
              <Input
                id="cpa-country"
                value={values.country}
                onChange={(e) => setValues((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="US, CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpa-payout">Payout</Label>
              <Input
                id="cpa-payout"
                type="number"
                min="0"
                step="0.01"
                value={values.payout}
                onChange={(e) => setValues((prev) => ({ ...prev, payout: e.target.value }))}
                placeholder="25.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpa-preview">Preview URL</Label>
            <Input
              id="cpa-preview"
              value={values.previewUrl}
              onChange={(e) => setValues((prev) => ({ ...prev, previewUrl: e.target.value }))}
              placeholder="https://example.com/preview"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpa-tracking">Tracking URL</Label>
            <Input
              id="cpa-tracking"
              value={values.trackingUrl}
              onChange={(e) => setValues((prev) => ({ ...prev, trackingUrl: e.target.value }))}
              placeholder="https://network.com/track?aff=..."
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={values.status}
              onValueChange={(v) => {
                if (!v) return;
                setValues((prev) => ({
                  ...prev,
                  status: v as CpaOfferFormValues["status"],
                }));
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {offer ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Label>Postback URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={offer.postbackUrl}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs text-slate-700"
                />
                <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={copyPostback}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Generated automatically. Networks replace {"{click_id}"} and {"{payout}"}.
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" disabled={!canSubmit || loading} onClick={() => onSubmit(values)}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create offer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
