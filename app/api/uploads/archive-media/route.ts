import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File media mancante." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa immagini, gif o video compatibili." },
      { status: 400 }
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Configura BLOB_READ_WRITE_TOKEN per caricare file su Vercel Blob." },
      { status: 500 }
    );
  }

  const fileName = buildBlobFileName(file);
  const blob = await put(fileName, file, {
    access: "public",
    addRandomSuffix: true,
    token
  });

  return NextResponse.json({
    url: blob.url,
    mediaType: inferMediaType(file)
  });
}

function buildBlobFileName(file: File) {
  const baseName = file.name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const extension = getFileExtension(file);
  return `archive/${baseName || "gallery-item"}${extension}`;
}

function getFileExtension(file: File) {
  const nameExtensionMatch = file.name.match(/(\.[a-zA-Z0-9]+)$/);
  return nameExtensionMatch?.[1]?.toLowerCase() || guessExtension(file.type);
}

function guessExtension(type: string) {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return ".mp4";
  }
}

function inferMediaType(file: File): "photo" | "video" | "gif" {
  if (file.type === "image/gif") {
    return "gif";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "photo";
}
