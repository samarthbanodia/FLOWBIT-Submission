import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { workflowId: string } }) {
  const { workflowId } = params;
  const payload = await request.json();
  const url = new URL(request.url);
  url.pathname = "/api/trigger";
  url.search = "";
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId,
      engine: "langflow",
      triggerType: "webhook",
      inputPayload: payload,
    }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}