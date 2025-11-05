import nodemailer from "nodemailer";

// Gmail SMTP configuration
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_SECURE = false;

export default async function handler(req: any, res: any) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { to, subject = "Test Email", text = "This is a test" } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Missing 'to' field" });
    }

    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        error: "Email not configured",
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      requireTLS: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: to,
      subject: subject,
      text: text,
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}
