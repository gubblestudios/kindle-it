import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import nodemailer from "nodemailer";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const key = request.nextUrl.searchParams.get("key");

  if (key !== process.env.APP_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!url) {
    return NextResponse.json(
      { error: "Missing article URL" },
      { status: 400 }
    );
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const kindleEmail = process.env.KINDLE_EMAIL;

  if (!gmailUser || !gmailAppPassword || !kindleEmail) {
    return NextResponse.json(
      { error: "Missing email configuration" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch article: ${response.status}` },
        { status: 500 }
      );
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: "Could not extract readable article content" },
        { status: 500 }
      );
    }

    // Readability allows some fields to be null/undefined,
    // so normalize them here for TypeScript.
    const title = article.title?.trim() || "Article";
    const byline = article.byline?.trim() || undefined;

    // Strip media for a clean Kindle reading experience
const contentDom = new JSDOM(
  `<body>${article.content || ""}</body>`
);

contentDom.window.document
  .querySelectorAll(
    "img, picture, video, audio, iframe, svg, canvas, source, object, embed"
  )
  .forEach((element) => element.remove());

// Remove containers left empty after media is stripped
contentDom.window.document
  .querySelectorAll("figure, a")
  .forEach((element) => {
    if (!element.textContent?.trim() && !element.children.length) {
      element.remove();
    }
  });

const cleanContent =
  contentDom.window.document.body.innerHTML;

    const safeTitle = title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 100);

    const kindleHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>

  ${byline ? `<p><strong>${byline}</strong></p>` : ""}

  <hr>

  ${cleanContent}

  <hr>

  <p>
    Original article:
    <a href="${url}">${url}</a>
  </p>
</body>
</html>
`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: gmailUser,
      to: kindleEmail,
      subject: title,
      text: `Article sent from Kindle It: ${url}`,
      attachments: [
        {
          filename: `${safeTitle || "article"}.html`,
          content: kindleHtml,
          contentType: "text/html",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Sent to Kindle!",
      title,
      byline,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Something went wrong",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
