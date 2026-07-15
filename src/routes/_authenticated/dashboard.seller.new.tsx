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
import { Loader2, ShieldCheck, Plus, Trash2, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/seller/new")({
  component: NewRaffle,
});

const CATEGORIES = [
  "Electronics", "Fashion", "Watches", "Sneakers",
  "Vehicles", "Home", "Collectibles", "Other",
];

function NewRaffle() {
  const submit = useServerFn(submitRaffle);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electronics",
    target_value: 100000,
    ticket_price: 500,
    total_tickets: 200,
    sellout_policy: "refund" as "refund" | "extend" | "proportional",
    min_tickets_threshold: 100,
    deadline_iso: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    hero_image: "",
    serial_number: "",
  });

  // Additional gallery image URLs (up to 7, hero is position 0)
  const [galleryUrls, setGalleryUrls] = useState<string[]>([""]);

  const grossIfSoldOut = form.total_tickets * form.ticket_price;

  function updateGallery(idx: number, val: string) {
    setGalleryUrls((prev) => prev.map((u, i) => (i === idx ? val : u)));
  }

  function addGalleryRow() {
    if (galleryUrls.length >= 7) return;
    setGalleryUrls((prev) => [...prev, ""]);
  }

  function removeGalleryRow(idx: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const deadline = new Date(form.deadline_iso + "T23:59:59").toISOString();

      // Filter out blank gallery URLs
      const images = galleryUrls.filter((u) => u.trim().length > 0);

      const res = await submit({
        data: {
          ...form,
          deadline_iso: deadline,
          target_value: Number(form.target_value),
          ticket_price: Number(form.ticket_price),
          total_tickets: Number(form.total_tickets),
          min_tickets_threshold: Number(form.min_tickets_threshold),
          images: images.length > 0 ? images : undefined,
        },
      });
      toast.success("Submitted for verification — admin will review shortly");
      navigate({ to: "/raffles/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-bold">List an item</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the details below. An admin will verify your item before it goes live.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">

        {/* ── Item details ──────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Item details
          </legend>

          <div>
            <Label htmlFor="title">Item title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required minLength={4} maxLength={120}
              placeholder="e.g. iPhone 15 Pro Max 256GB, sealed"
            />
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required minLength={20} maxLength={4000}
              placeholder="Condition, included accessories, warranty status, reason for selling…"
            />
            <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/4000</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="serial">Serial number <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="serial"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="e.g. SN-123456"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Images ────────────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Images
          </legend>
          <p className="text-xs text-muted-foreground">
            Paste direct image URLs (e.g. from Google Drive, Imgur, Cloudinary). Hero image is shown on the card. Up to 7 additional gallery images.
          </p>

          <div>
            <Label htmlFor="hero_image">Hero image URL <span className="text-destructive">*</span></Label>
            <Input
              id="hero_image"
              type="url"
              value={form.hero_image}
              onChange={(e) => setForm({ ...form, hero_image: e.target.value })}
              placeholder="https://…"
              required
            />
            {form.hero_image && (
              <div className="mt-2 overflow-hidden rounded-md border border-border">
                <img
                  src={form.hero_image}
                  alt="Hero preview"
                  className="aspect-[4/3] w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> Additional gallery images
              <span className="text-muted-foreground ml-1">({galleryUrls.filter(u => u).length}/7)</span>
            </Label>
            {galleryUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => updateGallery(idx, e.target.value)}
                  placeholder={`Gallery image ${idx + 1} URL…`}
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => removeGalleryRow(idx)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {galleryUrls.length < 7 && (
              <Button type="button" variant="outline" size="sm" onClick={addGalleryRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add image
              </Button>
            )}
          </div>
        </fieldset>

        {/* ── Raffle pricing ────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Raffle pricing
          </legend>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="target_value">Item value (KSh) <span className="text-destructive">*</span></Label>
              <Input
                id="target_value"
                type="number" min={1}
                value={form.target_value}
                onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="ticket_price">Ticket price (KSh) <span className="text-destructive">*</span></Label>
              <Input
                id="ticket_price"
                type="number" min={1}
                value={form.ticket_price}
                onChange={(e) => setForm({ ...form, ticket_price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="total_tickets">Total tickets <span className="text-destructive">*</span></Label>
              <Input
                id="total_tickets"
                type="number" min={10} max={100000}
                value={form.total_tickets}
                onChange={(e) => setForm({ ...form, total_tickets: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Live payout preview */}
          <div className="rounded-md bg-muted p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross if sold out</span>
              <span className="font-semibold mono-num">{ksh(grossIfSoldOut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee (15%)</span>
              <span className="mono-num text-destructive">− {ksh(grossIfSoldOut * 0.15)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="font-medium">Your payout</span>
              <span className="font-semibold text-primary mono-num">{ksh(grossIfSoldOut * 0.85)}</span>
            </div>
          </div>
        </fieldset>

        {/* ── Sellout policy ────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sellout policy
          </legend>
          <div>
            <Label>What happens if the raffle doesn't sell out? <span className="text-destructive">*</span></Label>
            <Select
              value={form.sellout_policy}
              onValueChange={(v) => setForm({ ...form, sellout_policy: v as any })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="refund">Full refund if minimum threshold not met</SelectItem>
                <SelectItem value="extend">Extend deadline up to 7 extra days</SelectItem>
                <SelectItem value="proportional">Draw anyway — I accept a proportional payout</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              This policy is displayed on your listing and cannot be changed after the first ticket is sold.
            </p>
          </div>

          {form.sellout_policy === "refund" && (
            <div>
              <Label htmlFor="min_threshold">Minimum tickets threshold <span className="text-destructive">*</span></Label>
              <Input
                id="min_threshold"
                type="number" min={1} max={form.total_tickets}
                value={form.min_tickets_threshold}
                onChange={(e) => setForm({ ...form, min_tickets_threshold: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                If fewer than this many tickets sell by the deadline, all buyers are automatically refunded.
              </p>
            </div>
          )}
        </fieldset>

        {/* ── Schedule ──────────────────────────────────────────── */}
        <fieldset>
          <legend className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Schedule
          </legend>
          <div>
            <Label htmlFor="deadline">Raffle deadline <span className="text-destructive">*</span></Label>
            <Input
              id="deadline"
              type="date"
              value={form.deadline_iso}
              min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, deadline_iso: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Ticket sales close at 23:59 on this date. Must be at least 1 day from now.
            </p>
          </div>
        </fieldset>

        {/* ── Verification notice ───────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Admin verification required</p>
            <p className="mt-1 text-muted-foreground">
              Before your raffle goes live, an admin will verify you physically possess the item.
              For standard items: a photo of the item with a hand-written code and today's date.
              For high-value items: in-person or courier verification.
            </p>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Submit for verification
        </Button>
      </form>
    </div>
  );
}
