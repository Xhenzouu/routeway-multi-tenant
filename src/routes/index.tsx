import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TenantConfigCard } from "@/components/dashboard/TenantConfigCard";
import { PipelineSimulator } from "@/components/dashboard/PipelineSimulator";
import { AuditTable } from "@/components/dashboard/AuditTable";
import { cloneInitialLogs, mockProcessRun, tenants } from "@/lib/payments/mockData";
import type { AuditLogs, StepResult, StepStatus, TenantId } from "@/lib/payments/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tenant Configuration — Multi-Tenant Payment Dashboard" },
      { name: "description", content: "Switch tenants, inspect isolated configs, and simulate routed Stripe payments." },
      { property: "og:title", content: "Multi-Tenant Payment Dashboard" },
      { property: "og:description", content: "Simulate multi-tenant Stripe payment routing with per-tenant audit logs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const idle: StepStatus[] = Array(5).fill("pending");

function Dashboard() {
  const [dark, setDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<TenantId>("tenant_a");
  const [logs, setLogs] = useState<AuditLogs>(cloneInitialLogs);
  const [counter, setCounter] = useState(4);
  const [steps, setSteps] = useState<StepResult[] | null>(null);
  const [states, setStates] = useState<StepStatus[]>(idle);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => mq.matches && setCollapsed(true);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => clearTimers, []);

  const resetRun = () => {
    clearTimers();
    setSteps(null);
    setStates(idle);
    setRunning(false);
  };

  const run = () => {
    clearTimers();
    const tenantId = selected;
    const result = mockProcessRun(tenantId);
    const n = counter;
    setCounter(n + 1);
    setSteps(result);
    setStates(idle);
    setRunning(true);
    let t = 0;
    result.forEach((r, i) => {
      timers.current.push(
        window.setTimeout(() => setStates((s) => s.map((v, j) => (j === i ? "running" : v))), t),
      );
      t += r.status === "skipped" ? 150 : r.durationMs;
      timers.current.push(
        window.setTimeout(() => setStates((s) => s.map((v, j) => (j === i ? r.status : v))), t),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setRunning(false);
        if (result[3]?.status !== "success") return;
        const id = String(n).padStart(3, "0");
        const slack = result[2]!;
        setLogs((l) => ({
          ...l,
          [tenantId]: [
            ...l[tenantId],
            {
              stripe_event_id: `evt_mock_${id}`,
              payment_intent_id: `pi_mock_${id}`,
              amount_cents: 5000,
              currency: "usd",
              stripe_fetch_status: "success",
              slack_post_status: slack.status === "success" ? "success" : "failed",
              slack_error: slack.error ?? null,
              processed_at: new Date().toISOString(),
            },
          ],
        }));
      }, t),
    );
  };

  const tenant = tenants.find((t) => t.id === selected)!;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          tenants={tenants}
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            resetRun();
          }}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-8">
            <h1 className="font-serif text-2xl md:text-3xl">Tenant Configuration</h1>
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle light and dark mode"
              className="rounded-md border border-border p-2 hover:bg-muted"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </header>
          <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
            <TenantConfigCard tenant={tenant} />
            <PipelineSimulator
              steps={steps}
              states={states}
              running={running}
              onRun={run}
              onReset={() => {
                resetRun();
                setLogs(cloneInitialLogs());
                setCounter(4);
              }}
            />
            <AuditTable rows={logs[selected]} />
          </div>
        </main>
      </div>
    </div>
  );
}
