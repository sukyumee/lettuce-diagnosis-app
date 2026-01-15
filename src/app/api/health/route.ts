import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: "ok",
    apiKeyConfigured: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : null,
    timestamp: new Date().toISOString(),
  });
}
