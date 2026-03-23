import { ui } from "@/lib/ui";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-6 grid gap-3 md:mb-8">
      <span className={ui.text.eyebrow}>{eyebrow}</span>
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f7f3ee] md:text-3xl">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-white/70 md:text-base">{description}</p>
    </div>
  );
}
