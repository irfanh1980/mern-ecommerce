import 'dotenv/config';
import nodemailer from 'nodemailer';

const mask = (value = '') => {
  const v = String(value);
  if (!v) return '(empty)';
  if (v.includes('@')) {
    const [name, domain] = v.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${v.slice(0, 3)}***`;
};

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const configuredFrom = (process.env.SMTP_FROM || '').trim();
const from = !configuredFrom || configuredFrom.toLowerCase().includes('example.com')
  ? user
  : configuredFrom;
const to = process.argv[2] || user;

console.log('--- SMTP connection ---');
console.log('host     :', host || '(empty)');
console.log('port     :', port);
console.log('secure   :', secure);
console.log('user     :', mask(user));
console.log('pass     :', pass ? '(set)' : '(empty)');
console.log('from     :', from || '(empty)');
console.log('send to  :', to || '(empty)');

if (!host || !user || !pass) {
  console.log('');
  console.log('SMTP is NOT configured. No verification email can be sent.');
  console.log('Fill SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env, then run this again.');
  console.log('');
  console.log('Provider settings:');
  console.log('  Gmail      SMTP_HOST=smtp.gmail.com      SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=you@gmail.com  SMTP_PASS=<app password>');
  console.log('  Brevo      SMTP_HOST=smtp-relay.brevo.com SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=you@x.com       SMTP_PASS=xsmtpsib-...');
  console.log('  SendGrid   SMTP_HOST=smtp.sendgrid.net   SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=apikey        SMTP_PASS=SG.xxxx');
  console.log('  Resend     SMTP_HOST=smtp.resend.com     SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=resend         SMTP_PASS=re_xxxx');
  console.log('  Mailtrap   SMTP_HOST=smtp.mailtrap.io   SMTP_PORT=2525 SMTP_SECURE=false  SMTP_USER=you@x.com       SMTP_PASS=<pass>');
  console.log('  Amazon SES SMTP_HOST=email-smtp.<region>.amazonaws.com SMTP_PORT=587 SMTP_SECURE=false SMTP_USER=AWS user SMTP_PASS=AWS pass');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('');
  console.log('connection: OK (host reachable, credentials accepted)');
} catch (error) {
  console.log('');
  console.log('connection: FAILED -', error.message);
  process.exit(1);
}

try {
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Marketplace - SMTP test',
    text: 'SMTP is working. Verification emails will be delivered from this connection.',
  });
  console.log('send      : OK - message id', info.messageId);
  console.log('accepted  :', info.accepted?.join(', ') || to);
  console.log('rejected  :', info.rejected?.join(', ') || 'none');
} catch (error) {
  console.log('send      : FAILED -', error.message);
  process.exit(1);
}
