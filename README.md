# FlowBit Workflow Assignment

This repository demonstrates how to visually rebuild, trigger, and manage four LangFlow agents (Email, PDF, JSON, Classifier) from a Next.js + shadcn/ui frontend with manual, webhook, and cron triggers.
I couldnt make the trigger requests happen from the frontend to the langflow flows, I tried to debug it for days straight but was unsuccesfull.

---

## Prerequisites

* Node.js 18+ and npm (or yarn/pnpm)
* Docker & Docker Compose
* A LangFlow API key (`langflow api-key`)

---

## How to RUN 
* docker compose up -d - in the docker-compose.yml file folder
* npm install
* npm run build
* npm run dev - now your project is finally depolyed.

## Directory Structure

```
root/
├── app/                # Next.js app router
│   ├── api/
│   │   ├── executions/         # GET all & GET by id
│   │   ├── trigger/route.ts    # POST trigger
│   │   └── hooks/[workflowId]  # POST webhook proxy
│   └── flows/                  # (if you choose) flow JSONs
├── components/        # React UI components
│   ├── execution-details-modal.tsx
│   └── trigger-workflow-modal.tsx
├── flows/             # LangFlow auto-import folder
│   ├── email-agent.json
│   ├── pdf-agent.json
│   ├── json-agent.json
│   └── classifier-agent.json
├── lib/
│   └── cron.ts        # node-cron helper
├── custom_components/ # Custom Python components for LangFlow
│   └── parser.py      # ParserComponent
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

Create a `.env.local` in the project root:

```ini
# LangFlow
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_API_KEY=<your-langflow-api-key>

# n8n (optional)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=<your-n8n-api-key>
```



## Flows Directory

Drop your exported JSON flows into `./flows/`:

* `email-agent.json`
* `pdf-agent.json`
* `json-agent.json`
* `classifier-agent.json`

Restart LangFlow or click **Refresh Flows** in the UI to auto-import.

---



## Next.js API Routes

### Trigger Workflow (`POST /api/trigger`)

Proxy to LangFlow and n8n:

```ts
// POST /api/trigger
import { NextResponse } from 'next/server';
import { scheduleJob } from '../../../lib/cron';
export async function POST(req) {
  const { workflowId, engine, triggerType, inputPayload } = await req.json();
  // schedule branch
  // langflow manual: /run/:id?stream=false with { inputs: { Webhook: payload } }
  // langflow webhook: /api/v1/webhook/:id
  // n8n branch
}
```

### List Executions (`GET /api/executions`)

Fetch both n8n and LangFlow runs:

* LangFlow: GET `/api/v1/runs` with `x-api-key`
* n8n: GET `/rest/executions` with Bearer auth

### Execution Details (`GET /api/executions/[id]?engine=…`)

Fetch a single run:

* LangFlow: GET `/api/v1/runs/:id` with `x-api-key`
* n8n: GET `/rest/executions/:id`

### Public Webhook (`POST /api/hooks/[workflowId]`)

Forwards to `/api/trigger` with `triggerType: 'webhook'`.

---

## Cron Scheduling

File: `lib/cron.ts`

* Uses `node-cron` to schedule jobs
* Persists definitions in `cron-jobs.json`
* On startup (`app/api/_middleware.ts`), calls `initCron()`

---

## Frontend Integration

### Sidebar (`app-sidebar.tsx`)

List your four agents:

```js
const agentWorkflows = {
  unassigned: [
    { id: 'email-agent',      name: 'Email Agent',      engine: 'langflow' },
    …
  ]
};
```

### Trigger Modal (`components/trigger-workflow-modal.tsx`)

Three tabs: Manual, Webhook, Schedule. Sends to `/api/trigger` or copies `/api/hooks/:id`.

### Execution Details Modal (`components/execution-details-modal.tsx`)

* Streams logs via SSE (`/api/langflow/runs/:id/stream`)
* Calls `/api/executions/:id?engine=…` for details
* Renders Raw Data, Nodes, Logs

---

## Testing & Postman

1. **Verify LangFlow**

   ```bash
   curl -H "x-api-key:$LANGFLOW_API_KEY" http://localhost:7860/api/v1/flows
   ```
2. **Sync run**

   ```bash
   curl -X POST "…/api/v1/run/<flow>?stream=false" -H x-api-key…
   ```
3. **Proxy trigger**

   ```bash
   curl -X POST http://localhost:3000/api/trigger …
   ```
4. **List**

   ```bash
   curl http://localhost:3000/api/executions
   ```
5. **Details**

   ```bash
   curl "http://localhost:3000/api/executions/<id>?engine=langflow"
   ```

---

## Deployment

1. Build LangFlow Docker + Redis with `docker-compose up -d`.
2. Set `ENV` vars in Vercel / your host:

   * `LANGFLOW_BASE_URL`
   * `LANGFLOW_API_KEY`
   * (Optional) `N8N_…`
3. Push Next.js to Vercel (App Router auto-detects `app/api`).
4. Ensure `flows/` folder is mounted into LangFlow prod container.

---

Your FlowBit orchestration system is now ready: visual agents in LangFlow, manual/webhook/cron triggers, real-time logs, and a responsive Next.js UI! Feel free to extend by adding new agents or integrating more triggers.
