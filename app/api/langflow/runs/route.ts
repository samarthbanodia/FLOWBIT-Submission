import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const apiKey = process.env.LANGFLOW_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Missing LangFlow configuration" }, { status: 500 });
  }
  try {
    const res = await fetch(`${baseUrl}/api/v1/runs`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `LangFlow error: ${res.statusText}` }, { status: res.status });
    }
    const data = await res.json();
    const runs = data.runs.map((run: any) => ({
      id: run.id,
      workflowId: run.flow_id,
      workflowName: run.flow_name,
      engine: "langflow",
      status: run.status === "SUCCESS" ? "success" : run.status === "ERROR" ? "error" : "running",
      duration: run.duration ? `${run.duration.toFixed(1)}s` : "N/A",
      startTime: new Date(run.timestamp)
        .toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(",", ""),
      triggerType: run.trigger_type || "manual",
      folderId: run.tags?.[0] || "unassigned",
    }));
    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error fetching LangFlow runs:", error);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}
