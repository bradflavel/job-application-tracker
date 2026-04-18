import { useMemo, useState } from "react";
import { Building2, Mail, Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useContacts } from "@/lib/db/contacts";
import { ContactForm } from "@/features/contacts/contact-form";
import { ContactDetail } from "@/features/contacts/contact-detail";
import { ApplicationDetail } from "@/features/applications/application-detail";

export function ContactsPage() {
  const { data, isLoading } = useContacts();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email?.toLowerCase().includes(needle) ||
        c.role?.toLowerCase().includes(needle) ||
        c.company?.name.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Recruiters, referrers, hiring managers, interviewers."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search contacts…"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add recruiters, referrers, or interviewers. Link them to applications as you go."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add contact
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t hover:bg-muted/30"
                  onClick={() => setOpenId(c.id)}
                >
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.role ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {c.company ? (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {c.company.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContactForm open={creating} onOpenChange={setCreating} />
      <ContactDetail
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
