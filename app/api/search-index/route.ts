import { NextResponse } from "next/server";
import { buildSearchIndexPayload } from "@/lib/search/index.build";

export async function GET() {
  const payload = buildSearchIndexPayload();

  return NextResponse.json(payload, {
    status: 200,
    headers:
      process.env.NODE_ENV === "development"
        ? {
            "Cache-Control": "no-store"
          }
        : {
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
          }
  });
}
