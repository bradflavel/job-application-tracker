import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const navItems: Array<{ label: string; path: string }> = [
  { label: "Go to Dashboard", path: "/" },
  { label: "Go to Applications", path: "/apps" },
  { label: "Go to Companies", path: "/companies" },
  { label: "Go to Contacts", path: "/contacts" },
  { label: "Go to Analytics", path: "/analytics" },
  { label: "Go to Reminders", path: "/reminders" },
  { label: "Go to Offers", path: "/offers/compare" },
  { label: "Go to Archive", path: "/archive" },
  { label: "Go to Settings", path: "/settings" },
];

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <Command className="border-none">
          <Command.Input
            placeholder="Type a command or search…"
            className="flex h-11 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>
            <Command.Group
              heading="Navigation"
              className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {navItems.map((i) => (
                <Command.Item
                  key={i.path}
                  onSelect={() => go(i.path)}
                  className="flex cursor-pointer items-center rounded px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  {i.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group
              heading="Actions"
              className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              <Command.Item
                onSelect={() => go("/apps?new=1")}
                className="flex cursor-pointer items-center rounded px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                New application
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setTheme("light");
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center rounded px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                Theme: Light
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setTheme("dark");
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center rounded px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                Theme: Dark
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setTheme("system");
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center rounded px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                Theme: System
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
