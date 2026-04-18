import { useState } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportButtons } from "@/features/import-export/export-buttons";
import { CsvImportDialog } from "@/features/import-export/csv-import-dialog";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const themes = ["light", "dark", "system"] as const;
  const [importing, setImporting] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme override.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themes.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={theme === t ? "default" : "outline"}
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import / export</CardTitle>
          <CardDescription>
            CSV export + import for applications, JSON backup for the full
            dataset (companies, contacts, interviews, offers, reminders, status
            history, attachment metadata).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExportButtons />
          <div>
            <Button onClick={() => setImporting(true)}>
              <Upload className="h-4 w-4" /> Import applications CSV
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Backups exclude Google Calendar tokens and email-inbox payloads for
            safety. Attachment rows reference storage paths only — the files
            themselves stay in Supabase Storage.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Google Calendar, email-forward inbox, reminders digest — wired up
            in later milestones.
          </CardDescription>
        </CardHeader>
      </Card>

      <CsvImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}
