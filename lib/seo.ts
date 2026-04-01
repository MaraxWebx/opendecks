import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://www.opendecksitalia.it";
const DEFAULT_OG_IMAGE = "/img/home/shots/shot-1.jpeg";

export const siteMetadata = {
  name: "OpenDecks Italia",
  shortName: "OpenDecks",
  description:
    "Piattaforma culturale e network per eventi, archive e candidature DJ.",
  locale: "it_IT",
  type: "website" as const,
};

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
};

export function getSiteUrl() {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL);
}

export function buildMetadata({
  title,
  description = siteMetadata.description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  keywords = [],
  type = siteMetadata.type,
}: BuildMetadataInput = {}): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalUrl = new URL(normalizePath(path), siteUrl).toString();
  const imageUrl = new URL(normalizePath(image), siteUrl).toString();
  const resolvedTitle = title || siteMetadata.name;
  const pageTitle =
    resolvedTitle === siteMetadata.name
      ? siteMetadata.name
      : `${resolvedTitle} | ${siteMetadata.name}`;

  return {
    metadataBase: siteUrl,
    title: pageTitle,
    description,
    applicationName: siteMetadata.name,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      locale: siteMetadata.locale,
      url: canonicalUrl,
      siteName: siteMetadata.name,
      title: pageTitle,
      description,
      images: [
        {
          url: imageUrl,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}

function normalizePath(path: string) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}
