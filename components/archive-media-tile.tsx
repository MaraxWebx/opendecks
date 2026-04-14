import { ArchiveRecord } from "@/lib/types";

type ArchiveMediaTileProps = {
  item: ArchiveRecord;
  variant?: "default" | "editorial";
};

const sizePattern = [
  "landscape",
  "portrait",
  "tall",
  "portrait",
  "square",
  "tall",
] as const;

export function ArchiveMediaTile({
  item,
  variant = "default",
}: ArchiveMediaTileProps) {
  const sizeClass =
    sizePattern[(Math.max(item.order, 1) - 1) % sizePattern.length];
  const wrapperClass =
    variant === "editorial"
      ? "mb-2 break-inside-avoid overflow-hidden bg-transparent"
      : "overflow-hidden rounded-xl border border-[#E31F29]/15 bg-white/[0.03]";

  const frameClass =
    sizeClass === "portrait"
      ? "aspect-[4/5]"
      : sizeClass === "tall"
        ? "aspect-[4/6]"
        : sizeClass === "landscape"
          ? "aspect-[16/10]"
          : "aspect-square";

  const content = (
    <>
      <div className={`group relative overflow-hidden bg-[#111] ${frameClass}`}>
        {item.mediaType === "video" ? (
          <video
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            src={item.mediaUrl}
            poster={item.thumbnailUrl}
            autoPlay
            loop
            muted
            playsInline
            controls={variant === "default"}
          />
        ) : (
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            src={item.mediaUrl}
            alt={item.alt}
          />
        )}
      </div>
      {variant === "default" ? (
        <div className="grid gap-3 p-5">
          <div className="flex flex-wrap gap-2 text-sm text-white/58">
            {item.event ? <span>{item.event}</span> : null}
            <span>slot {item.order}</span>
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#f7f3ee]">
            {item.title || item.event || "Gallery item"}
          </h3>
          {item.description ? (
            <p className="text-sm leading-7 text-white/74">
              {item.description}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <article className={wrapperClass}>
      {item.linkUrl ? (
        <a href={item.linkUrl} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </article>
  );
}
