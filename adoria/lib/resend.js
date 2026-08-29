import { Resend } from "resend";

let client = null;

function getClient() {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set — see .env.example.");
  }
  client = new Resend(key);
  return client;
}

export async function sendPasswordResetEmail(email, resetUrl) {
  await getClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Cubelle <no-reply@cubelle.my>",
    to: email,
    subject: "Reset your Cubelle password",
    html: `
      <p>Someone asked to reset the password on this Cubelle account.</p>
      <p><a href="${resetUrl}">Reset your password</a> — this link works once and expires in 30 minutes.</p>
      <p>If this wasn't you, you can ignore this email; your password won't change.</p>
    `,
  });
}
