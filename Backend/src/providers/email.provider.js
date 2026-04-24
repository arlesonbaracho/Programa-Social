const nodemailer = require("nodemailer");

function createEmailProvider({
  enabled,
  host,
  port,
  secure,
  user,
  password,
  fromAddress,
  fromName,
}) {
  if (!enabled) {
    return {
      async send() {
        return { sent: false, skipped: true, reason: "Email notifications disabled." };
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: password } : undefined,
  });

  return {
    async send({ to, subject, text, html }) {
      const result = await transporter.sendMail({
        from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
        to,
        subject,
        text,
        html,
      });

      return {
        sent: true,
        messageId: result.messageId,
      };
    },
  };
}

module.exports = { createEmailProvider };
