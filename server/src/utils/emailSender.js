import nodemailer from 'nodemailer';

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export const isEmailConfigured = smtpConfigured;

// The .env template ships a placeholder sender ("no-reply@example.com").
// Most providers reject an unverified sender, so fall back to the SMTP
// account itself when the placeholder is still in place.
const resolveFromAddress = () => {
  const from = (process.env.SMTP_FROM || '').trim();
  if (!from || from.toLowerCase().includes('example.com')) {
    return process.env.SMTP_USER;
  }
  return from;
};

const verificationTemplate = ({ name, verificationUrl }) => {
  const subject = 'Verify your Marketplace account';
  const text = [
    `Hi ${name},`,
    '',
    'Thanks for registering on Marketplace. Please confirm your email address to activate your account:',
    '',
    verificationUrl,
    '',
    'This link expires in 24 hours. If you did not create this account you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="margin:0 0 16px">Welcome to Marketplace, ${name}</h2>
      <p>Please confirm your email address to activate your account.</p>
      <p style="margin:24px 0">
        <a href="${verificationUrl}"
           style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          Verify my email
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">
        Or paste this link into your browser:<br />
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      <p style="font-size:12px;color:#6b7280">This link expires in 24 hours.</p>
    </div>
  `;

  return { subject, text, html };
};

export const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  const { subject, text, html } = verificationTemplate({ name, verificationUrl });

  if (!transporter) {
    console.log(
      `\n[email:dev-mode] SMTP is not configured (set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env to send real emails).\n[email:dev-mode] Verification link for ${to}:\n${verificationUrl}\n`
    );
    return { delivered: false, devMode: true };
  }

  await transporter.sendMail({
    from: resolveFromAddress(),
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, devMode: false };
};
