import { ChevronLeft, ChevronRight, LayoutDashboard, Building2 } from "lucide-react";
import type { Tenant, TenantId } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

interface Props {
  tenants: Tenant[];
  selected: TenantId;
  onSelect: (id: TenantId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ tenants, selected, onSelect, collapsed, onToggle }: Props) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "flex border-b border-border p-4",
          collapsed ? "flex-col items-center gap-3" : "items-center justify-between",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-serif text-sm font-bold text-primary-foreground">
            R
          </div>
          {!collapsed && <span className="font-serif text-lg">Routeway</span>}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="p-3">
        {!collapsed && (
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
        )}
        <a
          href="#"
          className={cn(
            "flex items-center gap-2 rounded-md bg-muted px-2 py-2 text-sm font-medium",
            collapsed && "justify-center",
          )}
          title="Dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
          {!collapsed && "Dashboard"}
        </a>
      </nav>

      <div className="p-3 pt-0">
        {!collapsed && (
          <p className="px-2 pb-2 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tenants
          </p>
        )}
        <div className="flex flex-col gap-1">
          {tenants.map((t) => {
            const active = t.id === selected;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                title={t.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  collapsed && "justify-center",
                )}
              >
                {collapsed ? (
                  <span className="text-xs font-semibold">{t.label.split(" ")[1]}</span>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t.label}</span>
                    <span
                      className={cn("ml-auto h-2 w-2 rounded-full", t.active ? "bg-success" : "bg-skipped")}
                    />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
