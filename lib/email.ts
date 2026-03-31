import nodemailer from "nodemailer";

type MembershipEmailInput = {
  to: string;
  djName: string;
  membershipCardId: string;
  pdfBuffer: Buffer;
};

type ContactEmailInput = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export async function sendMembershipCardEmail(input: MembershipEmailInput) {
  const { transporter, from, user } = getMailClient();

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo: user,
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

export async function sendContactEmail(input: ContactEmailInput) {
  const { transporter, from, user } = getMailClient();
  const contactRecipient = process.env.CONTACT_EMAIL_TO || user;

  await transporter.sendMail({
    from,
    to: contactRecipient,
    replyTo: input.email,
    subject: `Nuovo messaggio contatti da ${input.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f3ee;padding:24px">
        <h1 style="margin:0 0 16px;font-size:24px">OpenDecks Italia</h1>
        <p style="margin:0 0 12px"><strong>Nome:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin:0 0 12px"><strong>Telefono:</strong> ${escapeHtml(input.phone || "-")}</p>
        <p style="margin:0 0 8px"><strong>Messaggio:</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.message)}</p>
      </div>
    `,
    text: `OpenDecks Italia\n\nNome: ${input.name}\nEmail: ${input.email}\nTelefono: ${input.phone || "-"}\n\nMessaggio:\n${input.message}`
  });
}

function getMailClient() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Configura SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS per inviare email."
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass
      }
    }),
    from,
    user
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
