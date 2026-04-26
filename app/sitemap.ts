import type { MetadataRoute } from "next";

import { getEvents } from "@/lib/data";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const events = await getEvents();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/progetto", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: new URL("/eventi", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/prenota", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/archive", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: new URL("/contatti", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: new URL("/privacy-policy", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: new URL(`/eventi/${event.slug}`, siteUrl).toString(),
    lastModified: event.date ? new Date(event.date) : now,
    changeFrequency: event.status === "upcoming" ? "daily" : "monthly",
    priority: event.status === "upcoming" ? 0.8 : 0.6,
  }));

  return [...staticRoutes, ...eventRoutes];
}
