const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendAlertEmail({ monitorName, url, status, detail, downtimeDuration }) {
  const isDown = status === 'down';
  const subject = isDown ? `🔴 ${monitorName} is DOWN` : `🟢 ${monitorName} is back UP`;

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color:${isDown ? '#dc2626' : '#16a34a'};">${subject}</h2>
      <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
      <p><strong>Status:</strong> ${status.toUpperCase()}</p>
      ${detail ? `<p><strong>Detail:</strong> ${detail}</p>` : ''}
      ${!isDown && downtimeDuration ? `<p><strong>Was down for:</strong> ${downtimeDuration}</p>` : ''}
      <p style="color:#888;font-size:12px;">Sent at ${new Date().toLocaleString()}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Uptime Monitor" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_TO,
      subject,
      html,
    });
    console.log(`📧 Alert email sent: ${subject}`);
  } catch (err) {
    console.error('❌ Failed to send alert email:', err.message);
  }
}

module.exports = { sendAlertEmail };