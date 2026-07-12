/** Escape sequences that would break out of a script tag in srcdoc HTML. */
function escapeScriptContent(source: string): string {
  return source.replace(/<\/script/gi, "<\\/script");
}

export const CUSTOM_CODE_DEFAULT_HTML =
  '<div class="custom-code-block">\n  <p>Custom code</p>\n</div>';

export const CUSTOM_CODE_SANDBOX =
  "allow-scripts allow-forms allow-popups" as const;

export function buildCustomCodeSrcdoc(html: string, css: string, js: string): string {
  const safeHtml = html ?? "";
  const safeCss = css ?? "";
  const safeJs = escapeScriptContent(js ?? "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
    ${safeCss}
  </style>
</head>
<body>
${safeHtml}
${safeJs ? `<script>${safeJs}</script>` : ""}
</body>
</html>`;
}

export function hasCustomCodeContent(
  html: string,
  css: string,
  js: string,
): boolean {
  return Boolean(html.trim() || css.trim() || js.trim());
}
