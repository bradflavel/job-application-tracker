import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useCompanies } from "@/lib/db/companies";
import { CompanyForm } from "@/features/companies/company-form";
import { CompanyDetail } from "@/features/companies/company-detail";
import { ApplicationDetail } from "@/features/applications/application-detail";

type Counts = Record<string, number>;

export function CompaniesPage() {
  const { data, isLoading } = useCompanies();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const counts = useQuery({
    queryKey: ["company-app-counts"],
    queryFn: async (): Promise<Counts> => {
      const { data, error } = await supabase
        .from("applications")
        .select("company_id")
        .is("deleted_at", null);
      if (error) throw error;
      const out: Counts = {};
      for (const row of data ?? []) {
        if (row.company_id) out[row.company_id] = (out[row.company_id] ?? 0) + 1;
      }
      return out;
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.industry?.toLowerCase().includes(needle) ||
        c.hq_location?.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Notes and research, reused across applications."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies…"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add companies directly, or they'll be created as you add applications."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add company
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenId(c.id)}
              className="rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.industry ?? "—"}
                    {c.hq_location ? ` · ${c.hq_location}` : ""}
                  </div>
                </div>
                {c.size && (
                  <Badge variant="outline" className="capitalize">
                    {c.size}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{counts.data?.[c.id] ?? 0} application(s)</span>
                {c.website && (
                  <span className="max-w-[140px] truncate">
                    {safeHost(c.website)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <CompanyForm open={creating} onOpenChange={setCreating} />
      <CompanyDetail
        id={openId}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
        onOpenApplication={(id) => {
          setOpenId(null);
          setOpenApp(id);
        }}
      />
      <ApplicationDetail
        id={openApp}
        open={!!openApp}
        onOpenChange={(v) => !v && setOpenApp(null)}
      />
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
