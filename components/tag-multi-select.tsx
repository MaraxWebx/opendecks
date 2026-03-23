"use client";

import { useMemo, useState } from "react";

import { TagRecord } from "@/lib/types";
import { ui } from "@/lib/ui";

type TagMultiSelectProps = {
  tags: TagRecord[];
  value: string[];
  onChange: (nextValue: string[]) => void;
  onTagsChange: (nextTags: TagRecord[]) => void;
};

export function TagMultiSelect({
  tags,
  value,
  onChange,
  onTagsChange
}: TagMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedTags = useMemo(
    () => value.map((id) => tags.find((tag) => tag.id === id)).filter(Boolean) as TagRecord[],
    [tags, value]
  );

  const availableTags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tags.filter((tag) => {
      if (value.includes(tag.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [tag.label, tag.slug].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [query, tags, value]);

  const canCreate =
    query.trim().length > 0 &&
    !tags.some((tag) => tag.label.toLowerCase() === query.trim().toLowerCase());
  const showDropdown = query.trim().length > 0;

  async function handleCreateTag() {
    const label = query.trim();

    if (!label) {
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      const result = (await response.json()) as { tag?: TagRecord; error?: string };

      if (!response.ok || !result.tag) {
        throw new Error(result.error || "Creazione tag non riuscita.");
      }

      onTagsChange([...tags, result.tag].sort((a, b) => a.label.localeCompare(b.label, "it")));
      onChange([...value, result.tag.id]);
      setQuery("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-[color:var(--color-brand-20)] bg-[color:var(--color-surface)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-brand-25)] bg-[color:var(--color-brand-10)] px-3 py-1.5 text-sm text-white"
            >
              {tag.label}
              <button
                type="button"
                className="text-white/55 transition hover:text-white"
                onClick={() => onChange(value.filter((id) => id !== tag.id))}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="min-w-28 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-white/35"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca o crea tag"
          />
        </div>
      </div>

      {showDropdown && (availableTags.length > 0 || canCreate) && (
        <div className="overflow-hidden rounded-xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-elevated)]">
          {availableTags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="flex w-full items-center justify-between border-b border-[color:var(--color-border-soft)] px-4 py-3 text-left text-sm text-white transition last:border-b-0 hover:bg-[color:var(--color-brand-12)]"
              onClick={() => {
                onChange([...value, tag.id]);
                setQuery("");
              }}
            >
              <span>{tag.label}</span>
              <span className="text-white/35">{tag.slug}</span>
            </button>
          ))}

          {canCreate ? (
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#f7f3ee] transition hover:bg-[color:var(--color-brand-12)]"
              disabled={creating}
              onClick={handleCreateTag}
            >
              <span>{creating ? "Creazione..." : `Crea nuovo tag: ${query.trim()}`}</span>
              <span className={ui.text.eyebrow}>Nuovo</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
