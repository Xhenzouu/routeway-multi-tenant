import { Check, X, Loader2, Minus, AlertTriangle, Circle, ArrowRight } from "lucide-react";
import type { StepResult, StepStatus } from "@/lib/payments/types";
import { STEPS } from "@/lib/payments/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  steps: StepResult[] | null;
  states: StepStatus[];
  running: boolean;
  onRun: () => void;
  onReset: () => void;
  onInspect: () => void;
  canInspect: boolean;
}

const styles: Record<StepStatus, string> = {
  pending: "border-border text-muted-foreground",
  running: "border-primary text-primary",
  success: "border-success text-success",
  failed: "border-danger text-danger",
  warning: "border-warning text-warning",
  skipped: "border-skipped/50 text-skipped",
};

function Icon({ s }: { s: StepStatus }) {
  const c = "h-4 w-4";
  if (s === "running") return <Loader2 className={cn(c, "animate-spin")} />;
  if (s === "success") return <Check className={c} />;
  if (s === "failed") return <X className={c} />;
  if (s === "warning") return <AlertTriangle className={c} />;
  if (s === "skipped") return <Minus className={c} />;
  return <Circle className={c} />;
}

export function PipelineSimulator({ steps, states, running, onRun, onReset, onInspect, canInspect }: Props) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Pipeline Simulator</h2>
          <p className="text-sm text-muted-foreground">Simulate a Stripe webhook routed to this tenant.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="bg-transparent shadow-none"
            disabled={!canInspect}
            onClick={onInspect}
          >
            Inspect Webhook
          </Button>
          <Button
            onClick={onReset}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Reset Demo
          </Button>
          <Button
            onClick={onRun}
            disabled={running}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {running ? "Processing…" : "Process Payment"}
          </Button>
        </div>
      </div>

      <ol className="mt-6 grid gap-3 lg:grid-cols-[repeat(6,minmax(0,1fr))]">
        {STEPS.map((name, i) => {
          const s: StepStatus = states[i] ?? "pending";
          const r = steps?.[i];
          const shown = s !== "pending" && s !== "running";
          return (
            <li key={name} className="relative flex min-w-0 items-stretch">
              <div className={cn("flex w-full min-w-0 flex-col gap-2 rounded-md border p-3 transition-colors", styles[s])}>
                <div className="flex items-center gap-2">
                  <Icon s={s} />
                  <span className="text-xs font-medium uppercase tracking-wider">Step {i + 1}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{r?.step ?? name}</p>
                <p className="text-xs capitalize">
                  {s}
                  {shown && r && r.durationMs > 0 && <span className="text-muted-foreground"> · {r.durationMs}ms</span>}
                </p>
                {shown && r?.error && (
                  <p className="truncate text-xs" title={r.error}>{r.error}</p>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 bg-card text-muted-foreground lg:block" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
