import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { DjRosterRecord } from "@/lib/types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const CARD_X = 54;
const CARD_Y = 286;
const CARD_WIDTH = 487;
const CARD_HEIGHT = 306;
const LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "img",
  "loghi",
  "LOGO-OPEN-DECKS_bianco.png",
);

type ParsedPng = {
  width: number;
  height: number;
  rgb: Buffer;
  alpha: Buffer;
};

let cachedLogo: ParsedPng | null = null;

export function createMembershipCardId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ODI-${stamp}-${randomPart}`;
}

export function buildMembershipCardPdf(record: DjRosterRecord) {
  const issuedAt = record.membershipCardIssuedAt || new Date().toISOString();
  const issueDateLabel = new Date(issuedAt).toLocaleDateString("it-IT");
  const cardId = record.membershipCardId || "PENDING";
  const logo = getOpenDecksLogo();

  const stream = [
    ...buildPageBackground(),
    ...buildIntroCopy(),
    ...buildCardShell(),
    ...buildLogoPlacement(logo),
    ...drawTextBlock("F2", 34, 82, 470, "MEMBERSHIP CARD", [0.96, 0.95, 0.92]),
    ...drawTextBlock("F1", 11, 82, 436, "DJ APPROVATO", [0.7, 0.67, 0.64]),
    ...drawTextBlock("F2", 25, 82, 406, toAscii(record.name), [1, 1, 1]),
    ...drawTextBlock("F1", 11, 82, 350, "MEMBERSHIP ID", [0.7, 0.67, 0.64]),
    ...drawTextBlock("F2", 18, 82, 322, cardId, [1, 1, 1]),
    ...drawTextBlock("F1", 11, 318, 350, "EMESSA IL", [0.7, 0.67, 0.64]),
    ...drawTextBlock("F2", 18, 318, 322, issueDateLabel, [1, 1, 1]),
    ...buildAccentMarks(),
    ...buildFooterCopy(),
  ].join("\n");

  return buildPdf(stream, logo);
}

function buildPageBackground() {
  return [
    "0.03 0.03 0.03 rg",
    `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re`,
    "f",
  ];
}

function buildCardShell() {
  return [
    ...roundedRectPath(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 22),
    "0.07 0.07 0.07 rg",
    "f",
    ...roundedRectPath(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 22),
    "0.95 0.18 0.2 RG",
    "1.2 w",
    "S",
  ];
}

function buildLogoPlacement(logo: ParsedPng) {
  const targetWidth = 78;
  const targetHeight = (logo.height / logo.width) * targetWidth;
  const x = 82;
  const y = 512;

  return [
    "q",
    `${targetWidth} 0 0 ${targetHeight} ${x} ${y} cm`,
    "/Im1 Do",
    "Q",
  ];
}

function buildAccentMarks() {
  return [];
}

function buildFooterCopy() {
  return [
    ...wrapTextCommands(
      "OpenDecks Italia e una piattaforma culturale itinerante nata a Napoli: selezione, archivio, contenuto e connessione tra artisti, venue e comunita.",
      {
        x: 54,
        y: 252,
        maxCharsPerLine: 92,
        font: "F1",
        fontSize: 10,
        lineHeight: 14,
        color: [0.78, 0.75, 0.72],
      },
    ),
  ];
}

function buildIntroCopy() {
  return [
    ...drawTextBlock("F2", 18, 54, 732, "COLLECTIVE MEMBERSHIP", [0.95, 0.18, 0.2]),
    ...wrapTextCommands(
      "Questa card conferma l'ingresso nel roster OpenDecks Italia e identifica il DJ come membro attivo della rete.",
      {
        x: 54,
        y: 700,
        maxCharsPerLine: 34,
        font: "F1",
        fontSize: 16,
        lineHeight: 20,
        color: [0.9, 0.87, 0.84],
      },
    ),
  ];
}

function drawTextBlock(
  font: "F1" | "F2",
  fontSize: number,
  x: number,
  y: number,
  value: string,
  color: [number, number, number],
) {
  return [
    "BT",
    `/${font} ${fontSize} Tf`,
    `${color[0]} ${color[1]} ${color[2]} rg`,
    `${x} ${y} Td`,
    `(${escapePdfText(value)}) Tj`,
    "ET",
  ];
}

function wrapTextCommands(
  value: string,
  config: {
    x: number;
    y: number;
    maxCharsPerLine: number;
    font: "F1" | "F2";
    fontSize: number;
    lineHeight: number;
    color: [number, number, number];
  },
) {
  const lines = wrapText(value, config.maxCharsPerLine);

  return lines.flatMap((line, index) => [
    "BT",
    `/${config.font} ${config.fontSize} Tf`,
    `${config.color[0]} ${config.color[1]} ${config.color[2]} rg`,
    `${config.x} ${config.y - index * config.lineHeight} Td`,
    `(${escapePdfText(line)}) Tj`,
    "ET",
  ]);
}

function wrapText(value: string, maxCharsPerLine: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildPdf(stream: string, logo: ParsedPng) {
  const imageRgb = zlib.deflateSync(logo.rgb);
  const imageAlpha = zlib.deflateSync(logo.alpha);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 8 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    buildImageObject(logo.width, logo.height, imageRgb, 7, "DeviceRGB"),
    buildImageObject(logo.width, logo.height, imageAlpha, undefined, "DeviceGray"),
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ];

  const parts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(parts.join(""), "utf8"));
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(""), "utf8");
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];

  for (let index = 1; index <= objects.length; index += 1) {
    xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }

  parts.push(`${xref.join("\n")}\n`);
  parts.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return Buffer.from(parts.join(""), "binary");
}

function buildImageObject(
  width: number,
  height: number,
  data: Buffer,
  softMaskObjectNumber: number | undefined,
  colorSpace: "DeviceRGB" | "DeviceGray",
) {
  const channels = colorSpace === "DeviceRGB" ? 3 : 1;
  const smask = softMaskObjectNumber ? ` /SMask ${softMaskObjectNumber} 0 R` : "";

  return `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /${colorSpace} /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors ${channels} /BitsPerComponent 8 /Columns ${width} >>${smask} /Length ${data.length} >>\nstream\n${data.toString("binary")}\nendstream`;
}

function getOpenDecksLogo() {
  if (cachedLogo) {
    return cachedLogo;
  }

  cachedLogo = parsePngWithAlpha(fs.readFileSync(LOGO_PATH));
  return cachedLogo;
}

function parsePngWithAlpha(buffer: Buffer): ParsedPng {
  const signature = "89504e470d0a1a0a";

  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Logo PNG non valido.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString("ascii");
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (!width || !height || bitDepth !== 8 || colorType !== 6) {
    throw new Error("Il logo PNG deve essere RGBA 8-bit.");
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rgbRows: Buffer[] = [];
  const alphaRows: Buffer[] = [];
  let pointer = 0;
  let previousRow = Buffer.alloc(stride);

  for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
    const filterType = inflated[pointer];
    pointer += 1;
    const filteredRow = inflated.subarray(pointer, pointer + stride);
    pointer += stride;
    const row = unfilterRow(filterType, filteredRow, previousRow, bytesPerPixel);
    previousRow = row;

    const rgb = Buffer.alloc(1 + width * 3);
    const alpha = Buffer.alloc(1 + width);
    rgb[0] = 0;
    alpha[0] = 0;

    for (let pixel = 0; pixel < width; pixel += 1) {
      const source = pixel * 4;
      const rgbTarget = 1 + pixel * 3;
      rgb[rgbTarget] = row[source];
      rgb[rgbTarget + 1] = row[source + 1];
      rgb[rgbTarget + 2] = row[source + 2];
      alpha[1 + pixel] = row[source + 3];
    }

    rgbRows.push(rgb);
    alphaRows.push(alpha);
  }

  return {
    width,
    height,
    rgb: Buffer.concat(rgbRows),
    alpha: Buffer.concat(alphaRows),
  };
}

function unfilterRow(
  filterType: number,
  row: Buffer,
  previousRow: Buffer,
  bytesPerPixel: number,
) {
  const result = Buffer.alloc(row.length);

  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? result[index - bytesPerPixel] : 0;
    const up = previousRow[index] || 0;
    const upLeft =
      index >= bytesPerPixel ? previousRow[index - bytesPerPixel] || 0 : 0;

    if (filterType === 0) {
      result[index] = row[index];
      continue;
    }

    if (filterType === 1) {
      result[index] = (row[index] + left) & 0xff;
      continue;
    }

    if (filterType === 2) {
      result[index] = (row[index] + up) & 0xff;
      continue;
    }

    if (filterType === 3) {
      result[index] = (row[index] + Math.floor((left + up) / 2)) & 0xff;
      continue;
    }

    if (filterType === 4) {
      result[index] = (row[index] + paethPredictor(left, up, upLeft)) & 0xff;
      continue;
    }

    throw new Error("Filtro PNG non supportato.");
  }

  return result;
}

function paethPredictor(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) {
    return a;
  }

  if (pb <= pc) {
    return b;
  }

  return c;
}

function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  const c = r * 0.5522847498;

  return [
    `${x + r} ${y} m`,
    `${x + width - r} ${y} l`,
    `${x + width - r + c} ${y} ${x + width} ${y + r - c} ${x + width} ${y + r} c`,
    `${x + width} ${y + height - r} l`,
    `${x + width} ${y + height - r + c} ${x + width - r + c} ${y + height} ${x + width - r} ${y + height} c`,
    `${x + r} ${y + height} l`,
    `${x + r - c} ${y + height} ${x} ${y + height - r + c} ${x} ${y + height - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c`,
    "h",
  ];
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toAscii(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}
