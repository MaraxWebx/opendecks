import { DjRosterRecord } from "@/lib/types";

export function createMembershipCardId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ODI-${stamp}-${randomPart}`;
}

export function buildMembershipCardPdf(record: DjRosterRecord) {
  const issuedAt = record.membershipCardIssuedAt || new Date().toISOString();
  const lines = [
    "OPENDECKS ITALIA",
    "MEMBERSHIP CARD",
    "",
    `Card ID: ${record.membershipCardId || "PENDING"}`,
    `DJ: ${record.name}`,
    `Email: ${record.email}`,
    `City: ${record.city}`,
    `Instagram: ${record.instagram}`,
    `Approved Event: ${record.eventTitle}`,
    `Issued At: ${new Date(issuedAt).toLocaleString("it-IT")}`,
    "",
    "Conserva questo PDF come documento di riferimento della membership."
  ];

  return buildSimplePdf(lines);
}

function buildSimplePdf(lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 22 Tf",
    "50 780 Td",
    "28 TL",
    ...lines.flatMap((line, index) => {
      const escaped = escapePdfText(toAscii(line));
      return index === 0 ? [`(${escaped}) Tj`] : ["T*", `(${escaped}) Tj`];
    }),
    "ET"
  ];

  const stream = contentLines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
  ];

  const parts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(parts.join(""), "utf8"));
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(""), "utf8");
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f "
  ];

  for (let index = 1; index <= objects.length; index += 1) {
    xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }

  parts.push(`${xref.join("\n")}\n`);
  parts.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return Buffer.from(parts.join(""), "utf8");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toAscii(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
}
