import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitRaffle } from "@/lib/seller.functions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ksh } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/seller/new")({
  component: NewRaffle,
});

const CATEGORIES = ["Electronics", "Fashion", "Watches", "Sneakers", "Vehicles", "Home", "Collectibles", "Other"];

function NewRaffle() {
  const submit = useServerFn(submitRaffle);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "Electronics",
    target_value: 100000, ticket_price: 500, total_tickets: 200,
    sellout_policy: "refund" as "refund" | "extend" | "proportional",
    min_tickets_threshold: 100,
    deadline_iso: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    hero_image: "", serial_number: "",
  });

  const grossIfSoldOut = form.total_tickets * form.ticket_price;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const deadline = new Date(form.deadline_iso + "T23:59:59").toISOString();
      const res = await submit({
        data: {
          ...form,
          deadline_iso: deadline,
          target_value: Number(form.target_value),
          ticket_price: Number(form.ticket_price),
          total_tickets: Number(form.total_tickets),
          min_tickets_threshold: Number(form.min_tickets_threshold),
        },
      });
      toast.success("Submitted for verification");
      navigate({ to: "/raffles/$id", params: { id: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-bold">List an item</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit the details below. An admin will verify your item before it goes live.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <Label>Item title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={4} maxLength={120} placeholder="e.g. iPhone 15 Pro Max 256GB, sealed" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={20} maxLength={4000} placeholder="Condition, accessories, warranty…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Item value (KSh)</Label>
            <Input type="number" min={1} value={form.target_value} onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Ticket price (KSh)</Label>
            <Input type="number" min={1} value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Total tickets</Label>
            <Input type="number" min={10} value={form.total_tickets} onChange={(e) => setForm({ ...form, total_tickets: Number(e.target.value) })} />
          </div>
        </div>

        <div className="rounded-md bg-muted p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Gross if sold out</span><span className="font-semibold mono-num">{ksh(grossIfSoldOut)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Your payout (after 15% fee)</span><span className="font-semibold text-primary mono-num">{ksh(grossIfSoldOut * 0.85)}</span></div>
        </div>

        <div>
          <Label>If the raffle doesn't sell out</Label>
          <Select value={form.sellout_policy} onValueChange={(v) => setForm({ ...form, sellout_policy: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="refund">Full refund if minimum not met</SelectItem>
              <SelectItem value="extend">Extend deadline up to 7 days</SelectItem>
              <SelectItem value="proportional">Draw anyway — I accept a proportional payout</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">This policy is fixed once ticket sales begin and shown on the listing.</p>
        </div>

        {form.sellout_policy === "refund" && (
          <div>
            <Label>Minimum tickets threshold</Label>
            <Input type="number" min={1} value={form.min_tickets_threshold} onChange={(e) => setForm({ ...form, min_tickets_threshold: Number(e.target.value) })} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Deadline</Label>
            <Input type="date" value={form.deadline_iso} onChange={(e) => setForm({ ...form, deadline_iso: e.target.value })} required />
          </div>
          <div>
            <Label>Serial number (optional)</Label>
            <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Hero image URL</Label>
          <Input type="url" value={form.hero_image} onChange={(e) => setForm({ ...form, hero_image: e.target.value })} placeholder="https://…" />
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Admin will contact you for photo-with-code or in-person verification before this goes live.</span>
        </div>

        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Submit for verification
        </Button>
      </form>
    </div>
  );
}
