import { ArchiveRecord } from "@/lib/types";

type ArchiveMediaTileProps = {
  item: ArchiveRecord;
  variant?: "default" | "editorial";
};

const sizePattern = ["landscape", "portrait", "tall", "portrait", "square", "tall"] as const;

export function ArchiveMediaTile({ item, variant = "default" }: ArchiveMediaTileProps) {
  const sizeClass = sizePattern[(Math.max(item.order, 1) - 1) % sizePattern.length];
  const wrapperClass =
    variant === "editorial"
      ? "mb-2 break-inside-avoid overflow-hidden bg-transparent"
      : "overflow-hidden rounded-2xl border border-[#E31F29]/15 bg-white/[0.03]";

  const frameClass =
    sizeClass === "portrait"
      ? "aspect-[4/5]"
      : sizeClass === "tall"
        ? "aspect-[4/6]"
        : sizeClass === "landscape"
          ? "aspect-[16/10]"
          : "aspect-square";

  return (
    <article className={wrapperClass}>
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
        <div
          className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 ${
            variant === "editorial" ? "opacity-0 transition group-hover:opacity-100" : ""
          }`}
        >
          <div className="grid gap-1 text-white">
            <strong className="text-sm font-semibold">{item.title}</strong>
            <span className="text-[0.72rem] uppercase tracking-[0.12em] text-white/80">
              {item.event} / {item.year}
            </span>
          </div>
          <span className="inline-flex rounded-[0.45rem] border border-[#E31F29]/60 bg-[#E31F29]/16 px-3 py-1 text-[0.72rem] uppercase tracking-[0.12em] text-white">
            {item.mediaType}
          </span>
        </div>
      </div>
      {variant === "default" ? (
        <div className="grid gap-3 p-5">
          <div className="flex flex-wrap gap-2 text-sm text-white/58">
            <span>{item.event}</span>
            <span>slot {item.order}</span>
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#f7f3ee]">
            {item.title}
          </h3>
          <p className="text-sm leading-7 text-white/74">{item.description}</p>
        </div>
      ) : null}
    </article>
  );
}
