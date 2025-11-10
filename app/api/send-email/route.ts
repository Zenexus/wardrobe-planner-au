import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import DesignEmail from "@/emails/DesignEmail";
import { NextRequest, NextResponse } from "next/server";

// Gmail SMTP configuration. Keep credentials in env.
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_SECURE = false; // Use STARTTLS

// Next.js App Router API Route Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Missing required field: to" },
        { status: 400 }
      );
    }

    const smtpUser = process.env.EMAIL_USER; // server-only
    const smtpPass = process.env.EMAIL_PASS; // server-only

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          error:
            "Email service not configured. Set EMAIL_USER and EMAIL_PASS in environment.",
        },
        { status: 500 }
      );
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
    } catch (renderError) {
      return NextResponse.json(
        {
          error: "Failed to render email template",
          details:
            renderError instanceof Error
              ? renderError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Add screenshot attachment if provided
    const attachments: Array<{
      filename: string;
      content: string;
      encoding: string;
      cid: string;
      contentType: string;
    }> = [];

    if (screenshotBase64) {
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

    await transporter.sendMail({
      from: from || smtpUser,
      to: to,
      subject: subject,
      html: emailHtml,
      attachments,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Error",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
