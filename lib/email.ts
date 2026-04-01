import path from "node:path";

import nodemailer from "nodemailer";

import { emailCopy } from "@/content/site-copy";

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

type ApplicationConfirmationEmailInput = {
  to: string;
  applicantName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  locationName?: string;
  locationAddress?: string;
  city: string;
  province?: string;
  region?: string;
  submittedAt: string;
};

type ApplicationNotificationEmailInput = {
  applicantName: string;
  applicantEmail: string;
  phone: string;
  instagram: string;
  setLink: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  locationName?: string;
  locationAddress?: string;
  city: string;
  province?: string;
  region?: string;
  submittedAt: string;
};

type ApplicationApprovedEmailInput = {
  to: string;
  applicantName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  locationName?: string;
  locationAddress?: string;
};

export async function sendMembershipCardEmail(input: MembershipEmailInput) {
  const { transporter, from, user } = getMailClient();

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo: user,
    subject: `OpenDecks Membership Card ${input.membershipCardId}`,
    html: buildEmailTemplate({
      title: "Membership Card OpenDecks",
      body: `
        <p style="margin:0 0 12px">Ciao ${escapeHtml(input.djName)},</p>
        <p style="margin:0 0 12px">In allegato trovi la tua membership card ufficiale.</p>
        <p style="margin:0 0 12px"><strong>ID card:</strong> ${escapeHtml(input.membershipCardId)}</p>
        <p style="margin:0">Conservala come riferimento per il roster OpenDecks.</p>
      `,
    }),
    text: `OpenDecks Italia\n\nCiao ${input.djName},\n\nin allegato trovi la tua membership card ufficiale.\nID card: ${input.membershipCardId}\n\nConserva questo PDF come riferimento.`,
    attachments: [
      buildLogoAttachment(),
      {
        filename: `opendecks-membership-${input.membershipCardId}.pdf`,
        content: input.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
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
    html: buildEmailTemplate({
      title: "Contatti OpenDecks",
      body: `
        <p style="margin:0 0 12px"><strong>Nome:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin:0 0 12px"><strong>Telefono:</strong> ${escapeHtml(input.phone || "-")}</p>
        <p style="margin:0 0 8px"><strong>Messaggio:</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.message)}</p>
      `,
    }),
    text: `OpenDecks Italia\n\nNome: ${input.name}\nEmail: ${input.email}\nTelefono: ${input.phone || "-"}\n\nMessaggio:\n${input.message}`,
    attachments: [buildLogoAttachment()],
  });
}

export async function sendApplicationConfirmationEmail(
  input: ApplicationConfirmationEmailInput,
) {
  const { transporter, from, user } = getMailClient();
  const locationLabel = [
    input.city,
    input.province ? `(${input.province})` : "",
    input.region,
  ]
    .filter(Boolean)
    .join(" ");
  const eventDetails = [
    input.eventDate
      ? `Data evento: ${new Date(input.eventDate).toLocaleDateString("it-IT")}`
      : "",
    input.eventTime ? `Orario: ${input.eventTime}` : "",
    input.locationName ? `Location: ${input.locationName}` : "",
    input.locationAddress ? `Indirizzo: ${input.locationAddress}` : "",
  ].filter(Boolean);
  const attachmentText = [
    "OpenDecks Italia",
    "",
    "Candidatura ricevuta",
    "",
    `Nome: ${input.applicantName}`,
    `Evento: ${input.eventTitle}`,
    `Localita: ${locationLabel || "-"}`,
    ...eventDetails,
    `Data invio: ${new Date(input.submittedAt).toLocaleString("it-IT")}`,
    "",
    "La candidatura e stata registrata correttamente.",
    "Ora entra nella fase di selezione del progetto OpenDecks.",
    "Controlla la tua email: verrai ricontattato per i prossimi step.",
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo: user,
    subject: `Candidatura ricevuta - ${input.eventTitle}`,
    html: buildEmailTemplate({
      title: emailCopy.applicationConfirmationTitle,
      body: `
        <p style="margin:0 0 12px">Ciao ${escapeHtml(input.applicantName)},</p>
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationConfirmationIntro)}</p>
        <div style="margin:0 0 16px;border:1px solid rgba(227,31,41,0.18);border-radius:16px;padding:16px;background:rgba(255,255,255,0.03)">
          <p style="margin:0 0 10px"><strong>Evento:</strong> ${escapeHtml(input.eventTitle)}</p>
          ${input.eventDate ? `<p style="margin:0 0 10px"><strong>Data:</strong> ${escapeHtml(new Date(input.eventDate).toLocaleDateString("it-IT"))}</p>` : ""}
          ${input.eventTime ? `<p style="margin:0 0 10px"><strong>Orario:</strong> ${escapeHtml(input.eventTime)}</p>` : ""}
          ${input.locationName ? `<p style="margin:0 0 10px"><strong>Location:</strong> ${escapeHtml(input.locationName)}</p>` : ""}
          ${input.locationAddress ? `<p style="margin:0 0 10px"><strong>Indirizzo:</strong> ${escapeHtml(input.locationAddress)}</p>` : ""}
          <p style="margin:0"><strong>Localita candidatura:</strong> ${escapeHtml(locationLabel || "-")}</p>
        </div>
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationConfirmationOutro)}</p>
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationConfirmationReminder)}</p>
        <p style="margin:0">In allegato trovi un riepilogo rapido della candidatura.</p>
      `,
    }),
    text: attachmentText,
    attachments: [
      buildLogoAttachment(),
      {
        filename: "opendecks-conferma-candidatura.txt",
        content: attachmentText,
        contentType: "text/plain; charset=utf-8",
      },
    ],
  });
}

export async function sendApplicationNotificationEmail(
  input: ApplicationNotificationEmailInput,
) {
  const { transporter, from } = getMailClient();
  const notificationRecipient =
    process.env.APPLICATION_EMAIL_TO || "info@opendecksitalia.it";
  const locationLabel = [
    input.city,
    input.province ? `(${input.province})` : "",
    input.region,
  ]
    .filter(Boolean)
    .join(" ");

  await transporter.sendMail({
    from,
    to: notificationRecipient,
    replyTo: input.applicantEmail,
    subject: `Nuova candidatura OpenDecks - ${input.applicantName}`,
    html: buildEmailTemplate({
      title: emailCopy.applicationNotificationTitle,
      body: `
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationNotificationIntro)}</p>
        <p style="margin:0 0 12px"><strong>Nome:</strong> ${escapeHtml(input.applicantName)}</p>
        <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(input.applicantEmail)}</p>
        <p style="margin:0 0 12px"><strong>Telefono:</strong> ${escapeHtml(input.phone)}</p>
        <p style="margin:0 0 12px"><strong>Instagram:</strong> ${escapeHtml(input.instagram)}</p>
        <p style="margin:0 0 12px"><strong>Evento:</strong> ${escapeHtml(input.eventTitle)}</p>
        ${input.eventDate ? `<p style="margin:0 0 12px"><strong>Data evento:</strong> ${escapeHtml(new Date(input.eventDate).toLocaleDateString("it-IT"))}</p>` : ""}
        ${input.eventTime ? `<p style="margin:0 0 12px"><strong>Orario:</strong> ${escapeHtml(input.eventTime)}</p>` : ""}
        ${input.locationName ? `<p style="margin:0 0 12px"><strong>Location:</strong> ${escapeHtml(input.locationName)}</p>` : ""}
        ${input.locationAddress ? `<p style="margin:0 0 12px"><strong>Indirizzo:</strong> ${escapeHtml(input.locationAddress)}</p>` : ""}
        <p style="margin:0 0 12px"><strong>Localita:</strong> ${escapeHtml(locationLabel || "-")}</p>
        <p style="margin:0 0 12px"><strong>Set:</strong> ${escapeHtml(input.setLink)}</p>
        <p style="margin:0">Invio: ${escapeHtml(new Date(input.submittedAt).toLocaleString("it-IT"))}</p>
      `,
    }),
    text: [
      "OpenDecks Italia",
      "",
      "Nuova candidatura ricevuta",
      "",
      `Nome: ${input.applicantName}`,
      `Email: ${input.applicantEmail}`,
      `Telefono: ${input.phone}`,
      `Instagram: ${input.instagram}`,
      `Evento: ${input.eventTitle}`,
      ...(input.eventDate
        ? [`Data evento: ${new Date(input.eventDate).toLocaleDateString("it-IT")}`]
        : []),
      ...(input.eventTime ? [`Orario: ${input.eventTime}`] : []),
      ...(input.locationName ? [`Location: ${input.locationName}`] : []),
      ...(input.locationAddress ? [`Indirizzo: ${input.locationAddress}`] : []),
      `Localita: ${locationLabel || "-"}`,
      `Set: ${input.setLink}`,
      `Invio: ${new Date(input.submittedAt).toLocaleString("it-IT")}`,
    ].join("\n"),
    attachments: [buildLogoAttachment()],
  });
}

export async function sendApplicationApprovedEmail(
  input: ApplicationApprovedEmailInput,
) {
  const { transporter, from, user } = getMailClient();
  const eventDetails = [
    input.eventDate
      ? `Data evento: ${new Date(input.eventDate).toLocaleDateString("it-IT")}`
      : "",
    input.eventTime ? `Orario: ${input.eventTime}` : "",
    input.locationName ? `Location: ${input.locationName}` : "",
    input.locationAddress ? `Indirizzo: ${input.locationAddress}` : "",
  ].filter(Boolean);

  await transporter.sendMail({
    from,
    to: input.to,
    replyTo: user,
    subject: `Candidatura approvata - ${input.eventTitle}`,
    html: buildEmailTemplate({
      title: emailCopy.applicationApprovedTitle,
      body: `
        <p style="margin:0 0 12px">Ciao ${escapeHtml(input.applicantName)},</p>
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationApprovedIntro)}</p>
        <div style="margin:0 0 16px;border:1px solid rgba(227,31,41,0.18);border-radius:16px;padding:16px;background:rgba(255,255,255,0.03)">
          <p style="margin:0 0 10px"><strong>Evento:</strong> ${escapeHtml(input.eventTitle)}</p>
          ${input.eventDate ? `<p style="margin:0 0 10px"><strong>Data:</strong> ${escapeHtml(new Date(input.eventDate).toLocaleDateString("it-IT"))}</p>` : ""}
          ${input.eventTime ? `<p style="margin:0 0 10px"><strong>Orario:</strong> ${escapeHtml(input.eventTime)}</p>` : ""}
          ${input.locationName ? `<p style="margin:0 0 10px"><strong>Location:</strong> ${escapeHtml(input.locationName)}</p>` : ""}
          ${input.locationAddress ? `<p style="margin:0"><strong>Indirizzo:</strong> ${escapeHtml(input.locationAddress)}</p>` : ""}
        </div>
        <p style="margin:0 0 12px">${escapeHtml(emailCopy.applicationApprovedOutro)}</p>
        <p style="margin:0">${escapeHtml(emailCopy.applicationApprovedReminder)}</p>
      `,
    }),
    text: [
      "OpenDecks Italia",
      "",
      "Candidatura approvata",
      "",
      `Ciao ${input.applicantName},`,
      "",
      "La tua candidatura e stata approvata.",
      `Evento: ${input.eventTitle}`,
      ...eventDetails,
      "",
      "Controlla la tua casella email per i prossimi aggiornamenti.",
    ].join("\n"),
    attachments: [buildLogoAttachment()],
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
      "Configura SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS per inviare email.",
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    }),
    from,
    user,
  };
}

function buildEmailTemplate({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#050505;background-image:radial-gradient(circle at top,#1a1a1a 0%,#050505 58%);font-family:Arial,sans-serif;color:#f7f3ee">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px">
        <div style="margin:0 0 14px;padding:0 4px">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#E31F29">${escapeHtml(emailCopy.brandEyebrow)}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(247,243,238,0.74)">${escapeHtml(emailCopy.brandTagline)}</p>
        </div>
        <div style="overflow:hidden;border-radius:24px;border:1px solid rgba(227,31,41,0.22);background:#101010;box-shadow:0 18px 52px rgba(0,0,0,0.34)">
          <div style="background:#E31F29;padding:20px 24px">
            <img src="cid:opendecks-logo" alt="OpenDecks" style="display:block;max-width:100px;height:auto" />
          </div>
          <div style="padding:28px 24px 24px">
            <h1 style="margin:0 0 18px;font-size:31px;line-height:0.96;font-weight:700;letter-spacing:-0.05em;text-transform:uppercase;color:#f7f2e8">${escapeHtml(title)}</h1>
            <div style="font-size:15px;line-height:1.78;color:#e8e2da">${body}</div>
            <div style="margin-top:22px;padding:14px 16px;border-radius:16px;border:1px solid rgba(227,31,41,0.18);background:rgba(227,31,41,0.08)">
              <p style="margin:0 0 7px;font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:#ff7e86">Contatti OpenDecks</p>
              <p style="margin:0 0 6px;font-size:14px;color:#f7f3ee">Email: info@opendecksitalia.it</p>
              <p style="margin:0;font-size:14px;color:#f7f3ee">Instagram: @opendecks.italia</p>
            </div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;line-height:1.7;color:rgba(247,243,238,0.58)">
              ${escapeHtml(emailCopy.footerNote)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildLogoAttachment() {
  return {
    filename: "LOGO-OPEN-DECKS_bianco.png",
    path: path.join(
      process.cwd(),
      "public",
      "img",
      "loghi",
      "LOGO-OPEN-DECKS_bianco.png",
    ),
    cid: "opendecks-logo",
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
