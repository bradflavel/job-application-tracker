import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "default" | "success" | "warning" | "destructive";
};

const accentClasses: Record<NonNullable<Kpi["accent"]>, string> = {
  default: "text-primary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  destructive: "text-destructive",
};

export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  {kpi.label}
                </div>
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      accentClasses[kpi.accent ?? "default"],
                    )}
                  />
                )}
              </div>
              <div
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  accentClasses[kpi.accent ?? "default"],
                )}
              >
                {kpi.value}
              </div>
              {kpi.hint && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {kpi.hint}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
