import { NextResponse } from "next/server";
import { LINKEDIN_POSTS } from "@/lib/content";

export async function GET() {
  return NextResponse.json({ posts: LINKEDIN_POSTS }, { status: 200 });
}
