import cron, { ScheduledTask } from "node-cron";
import fs from "fs";
import path from "path";

const CRON_STORAGE = path.resolve(process.cwd(), "cron-jobs.json");

type JobDef = { workflowId: string; cronTime: string; engine: string; payload?: any };

let scheduled: Record<string, ScheduledTask> = {};

function persist(jobs: JobDef[]) {
  fs.writeFileSync(CRON_STORAGE, JSON.stringify(jobs, null, 2));
}

function loadDefinitions(): JobDef[] {
  if (fs.existsSync(CRON_STORAGE)) {
    return JSON.parse(fs.readFileSync(CRON_STORAGE, "utf-8"));
  }
  return [];
}

export function scheduleJob(def: JobDef) {
  if (scheduled[def.workflowId]) {
    scheduled[def.workflowId].destroy();
  }
  const task = cron.schedule(def.cronTime, async () => {
    await fetch("http://localhost:3000/api/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId: def.workflowId,
        engine: def.engine,
        triggerType: "schedule",
        inputPayload: def.payload || {},
      }),
    });
  });
  scheduled[def.workflowId] = task;
  const defs = loadDefinitions().filter((j) => j.workflowId !== def.workflowId).concat(def);
  persist(defs);
}

export function initCron() {
  const defs = loadDefinitions();
  defs.forEach(scheduleJob);
}

// app/api/_middleware.ts

// Ensure cron jobs are initialized on every server start
