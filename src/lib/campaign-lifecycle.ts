import type { CampaignStatus } from "@prisma/client";

export type CampaignAction = "view" | "edit" | "delete" | "full_edit";

export type CampaignLifecycleInput = {
  status: CampaignStatus;
  leadCount: number;
};

const LIMITED_EDIT_FIELDS = new Set([
  "description",
  "dailyCap",
  "monthlyCap",
  "targeting",
  "publisherAccess",
  "autoApprove",
  "status",
]);

const FULL_EDIT_FIELDS = new Set([
  ...LIMITED_EDIT_FIELDS,
  "name",
  "cpl",
  "budget",
  "category",
  "advertiserId",
  "fields",
]);

export function canAdminViewCampaign(_campaign: CampaignLifecycleInput) {
  return true;
}

export function canAdminEditCampaign(campaign: CampaignLifecycleInput) {
  if (campaign.status === "COMPLETED" || campaign.status === "ARCHIVED") {
    return false;
  }
  return true;
}

export function isFullEditCampaign(campaign: CampaignLifecycleInput) {
  return campaign.status === "DRAFT" || campaign.status === "PENDING";
}

export function canAdminDeleteCampaign(campaign: CampaignLifecycleInput) {
  if (campaign.leadCount > 0) return false;
  if (campaign.status === "ACTIVE" || campaign.status === "PAUSED") return false;
  if (campaign.status === "COMPLETED" || campaign.status === "ARCHIVED") return false;
  return campaign.status === "DRAFT" || campaign.status === "PENDING";
}

export function getEditableFields(campaign: CampaignLifecycleInput): Set<string> {
  if (!canAdminEditCampaign(campaign)) return new Set();
  if (isFullEditCampaign(campaign)) return FULL_EDIT_FIELDS;
  return LIMITED_EDIT_FIELDS;
}

export function assertFieldEditable(
  campaign: CampaignLifecycleInput,
  field: string,
) {
  const allowed = getEditableFields(campaign);
  if (!allowed.has(field)) {
    return false;
  }
  return true;
}

const STATUS_TRANSITIONS: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
  DRAFT: ["PENDING", "ACTIVE", "ARCHIVED"],
  PENDING: ["ACTIVE", "ARCHIVED", "DRAFT"],
  ACTIVE: ["PAUSED", "COMPLETED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "ARCHIVED", "COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionStatus(from: CampaignStatus, to: CampaignStatus) {
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedStatusTransitions(status: CampaignStatus): CampaignStatus[] {
  return STATUS_TRANSITIONS[status] ?? [];
}
