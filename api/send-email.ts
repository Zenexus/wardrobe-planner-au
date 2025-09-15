import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { EmailTemplate } from "../src/components/EmailTemplate";
import { ContactEmailTemplate } from "../src/components/ContactEmailTemplate";

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
      // Contact form specific fields
      name,
      postcode,
      subscribe,
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

    // Determine if this is a contact form submission or design sharing
    const isContactForm = name && typeof name === "string";

    let emailHtml: string;
    if (isContactForm) {
      // For contact form submissions, send to admin/support email
      emailHtml = await render(
        ContactEmailTemplate({
          name,
          email: to,
          postcode,
          subscribe: Boolean(subscribe),
        })
      );
    } else {
      // For design sharing, use the original template
      const cid = screenshotBase64 ? "design-screenshot" : undefined;
      emailHtml = await render(EmailTemplate({ url, showImageCid: cid }));
    }

    const attachments = [] as any[];
    if (screenshotBase64 && !isContactForm) {
      // Only add screenshot attachments for design sharing emails
      const base64Data = String(screenshotBase64).includes(",")
        ? String(screenshotBase64).split(",")[1]
        : screenshotBase64;
      attachments.push({
        filename: "design.png",
        content: base64Data,
        encoding: "base64",
        cid: "design-screenshot",
        contentType: "image/png",
      });
    }

    // Configure email recipients and sender based on email type
    let emailTo: string;
    let emailFrom: string;
    let emailSubject: string;

    if (isContactForm) {
      // For contact forms: send TO admin, FROM the form user
      emailTo = process.env.ADMIN_EMAIL || smtpUser; // Admin receives the contact form
      emailFrom = from || DEFAULT_FROM || smtpUser; // From address (can't be the user's email due to SMTP restrictions)
      emailSubject = `Contact Form: ${subject}`;
    } else {
      // For design sharing: send TO user, FROM admin
      emailTo = to;
      emailFrom = from || DEFAULT_FROM || smtpUser;
      emailSubject = subject;
    }

    await transporter.sendMail({
      from: emailFrom,
      to: emailTo,
      subject: emailSubject,
      html: emailHtml,
      attachments,
      // For contact forms, add reply-to header with user's email
      ...(isContactForm && { replyTo: to }),
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Unknown error" });
  }
}
