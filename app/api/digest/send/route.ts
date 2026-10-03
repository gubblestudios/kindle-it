import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";
import epub from "epub-gen-memory";

export const runtime = "nodejs";

type ReadingItem = {
  id: string;
  url: string;
  title: string;
  byline?: string;
  content: string;
  addedAt: string;
};

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Redis configuration");
  }

  return new Redis({ url, token });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (key !== process.env.APP_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
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
    const redis = getRedis();

    // Oldest queued article first
    const ids = await redis.zrange<string[]>(
      "reading:queue",
      0,
      -1
    );

    if (!ids.length) {
      return NextResponse.json(
        { error: "Reading List is empty" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      ids.map((id) =>
        redis.get<ReadingItem>(`reading:item:${id}`)
      )
    );

    const items = results.filter(
      (item): item is ReadingItem => Boolean(item)
    );

    if (!items.length) {
      return NextResponse.json(
        { error: "No valid articles found" },
        { status: 400 }
      );
    }

    const date = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const digestTitle = `Reading List — ${date}`;

    const chapters = items.map((item) => ({
      title: item.title,
      author: item.byline || "",
      content: `
        ${item.byline ? `<p><strong>${item.byline}</strong></p>` : ""}
        ${item.content}
        <hr />
        <p>
          <a href="${item.url}">Original article</a>
        </p>
      `,
    }));

    const epubBuffer = await epub(
      {
        title: digestTitle,
        author: "Kindle It",
        version: 3,
      },
      chapters
    );

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
      subject: digestTitle,
      text: `${items.length} articles in your Kindle reading digest.`,
      attachments: [
        {
          filename: `reading-list-${new Date()
            .toISOString()
            .slice(0, 10)}.epub`,
          content: epubBuffer,
          contentType: "application/epub+zip",
        },
      ],
    });

    // Only clear the queue AFTER Kindle email succeeds
    for (const item of items) {
      await redis.del(`reading:item:${item.id}`);
      await redis.zrem("reading:queue", item.id);
    }

    return NextResponse.json({
      success: true,
      message: "Digest sent to Kindle!",
      articleCount: items.length,
      title: digestTitle,
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
