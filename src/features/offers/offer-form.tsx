import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateOffer, useUpdateOffer } from "@/lib/db/offers";
import type { OfferDecision, OfferRow } from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  applicationId: string;
  initial?: OfferRow;
};

const DECISIONS: OfferDecision[] = [
  "pending",
  "negotiating",
  "accepted",
  "rejected",
];

export function OfferForm({
  open,
  onOpenChange,
  applicationId,
  initial,
}: Props) {
  const [form, setForm] = useState<Partial<OfferRow>>({});
  const create = useCreateOffer();
  const update = useUpdateOffer();

  useEffect(() => {
    if (!open) return;
    setForm(
      initial ?? {
        currency: "USD",
        decision: "pending",
        base_salary: null,
        bonus_target: null,
        signing_bonus: null,
        equity_value_annualized: null,
      },
    );
  }, [open, initial]);

  const submitting = create.isPending || update.isPending;

  const set = <K extends keyof OfferRow>(k: K, v: OfferRow[K] | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: form });
        toast.success("Offer updated");
      } else {
        await create.mutateAsync({
          application_id: applicationId,
          ...form,
        });
        toast.success("Offer added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const total =
    (form.base_salary ?? 0) +
    (form.bonus_target ?? 0) +
    (form.signing_bonus ?? 0) +
    (form.equity_value_annualized ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit offer" : "New offer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="base">Base salary</Label>
              <Input
                id="base"
                type="number"
                value={form.base_salary ?? ""}
                onChange={(e) =>
                  set(
                    "base_salary",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bonus">Bonus target</Label>
              <Input
                id="bonus"
                type="number"
                value={form.bonus_target ?? ""}
                onChange={(e) =>
                  set(
                    "bonus_target",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signing">Signing bonus</Label>
              <Input
                id="signing"
                type="number"
                value={form.signing_bonus ?? ""}
                onChange={(e) =>
                  set(
                    "signing_bonus",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="equity">Equity (annualized)</Label>
              <Input
                id="equity"
                type="number"
                value={form.equity_value_annualized ?? ""}
                onChange={(e) =>
                  set(
                    "equity_value_annualized",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency ?? "USD"}
                onChange={(e) => set("currency", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Decision</Label>
              <Select
                value={form.decision ?? "pending"}
                onValueChange={(v) => set("decision", v as OfferDecision)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECISIONS.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="received">Received</Label>
              <Input
                id="received"
                type="date"
                value={form.received_at ?? ""}
                onChange={(e) => set("received_at", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Decision deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline_at ?? ""}
                onChange={(e) => set("deadline_at", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="equity-md">Equity details (markdown)</Label>
              <Textarea
                id="equity-md"
                rows={3}
                value={form.equity_details_md ?? ""}
                onChange={(e) =>
                  set("equity_details_md", e.target.value || null)
                }
                placeholder="Strike price, vest schedule, refreshers, 409A, cliff…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="benefits">Benefits (markdown)</Label>
              <Textarea
                id="benefits"
                rows={3}
                value={form.benefits_md ?? ""}
                onChange={(e) => set("benefits_md", e.target.value || null)}
              />
            </div>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            Total comp (annualized):{" "}
            <span className="font-semibold">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: form.currency ?? "USD",
                maximumFractionDigits: 0,
              }).format(total)}
            </span>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
