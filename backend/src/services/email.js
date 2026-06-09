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

async function sendPasswordResetEmail({ email, token, nombre }) {
  const from = process.env.SMTP_FROM || 'GymFit360 <noreply@gymfit360.com>';
  const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/restablecer-password?token=${token}`;

  if (!transporter) {
    console.log(`[EMAIL MOCK] Para: ${email} | Reset token: ${token} | Nombre: ${nombre}`);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'Restablece tu contraseña - GymFit360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">GymFit360</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                      border-radius: 6px; text-decoration: none; font-weight: bold;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora.</p>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, ignora este mensaje.</p>
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

async function sendVerificationCode({ email, codigo, nombre }) {
  const from = process.env.SMTP_FROM || 'GymFit360 <noreply@gymfit360.com>';

  if (!transporter) {
    console.log(`[EMAIL MOCK] Para: ${email} | Código verificación: ${codigo} | Nombre: ${nombre}`);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'Verifica tu cuenta - GymFit360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">GymFit360</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Gracias por registrarte. Usa el siguiente código para verificar tu cuenta:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${codigo}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira en 15 minutos.</p>
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

module.exports = { sendAdminCode, sendVerificationCode, sendPasswordResetEmail };
