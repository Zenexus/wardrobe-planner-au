import nodemailer from "nodemailer";

// Simple HTML email templates
function createEmailTemplate(url: string, showImageCid?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flexi Wardrobe Design</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #333; margin-bottom: 20px;">Your Flexi Wardrobe Design</h1>
          <p style="color: #666; margin-bottom: 30px;">Click the button below to view your design:</p>
          <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Design</a>
          ${showImageCid ? `<div style="margin-top: 30px;"><img src="cid:${showImageCid}" alt="Design screenshot" style="max-width: 100%; height: auto; border-radius: 4px;"></div>` : ""}
        </div>
      </body>
    </html>
  `;
}

function createContactEmailTemplate(props: {
  name: string;
  email: string;
  postcode?: string;
  subscribe: boolean;
}): string {
  const { name, email, postcode, subscribe } = props;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Flexi Wardrobe Plan Details</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">Thank You, ${name}!</h1>
            <p style="color: #666; font-size: 16px; margin: 0;">Your Flexi Wardrobe plan is ready</p>
          </div>
          
          <hr style="border: none; border-top: 2px solid #007bff; margin: 30px 0; width: 60px;">
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">Your Plan Details</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #333;">Name:</strong> 
                <span style="color: #666;">${name}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #333;">Email:</strong> 
                <span style="color: #666;">${email}</span>
              </div>
              
              ${
                postcode
                  ? `
              <div style="margin-bottom: 12px;">
                <strong style="color: #333;">Location (Postcode):</strong> 
                <span style="color: #666;">${postcode}</span>
              </div>
              `
                  : ""
              }
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">What's Next?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review your wardrobe design and measurements</li>
                <li style="margin-bottom: 8px;">Visit your local Bunnings store for product availability</li>
                <li style="margin-bottom: 8px;">Our team will contact you within 24-48 hours with detailed pricing</li>
                ${subscribe ? '<li style="margin-bottom: 8px;">You\'ll receive exclusive offers and updates via email</li>' : ''}
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://wardrobe-planner-au.vercel.app" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Return to Planner</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Thank you for choosing Flexi Wardrobe Builder<br>
              Questions? Reply to this email or visit your local Bunnings store.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Gmail SMTP configuration. Keep credentials in env.
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_SECURE = false; // Use STARTTLS
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
      requireTLS: true, // Gmail requires TLS
      auth: {
        user: smtpUser, // Your Gmail address
        pass: smtpPass, // Your Gmail App Password
      },
    });

    // Determine if this is a contact form submission or design sharing
    const isContactForm = name && typeof name === "string";

    let emailHtml: string;
    if (isContactForm) {
      // For contact form submissions, send to admin/support email
      emailHtml = createContactEmailTemplate({
        name,
        email: to,
        postcode,
        subscribe: Boolean(subscribe),
      });
    } else {
      // For design sharing, use the original template
      const cid = screenshotBase64 ? "design-screenshot" : undefined;
      emailHtml = createEmailTemplate(url, cid);
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
      // For contact forms: send TO client with their plan details
      emailTo = to; // Send to the client who filled out the form
      emailFrom = smtpUser; // From your Gmail account
      emailSubject = `Your Flexi Wardrobe Plan Details - ${name}`;
    } else {
      // For design sharing: send TO user, FROM admin
      emailTo = to;
      emailFrom = from || smtpUser; // Use provided from or default to SMTP user
      emailSubject = subject;
    }

    await transporter.sendMail({
      from: emailFrom,
      to: emailTo,
      subject: emailSubject,
      html: emailHtml,
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Email API Error:", error);
    console.error("Error stack:", error?.stack);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Unknown error" });
  }
}
