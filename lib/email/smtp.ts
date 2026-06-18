import nodemailer from "nodemailer";

function getBrevoTransporter() {
  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT ?? "587");
  const user = process.env.BREVO_SMTP_LOGIN;
  const pass = process.env.BREVO_SMTP_KEY;

  if (!host || !user || !pass) {
    throw new Error("Brevo SMTP settings are not configured.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function getFromEmail() {
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME ?? "Tamkeen";

  if (!fromEmail) {
    throw new Error("BREVO_FROM_EMAIL is not configured.");
  }

  return `${fromName} <${fromEmail}>`;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await getBrevoTransporter().sendMail({
      from: getFromEmail(),
      to,
      subject,
      html,
    });

    return {
      data: { id: info.messageId },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}
