import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { EmailTemplate } from "../src/components/EmailTemplate";

// Nearly-static SMTP configuration. Keep credentials in env.
const SMTP_HOST = "smtp.forwardemail.net";
const SMTP_PORT = 465;
const SMTP_SECURE = true;
const DEFAULT_FROM = "no-reply@example.com";

// Vercel Node.js Serverless Function handler
// Do NOT use NEXT_PUBLIC_* for secrets. Use server-only env vars like EMAIL_USER, EMAIL_PASS, etc.
export default async function handler(req: any, res: any) {
  // Basic CORS headers to allow calling from your frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      to,
      subject = "Hello from Flexi Wardrobe Builder",
      url = "https://example.com",
      from,
      screenshotBase64, // optional base64 data (data URL or raw base64)
    } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) ?? {};

    if (!to) {
      return res.status(400).json({ error: "Missing required field: to" });
    }

    const smtpUser = process.env.EMAIL_USER; // server-only
    const smtpPass = process.env.EMAIL_PASS; // server-only

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({
        error:
          "Email service not configured. Set EMAIL_USER and EMAIL_PASS in environment.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const cid = screenshotBase64 ? "design-screenshot" : undefined;
    const emailHtml = await render(EmailTemplate({ url, showImageCid: cid }));

    const attachments = [] as any[];
    if (screenshotBase64) {
      // Strip data URL prefix if present
      const base64Data = String(screenshotBase64).includes(",")
        ? String(screenshotBase64).split(",")[1]
        : screenshotBase64;
      attachments.push({
        filename: "design.png",
        content: base64Data,
        encoding: "base64",
        cid: cid,
        contentType: "image/png",
      });
    }

    await transporter.sendMail({
      from: from || DEFAULT_FROM || smtpUser,
      to,
      subject,
      html: emailHtml,
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Unknown error" });
  }
}
