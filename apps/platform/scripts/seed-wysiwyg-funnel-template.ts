/**
 * Creates (or updates) the WYSIWYG parity test funnel template for manual QA.
 * Run from repo root: npx tsx apps/platform/scripts/seed-wysiwyg-funnel-template.ts
 */
import {
  createOptinFunnelTemplateByAdmin,
  listOptinFunnelTemplatesForAdmin,
  updateOptinFunnelTemplateByAdmin,
} from "../src/services/optin-funnel.service";
import {
  buildWysiwygTestCraft,
  WYSIWYG_TEST_TEMPLATE_NAME,
  WYSIWYG_TEST_THEME,
} from "../tests/fixtures/wysiwyg-funnel-template";

async function main() {
  const existing = (await listOptinFunnelTemplatesForAdmin()).find(
    (t) => t.name === WYSIWYG_TEST_TEMPLATE_NAME,
  );

  let templateId: string;
  if (existing) {
    templateId = existing.id;
    console.log("Updating existing template:", templateId);
  } else {
    const created = await createOptinFunnelTemplateByAdmin({
      name: WYSIWYG_TEST_TEMPLATE_NAME,
      primaryColor: WYSIWYG_TEST_THEME.primaryColor,
      secondaryColor: WYSIWYG_TEST_THEME.secondaryColor,
    });
    templateId = created.id;
    console.log("Created template:", templateId);
  }

  await updateOptinFunnelTemplateByAdmin(templateId, {
    craftState: buildWysiwygTestCraft(),
    themeJson: WYSIWYG_TEST_THEME,
    step: "optin",
    autosave: false,
  });

  console.log("");
  console.log("WYSIWYG test funnel template ready:");
  console.log(`  Edit:    http://localhost:3000/admin/funnel-templates/${templateId}/edit?step=optin`);
  console.log(
    `  Preview: http://localhost:3000/admin/funnel-templates/${templateId}/preview?frame=1&bp=desktop`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
