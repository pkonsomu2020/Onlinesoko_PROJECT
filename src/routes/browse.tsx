import { createFileRoute } from "@tanstack/react-router";
import { getPublicRaffles } from "@/lib/raffles.functions";
import { RaffleCard } from "@/components/raffle/RaffleCard";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/browse")({
  loader: () => getPublicRaffles(),
  head: () => ({
    meta: [
      { title: "Browse raffles — OnlineSoko" },
      { name: "description", content: "Browse verified item raffles. Filter by category, ending soon, or price." },
      { property: "og:title", content: "Browse raffles — OnlineSoko" },
      { property: "og:description", content: "Verified item raffles across Kenya. Filter by category and price." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { raffles } = Route.useLoaderData() as { raffles: any[] };
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"ending" | "price_asc" | "price_desc" | "newest">("ending");

  const categories = useMemo(
    () => Array.from(new Set(raffles.map((r) => r.category))).sort(),
    [raffles],
  );

  const filtered = useMemo(() => {
    let arr = raffles.filter((r) => r.status === "live");
    if (q) arr = arr.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
    if (cat !== "all") arr = arr.filter((r) => r.category === cat);
    switch (sort) {
      case "ending": arr = arr.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()); break;
      case "price_asc": arr = arr.sort((a, b) => Number(a.ticket_price) - Number(b.ticket_price)); break;
      case "price_desc": arr = arr.sort((a, b) => Number(b.ticket_price) - Number(a.ticket_price)); break;
    }
    return arr;
  }, [raffles, q, cat, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Browse raffles</h1>
      <p className="mt-1 text-muted-foreground">All items are verified before going live.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ending">Ending soon</SelectItem>
            <SelectItem value="price_asc">Ticket: low to high</SelectItem>
            <SelectItem value="price_desc">Ticket: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No live raffles match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => <RaffleCard key={r.id} raffle={r as any} />)}
          </div>
        )}
      </div>
    </div>
  );
}
