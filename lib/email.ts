import nodemailer from "nodemailer";

type MembershipEmailInput = {
  to: string;
  djName: string;
  membershipCardId: string;
  pdfBuffer: Buffer;
};

export async function sendMembershipCardEmail(input: MembershipEmailInput) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      "Configura SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM per inviare la membership."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass
    }
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: `OpenDecks Membership Card ${input.membershipCardId}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f3ee;padding:24px">
        <h1 style="margin:0 0 16px;font-size:24px">OpenDecks Italia</h1>
        <p style="margin:0 0 12px">Ciao ${escapeHtml(input.djName)},</p>
        <p style="margin:0 0 12px">
          in allegato trovi la tua membership card ufficiale.
        </p>
        <p style="margin:0 0 12px"><strong>ID card:</strong> ${escapeHtml(input.membershipCardId)}</p>
        <p style="margin:0">Conserva questo PDF come riferimento.</p>
      </div>
    `,
    text: `OpenDecks Italia\n\nCiao ${input.djName},\n\nin allegato trovi la tua membership card ufficiale.\nID card: ${input.membershipCardId}\n\nConserva questo PDF come riferimento.`,
    attachments: [
      {
        filename: `opendecks-membership-${input.membershipCardId}.pdf`,
        content: input.pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
