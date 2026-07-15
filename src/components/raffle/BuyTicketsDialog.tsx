import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { buyTickets } from "@/lib/buy.functions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ksh } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, Phone, CreditCard, Lock } from "lucide-react";

export function BuyTicketsDialog({
  raffleId, ticketPrice, remaining, trigger,
}: {
  raffleId: string;
  ticketPrice: number;
  remaining: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen]   = useState(false);
  const [qty, setQty]     = useState(1);
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const buy = useServerFn(buyTickets);
  const navigate = useNavigate();

  // Check auth every time dialog opens
  useEffect(() => {
    if (open) supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, [open]);

  const total = qty * ticketPrice;
  const cap   = Math.min(remaining, 100);

  // Validation — require phone for M-Pesa
  function canSubmit() {
    if (method === "mpesa" && phone.trim().length < 9) return false;
    return true;
  }

  async function submit() {
    if (!canSubmit()) {
      toast.error(method === "mpesa" ? "Enter your M-Pesa phone number" : "Enter your card number");
      return;
    }
    setLoading(true);
    try {
      const res = await buy({
        data: {
          raffle_id: raffleId,
          quantity: qty,
          method,
          // phone and card are passed for logging/reference only — payments are simulated
          ...(method === "mpesa" ? { phone: phone.trim() } : {}),
        },
      });
      toast.success(`🎟️ Tickets secured: #${res.ticket_numbers.join(", #")}`);
      setOpen(false);
      navigate({ to: "/dashboard/buyer" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy tickets</DialogTitle>
          <DialogDescription>
            Payments are simulated — no real money is charged in this build.
          </DialogDescription>
        </DialogHeader>

        {/* Not signed in */}
        {authed === false ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">You need to sign in to buy tickets.</p>
            <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quantity picker */}
            <div>
              <Label>Quantity</Label>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >−</Button>
                <Input
                  type="number"
                  min={1} max={cap}
                  value={qty}
                  onChange={(e) => setQty(Math.min(cap, Math.max(1, Number(e.target.value) || 1)))}
                  className="mono-num text-center"
                />
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => setQty(Math.min(cap, qty + 1))}
                >+</Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{remaining} tickets remaining · max 100 per purchase</p>
            </div>

            {/* Payment method tabs */}
            <Tabs value={method} onValueChange={(v) => setMethod(v as "mpesa" | "card")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mpesa"><Phone className="mr-1 h-3.5 w-3.5" /> M-Pesa</TabsTrigger>
                <TabsTrigger value="card"><CreditCard className="mr-1 h-3.5 w-3.5" /> Card</TabsTrigger>
              </TabsList>

              <TabsContent value="mpesa" className="space-y-2 pt-3">
                <Label htmlFor="mpesa-phone">M-Pesa phone number <span className="text-destructive">*</span></Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="+254 7xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A push notification will be sent to this number.
                </p>
              </TabsContent>

              <TabsContent value="card" className="space-y-2 pt-3">
                <Label htmlFor="card-number">Card number <span className="text-destructive">*</span></Label>
                <Input
                  id="card-number"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="card-expiry" className="text-xs">Expiry</Label>
                    <Input id="card-expiry" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div>
                    <Label htmlFor="card-cvv" className="text-xs">CVV</Label>
                    <Input id="card-cvv" placeholder="•••" maxLength={4} type="password" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Total summary */}
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">
                  {qty} ticket{qty > 1 ? "s" : ""} × {ksh(ticketPrice)}
                </span>
                <span className="font-display text-xl font-semibold mono-num">{ksh(total)}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Funds held in escrow until draw + handover confirmed
              </div>
            </div>
          </div>
        )}

        {authed !== false && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={loading || !canSubmit()}>
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Confirm purchase
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
