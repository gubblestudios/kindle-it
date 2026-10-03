import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Redis configuration");
  }

  return new Redis({ url, token });
}

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

  try {
    const redis = getRedis();

    const id = createHash("sha256")
      .update(url)
      .digest("hex")
      .slice(0, 16);

    const itemKey = `reading:item:${id}`;

    const existing = await redis.get(itemKey);

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyQueued: true,
        message: "Already in Reading List",
      });
    }

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

    const title = article.title?.trim() || "Article";
    const byline = article.byline?.trim() || undefined;

    const contentDom = new JSDOM(
      `<body>${article.content || ""}</body>`
    );

    contentDom.window.document
      .querySelectorAll(
        "img, picture, video, audio, iframe, svg, canvas, source, object, embed, script, style"
      )
      .forEach((element) => element.remove());

    contentDom.window.document
      .querySelectorAll("figure")
      .forEach((element) => {
        if (!element.textContent?.trim()) {
          element.remove();
        }
      });

    const cleanContent =
      contentDom.window.document.body.innerHTML;

    const item = {
      id,
      url,
      title,
      byline,
      content: cleanContent,
      addedAt: new Date().toISOString(),
    };

    await redis.set(itemKey, item);

    await redis.zadd("reading:queue", {
      score: Date.now(),
      member: id,
    });

    return NextResponse.json({
      success: true,
      message: "Added to Reading List",
      title,
      byline,
      id,
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
