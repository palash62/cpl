"use client";

type TutorialVideoPlayerProps = {
  embedUrl: string;
  title: string;
};

export function TutorialVideoPlayer({ embedUrl, title }: TutorialVideoPlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
