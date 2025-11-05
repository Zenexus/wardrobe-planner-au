import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import DesignEmail from "../emails/DesignEmail";

// Gmail SMTP configuration. Keep credentials in env.
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_SECURE = false; // Use STARTTLS

// Vercel Node.js Serverless Function handler
// Do NOT use NEXT_PUBLIC_* for secrets. Use server-only env vars like EMAIL_USER, EMAIL_PASS, etc.
export default async function handler(req: any, res: any) {
  try {
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

    console.log("[Email API] Request received");

    const {
      to,
      subject = "Your Flexi Wardrobe Design",
      url = "https://wardrobe-planner.flexistorage.com.au/",
      from,
      screenshotBase64, // optional base64 data (data URL or raw base64)
      products = [],
      organizers = [],
      totalPrice = 0,
      totalItems = 0,
      totalQuantity = 0,
      designCode = "",
      customerName = "",
      bunningsCheckoutUrl = "",
      bunningsTradeCheckoutUrl = "",
    } = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) ?? {};

    console.log("[Email API] Sending to:", to);

    if (!to) {
      return res.status(400).json({ error: "Missing required field: to" });
    }

    const smtpUser = process.env.EMAIL_USER; // server-only
    const smtpPass = process.env.EMAIL_PASS; // server-only

    console.log("[Email API] ENV check - EMAIL_USER:", smtpUser ? "✓" : "✗");
    console.log("[Email API] ENV check - EMAIL_PASS:", smtpPass ? "✓" : "✗");

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
      requireTLS: true, // Gmail requires TLS
      auth: {
        user: smtpUser, // Your Gmail address
        pass: smtpPass, // Your Gmail App Password
      },
    });

    console.log("[Email API] Rendering email template...");

    // Render the design email template
    let emailHtml: string;
    try {
      emailHtml = await render(
        DesignEmail({
          url,
          showImage: Boolean(screenshotBase64),
          products,
          organizers,
          totalPrice,
          totalItems,
          totalQuantity,
          designCode,
          customerName,
          bunningsCheckoutUrl,
          bunningsTradeCheckoutUrl,
        })
      );
      console.log("[Email API] Email template rendered successfully");
    } catch (renderError: any) {
      console.error("[Email API] Render error:", renderError);
      return res.status(500).json({
        error: "Failed to render email template",
        details: renderError.message,
      });
    }

    // Add screenshot attachment if provided
    const attachments = [] as any[];
    if (screenshotBase64) {
      console.log("[Email API] Adding screenshot attachment...");
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

    console.log("[Email API] Sending email...");

    await transporter.sendMail({
      from: from || smtpUser,
      to: to,
      subject: subject,
      html: emailHtml,
      attachments,
    });

    console.log("[Email API] Email sent successfully to:", to);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("[Email API] Error:", error);
    console.error("[Email API] Error stack:", error?.stack);
    console.error("[Email API] Error name:", error?.name);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
      errorType: error?.name || "Error",
    });
  }
}
