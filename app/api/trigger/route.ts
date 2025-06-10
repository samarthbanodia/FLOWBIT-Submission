import { NextResponse } from "next/server";
import { scheduleJob }    from "../../../lib/cron";

export async function POST(request: Request) {
  const { workflowId, engine, triggerType, inputPayload } = await request.json();
  if (!workflowId || !engine || !triggerType) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // ── Cron scheduling branch ──
  if (triggerType === "schedule") {
    const cronExpr = inputPayload?.cron;
    if (!cronExpr) {
      return NextResponse.json({ error: "Missing cron expression" }, { status: 400 });
    }
    scheduleJob({ workflowId, cronTime: cronExpr, engine, payload: {} });
    return NextResponse.json({ success: true, message: "Cron job scheduled" });
  }

  // ── LangFlow branch ──
  if (engine === "langflow") {
    const baseUrl = process.env.LANGFLOW_BASE_URL;
    const apiKey  = process.env.LANGFLOW_API_KEY;
    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "Missing LangFlow configuration" }, { status: 500 });
    }

    let url: string;
    let opts: RequestInit;

    if (triggerType === "manual") {
      // synchronous run so it appears in /runs
      url = `${baseUrl}/api/v1/run/${workflowId}?stream=false`;
    } else {
      // webhook or re-trigger
      url = `${baseUrl}/api/v1/webhook/${workflowId}`;
    }
    opts = {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":    apiKey,
      },
      body:    JSON.stringify(inputPayload || {}),
    };

    console.log("▶️ LangFlow call:", url, opts);
    const res  = await fetch(url, opts);
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: res.status });
    }
    try {
      const data = JSON.parse(text);
      return NextResponse.json({ success: true, data });
    } catch {
      // if it was HTML or malformed
      return NextResponse.json({ error: "Non-JSON response", body: text }, { status: 502 });
    }
  }

  // ── n8n branch ──
  if (engine === "n8n") {
    const baseUrl = process.env.N8N_BASE_URL;
    const apiKey  = process.env.N8N_API_KEY;
    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "Missing n8n configuration" }, { status: 500 });
    }

    const url = `${baseUrl}/rest/workflows/${workflowId}/run`;
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body:    JSON.stringify(inputPayload || {}),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  }

  // ── Unsupported engine ──
  return NextResponse.json({ error: "Unsupported engine" }, { status: 400 });
}
