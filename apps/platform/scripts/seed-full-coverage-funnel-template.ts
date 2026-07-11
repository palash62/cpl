/**
 * Creates (or updates) the full-coverage QA funnel template for manual testing.
 * Run from repo root: npx tsx apps/platform/scripts/seed-full-coverage-funnel-template.ts
 */
import {
  createOptinFunnelTemplateByAdmin,
  listOptinFunnelTemplatesForAdmin,
  updateOptinFunnelTemplateByAdmin,
} from "../src/services/optin-funnel.service";
import {
  buildFullCoverageCraft,
  buildFullCoverageThankYouCraft,
  FULL_COVERAGE_TEMPLATE_NAME,
  FULL_COVERAGE_THEME,
} from "../tests/fixtures/full-coverage-funnel-template";

async function main() {
  const existing = (await listOptinFunnelTemplatesForAdmin()).find(
    (t) => t.name === FULL_COVERAGE_TEMPLATE_NAME,
  );

  let templateId: string;
  if (existing) {
    templateId = existing.id;
    console.log("Updating existing template:", templateId);
  } else {
    const created = await createOptinFunnelTemplateByAdmin({
      name: FULL_COVERAGE_TEMPLATE_NAME,
      primaryColor: FULL_COVERAGE_THEME.primaryColor,
      secondaryColor: FULL_COVERAGE_THEME.secondaryColor,
    });
    templateId = created.id;
    console.log("Created template:", templateId);
  }

  await updateOptinFunnelTemplateByAdmin(templateId, {
    craftState: buildFullCoverageCraft(),
    themeJson: FULL_COVERAGE_THEME,
    thankYouEnabled: true,
    thankYouCraftState: buildFullCoverageThankYouCraft(),
    thankYouThemeJson: FULL_COVERAGE_THEME,
    step: "optin",
    autosave: false,
  });

  console.log("");
  console.log("Full coverage QA funnel template ready:");
  console.log(`  Optin edit:    http://localhost:3000/admin/funnel-templates/${templateId}/edit?step=optin`);
  console.log(
    `  Optin preview: http://localhost:3000/admin/funnel-templates/${templateId}/preview?frame=1&bp=desktop`,
  );
  console.log(
    `  Thank-you edit:    http://localhost:3000/admin/funnel-templates/${templateId}/edit?step=thankYou`,
  );
  console.log(
    `  Thank-you preview: http://localhost:3000/admin/funnel-templates/${templateId}/preview?step=thankYou&frame=1&bp=desktop`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
