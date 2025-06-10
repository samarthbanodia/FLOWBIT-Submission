// app/api/executions/[id]/route.ts
import { NextResponse } from "next/server";

async function fetchLangflowExecutionDetails(id: string) {
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  const apiKey  = process.env.LANGFLOW_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Missing LangFlow configuration");
  }
  // const res = await fetch(`${baseUrl}/api/v1/runs/${id}`, {
  //   headers: { "x-api-key": process.env.LANGFLOW_API_KEY!, "Content-Type": "application/json" },

  // });
  // if (!res.ok) {
  //   throw new Error(`LangFlow error ${res.status}: ${await res.text()}`);
  // }
  // return res.json();
    const res = await fetch(`${baseUrl}/api/v1/runs/${id}`, {
        headers: {
          "x-api-key": apiKey,
          "Accept":    "application/json",
        },
      });
    
      // Grab raw body
      const text = await res.text();
      const contentType = res.headers.get("content-type") || "";
    
      // If we got HTML, probably wrong runId or bad key
      if (!contentType.includes("application/json")) {
        throw new Error(
          `Expected JSON from LangFlow but got HTML (check run ID and API key):\n${text
            .slice(0, 300)
            .replace(/\n/g, " ")}...`
        );
      }
    
      // Parse JSON
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e: any) {
        throw new Error(`Failed to parse JSON: ${e.message}`);
      }
    
      if (!res.ok) {
        throw new Error(`LangFlow API ${res.status}: ${JSON.stringify(data)}`);
      }
    
      return data;
}

async function fetchN8nExecutionDetails(id: string) {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey  = process.env.N8N_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Missing n8n configuration");
  }
  const res = await fetch(`${baseUrl}/rest/executions/${id}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept":        "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`n8n error ${res.status}: ${await res.text()}`);
  }
  return res.json();
    const text = await res.text();
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `Expected JSON from n8n but got HTML or plaintext:\n${text.slice(0,300)}...`
    );
  }
  const data = JSON.parse(text);
  if (!res.ok) {
    throw new Error(`n8n API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url    = new URL(request.url);
  const engine = url.searchParams.get("engine");
  console.log("👉 GET /api/executions/[id] called with", { id, engine });
  console.log("👉 LANGFLOW_BASE_URL =", process.env.LANGFLOW_BASE_URL);
  console.log("👉 LANGFLOW_API_KEY loaded?", !!process.env.LANGFLOW_API_KEY);

  try {
    let data;
    if (engine === "langflow") {
      data = await fetchLangflowExecutionDetails(id);
    } else if (engine === "n8n") {
      data = await fetchN8nExecutionDetails(id);
    } else {
      return NextResponse.json(
        { error: "Engine must be 'langflow' or 'n8n'" },
        { status: 400 }
      );
    }
    return NextResponse.json({ execution: data });
  } catch (err: any) {
    console.error("Error fetching execution details:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch execution details" },
      { status: 502 }
    );
  }
}
