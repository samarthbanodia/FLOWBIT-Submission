import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const apiKey = process.env.LANGFLOW_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Missing LangFlow configuration" }, { status: 500 });
  }
  try {
    const res = await fetch(`${baseUrl}/api/v1/runs/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `LangFlow error: ${res.statusText}` }, { status: res.status });
    }
    const run = await res.json();
    return NextResponse.json({ run });
  } catch (error) {
    console.error("Error fetching LangFlow run details:", error);
    return NextResponse.json({ error: "Failed to fetch run details" }, { status: 500 });
  }
}