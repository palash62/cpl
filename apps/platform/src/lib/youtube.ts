const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/;

export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id && YOUTUBE_VIDEO_ID.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && YOUTUBE_VIDEO_ID.test(id) ? id : null;
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embedMatch?.[1]) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([\w-]{11})/);
      if (shortsMatch?.[1]) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function toYouTubeEmbedUrl(
  videoId: string,
  options: { autoplay?: boolean; controls?: boolean } = {},
): string {
  const params = new URLSearchParams({
    autoplay: options.autoplay ? "1" : "0",
    controls: options.controls === false ? "0" : "1",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
    color: "white",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeEmbedUrlFromLink(
  url: string,
  options: { autoplay?: boolean; controls?: boolean } = {},
): string | null {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) return null;
  return toYouTubeEmbedUrl(videoId, options);
}
