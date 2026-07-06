const nodemailer = require('nodemailer');

const createTransporter = () => {
    // For development, use Ethereal if env vars are missing
    if (!process.env.SMTP_HOST) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = createTransporter();

        // If no SMTP config, log for development
        if (!transporter) {
            console.log('----------------------------------------------------');
            console.log(`[EMAIL MOCK] To: ${to}`);
            console.log(`[EMAIL MOCK] Subject: ${subject}`);
            console.log(`[EMAIL MOCK] Content: ${html}`);
            console.log('----------------------------------------------------');
            return { success: true, mock: true };
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Restaurant POS" <noreply@example.com>',
            to,
            subject,
            html
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };
