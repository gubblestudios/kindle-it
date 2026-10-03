import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

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

  try {
    const redis = getRedis();

    const ids = await redis.zrange<string[]>(
      "reading:queue",
      0,
      -1
    );

    const items = await Promise.all(
      ids.reverse().map((id) =>
        redis.get(`reading:item:${id}`)
      )
    );

    return NextResponse.json({
      success: true,
      count: items.filter(Boolean).length,
      items: items.filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something went wrong",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
