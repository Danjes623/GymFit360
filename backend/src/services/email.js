const nodemailer = require('nodemailer');

function crearTransporte() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

const transporter = crearTransporte();

async function sendAdminCode({ email, codigo, nombre }) {
  const from = process.env.SMTP_FROM || 'GymFit360 <noreply@gymfit360.com>';

  if (!transporter) {
    console.log(`[EMAIL MOCK] Para: ${email} | Código: ${codigo} | Nombre: ${nombre}`);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'Tu código de activación - GymFit360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">GymFit360</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Gracias por adquirir tu suscripción de administrador.</p>
          <p>Usa el siguiente código para completar tu registro:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${codigo}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira en 24 horas.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">GymFit360 — Sistema de gestión de gimnasios</p>
        </div>
      `,
    });

    console.log(`[EMAIL OK] Para: ${email} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendAdminCode };
