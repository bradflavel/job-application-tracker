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

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const themes = ["light", "dark", "system"] as const;

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
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Google Calendar, email-forward inbox, reminders digest — wired up in later milestones.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
