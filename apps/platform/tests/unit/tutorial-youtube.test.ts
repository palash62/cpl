import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrlFromLink,
  normalizeYouTubeUrl,
  parseYouTubeVideoId,
  toYouTubeEmbedUrl,
} from "@/lib/youtube";

describe("YouTube URL helpers", () => {
  it("parses watch URLs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses youtu.be URLs", () => {
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses embed URLs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses shorts URLs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects invalid URLs", () => {
    expect(parseYouTubeVideoId("https://example.com/video")).toBeNull();
    expect(parseYouTubeVideoId("not-a-url")).toBeNull();
  });

  it("normalizes to canonical watch URL", () => {
    expect(normalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("builds nocookie embed URLs", () => {
    expect(toYouTubeEmbedUrl("dQw4w9WgXcQ")).toContain(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(toYouTubeEmbedUrl("dQw4w9WgXcQ", { autoplay: true, controls: true })).toContain(
      "autoplay=1",
    );
    expect(toYouTubeEmbedUrl("dQw4w9WgXcQ", { controls: true })).toContain("controls=1");
    expect(getYouTubeEmbedUrlFromLink("https://youtu.be/dQw4w9WgXcQ", { autoplay: true })).toContain(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});
