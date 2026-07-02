// Server-only exports — uses Prisma, fs, etc. Never import from client components.
export {
  listLandingPages,
  getLandingPage,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  duplicateLandingPage,
  publishLandingPage,
  getPublishedLandingPage,
  getLandingPageDraftPreview,
} from "@/modules/page-builder/services/landing-page.service";

export { listPageVersions, restorePageVersion } from "@/modules/page-builder/services/version.service";

export {
  seedStarterTemplates,
  listTemplates,
  toggleTemplateFavorite,
  importTemplate,
  exportTemplate,
  CATEGORIES,
} from "@/modules/page-builder/services/template.service";

export { uploadLandingPageAsset, listLandingPageAssets } from "@/modules/page-builder/services/asset.service";

export {
  onPagePublished,
  trackPageEvent,
  resolveAbVariant,
  generatePageFromPrompt,
  acquirePageLock,
} from "@/modules/page-builder/services/extension-hooks";
