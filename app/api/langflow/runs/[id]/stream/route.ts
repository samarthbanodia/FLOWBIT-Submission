import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const apiKey = process.env.LANGFLOW_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Missing LangFlow configuration" }, { status: 500 });
  }
  const upstream = await fetch(`${baseUrl}/api/v1/runs/${id}/stream`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to connect to LangFlow stream" }, { status: 500 });
  }
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "text/event-stream" },
  });
}