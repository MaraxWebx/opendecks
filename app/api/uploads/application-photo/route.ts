import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_APPLICATION_PHOTO_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimitResponse = applyRateLimit({
    key: `application-photo:${ip}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
    message: "Troppi upload foto. Riprova tra qualche minuto.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Foto profilo mancante." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa JPG, PNG, WEBP o AVIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_APPLICATION_PHOTO_SIZE) {
    return NextResponse.json(
      { error: "La foto supera il limite di 5 MB." },
      { status: 400 },
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Configura BLOB_READ_WRITE_TOKEN per caricare foto su Vercel Blob." },
      { status: 500 }
    );
  }

  const blob = await put(buildBlobFileName(file), file, {
    access: "public",
    addRandomSuffix: true,
    token
  });

  return NextResponse.json({ url: blob.url });
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
  const normalizedBaseName = baseName || "dj-photo";

  return `applications/${normalizedBaseName}${extension}`;
}

function getFileExtension(file: File) {
  const nameExtensionMatch = file.name.match(/(\.[a-zA-Z0-9]+)$/);
  return nameExtensionMatch?.[1]?.toLowerCase() || guessExtension(file.type);
}
