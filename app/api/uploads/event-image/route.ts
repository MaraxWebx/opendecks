import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAuth } from "@/lib/admin-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File immagine mancante." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa JPG, PNG, WEBP o AVIF." },
      { status: 400 }
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Configura BLOB_READ_WRITE_TOKEN per caricare immagini su Vercel Blob."
      },
      { status: 500 }
    );
  }

  const safeName = buildBlobFileName(file);
  const blob = await put(safeName, file, {
    access: "public",
    addRandomSuffix: true,
    token
  });

  return NextResponse.json({
    url: blob.url
  });
}

function guessExtension(type: string) {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    default:
      return ".jpg";
  }
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
  const normalizedBaseName = baseName || "event-cover";

  return `events/${normalizedBaseName}${extension}`;
}

function getFileExtension(file: File) {
  const nameExtensionMatch = file.name.match(/(\.[a-zA-Z0-9]+)$/);
  return nameExtensionMatch?.[1]?.toLowerCase() || guessExtension(file.type);
}
