import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Briefcase, Command, LogOut, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/features/auth/auth-provider";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { useGlobalShortcuts } from "@/hooks/use-shortcuts";

export function AppShell() {
  const { theme, setTheme, resolved } = useTheme();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useGlobalShortcuts({ openPalette: () => setPaletteOpen(true) });

  const toggleTheme = () =>
    setTheme(
      theme === "system" ? (resolved === "dark" ? "light" : "dark") : theme === "dark" ? "light" : "dark",
    );

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-background/60 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Job Tracker</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="hidden md:inline-flex gap-2 text-muted-foreground"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="text-xs">Quick actions</span>
            <kbd className="rounded border bg-muted px-1.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            title={user?.email ?? undefined}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${mobileOpen ? "block" : "hidden"} w-60 shrink-0 border-r bg-background md:block`}
        >
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
