import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLATFORM_PIXEL_CONFIG,
  googleAdsSendTo,
  isValidGoogleConversionId,
  isValidMetaPixelId,
  normalizeGoogleConversionId,
  normalizePlatformPixelInput,
  parsePlatformPixelConfig,
  toPublicPlatformPixelConfig,
} from "@/lib/tracking/platform-pixel-settings";
import { platformPixelSettingsSchema } from "@/lib/validations";

describe("platform pixel settings", () => {
  it("returns defaults for empty/invalid stored values", () => {
    expect(parsePlatformPixelConfig(null)).toEqual(DEFAULT_PLATFORM_PIXEL_CONFIG);
    expect(parsePlatformPixelConfig({})).toEqual(DEFAULT_PLATFORM_PIXEL_CONFIG);
  });

  it("parses and normalizes stored config", () => {
    const parsed = parsePlatformPixelConfig({
      meta: { enabled: true, pixelId: " 1234567890 " },
      googleAds: {
        enabled: true,
        conversionId: "987654321",
        conversionLabel: " abc ",
      },
    });

    expect(parsed.meta).toEqual({ enabled: true, pixelId: "1234567890" });
    expect(parsed.googleAds).toEqual({
      enabled: true,
      conversionId: "AW-987654321",
      conversionLabel: "abc",
    });
  });

  it("coerces numeric pixel IDs from JSON storage", () => {
    const parsed = parsePlatformPixelConfig({
      meta: { enabled: true, pixelId: 1580251150394051 },
      googleAds: {
        enabled: true,
        conversionId: 123456789,
        conversionLabel: "leadLabel",
      },
    });

    expect(parsed.meta.pixelId).toBe("1580251150394051");
    expect(parsed.googleAds.conversionId).toBe("AW-123456789");
    expect(parsed.googleAds.conversionLabel).toBe("leadLabel");

    const publicConfig = toPublicPlatformPixelConfig(parsed);
    expect(publicConfig.meta).toEqual({
      enabled: true,
      pixelId: "1580251150394051",
    });
  });

  it("exposes the production Meta pixel ID when enabled", () => {
    const publicConfig = toPublicPlatformPixelConfig({
      version: 1,
      meta: { enabled: true, pixelId: "1580251150394051" },
      googleAds: { enabled: false, conversionId: "", conversionLabel: "" },
    });
    expect(publicConfig.meta).toEqual({
      enabled: true,
      pixelId: "1580251150394051",
    });
  });

  it("validates Meta and Google IDs", () => {
    expect(isValidMetaPixelId("1234567890")).toBe(true);
    expect(isValidMetaPixelId("abc")).toBe(false);
    expect(isValidGoogleConversionId("AW-123456789")).toBe(true);
    expect(isValidGoogleConversionId("123")).toBe(false);
    expect(normalizeGoogleConversionId("123456789")).toBe("AW-123456789");
  });

  it("only exposes enabled valid providers in public config", () => {
    const publicConfig = toPublicPlatformPixelConfig({
      version: 1,
      meta: { enabled: true, pixelId: "1234567890" },
      googleAds: {
        enabled: true,
        conversionId: "AW-987654321",
        conversionLabel: "",
      },
    });

    expect(publicConfig.meta).toEqual({ enabled: true, pixelId: "1234567890" });
    expect(publicConfig.googleAds).toBeNull();
    expect(
      googleAdsSendTo({
        enabled: true,
        conversionId: "AW-1",
        conversionLabel: "label",
      }),
    ).toBe("AW-1/label");
  });

  it("normalizes admin input", () => {
    expect(
      normalizePlatformPixelInput({
        meta: { enabled: true, pixelId: "111222333" },
        googleAds: {
          enabled: false,
          conversionId: "aw-444555666",
          conversionLabel: "x",
        },
      }),
    ).toEqual({
      version: 1,
      meta: { enabled: true, pixelId: "111222333" },
      googleAds: {
        enabled: false,
        conversionId: "AW-444555666",
        conversionLabel: "x",
      },
    });
  });

  it("rejects invalid enabled settings via zod schema", () => {
    const invalidMeta = platformPixelSettingsSchema.safeParse({
      meta: { enabled: true, pixelId: "bad" },
      googleAds: { enabled: false, conversionId: "", conversionLabel: "" },
    });
    expect(invalidMeta.success).toBe(false);

    const invalidGoogle = platformPixelSettingsSchema.safeParse({
      meta: { enabled: false, pixelId: "" },
      googleAds: {
        enabled: true,
        conversionId: "AW-123456789",
        conversionLabel: "",
      },
    });
    expect(invalidGoogle.success).toBe(false);

    const valid = platformPixelSettingsSchema.safeParse({
      meta: { enabled: true, pixelId: "1234567890" },
      googleAds: {
        enabled: true,
        conversionId: "123456789",
        conversionLabel: "abcXYZ",
      },
    });
    expect(valid.success).toBe(true);
  });
});
