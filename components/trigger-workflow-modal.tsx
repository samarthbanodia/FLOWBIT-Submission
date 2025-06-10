"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input }    from "@/components/ui/input"
import { Button }   from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  engine: string
}

export function TriggerWorkflowModal({
  open,
  onOpenChange,
  workflowId,
  engine,
}: Props) {
  const [mode,     setMode]    = useState<"manual"|"webhook"|"schedule">("manual")
  const [payload,  setPayload] = useState<string>("{}")
  const [cronExpr, setCronExpr] = useState<string>("0 * * * *")
  const webhookUrl = `${window.location.origin}/api/hooks/${workflowId}`

  const handleAction = async () => {
    let inputPayload: any = {}
    if (mode === "manual")   inputPayload = JSON.parse(payload || "{}")
    if (mode === "schedule") inputPayload = { cron: cronExpr }

    await fetch("/api/trigger", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ workflowId, engine, triggerType: mode, inputPayload }),
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Trigger {workflowId}</DialogTitle>
          <DialogDescription>Select Manual, Webhook, or Schedule</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value: string) => setMode(value as "manual" | "webhook" | "schedule")} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              rows={6}
              placeholder="Enter JSON payload"
            />
            <Button onClick={handleAction} className="mt-4">
              Trigger Now
            </Button>
          </TabsContent>

          <TabsContent value="webhook">
            <Input readOnly value={webhookUrl} />
            <Button
              className="mt-2"
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
            >
              Copy Webhook URL
            </Button>
          </TabsContent>

          <TabsContent value="schedule">
            <Input
              value={cronExpr}
              onChange={e => setCronExpr(e.target.value)}
              placeholder="Cron (e.g. 0 * * * *)"
            />
            <Button onClick={handleAction} className="mt-4">
              Save Schedule
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
