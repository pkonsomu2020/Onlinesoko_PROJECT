import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { getMyProfile } from "@/lib/me.functions";
import { Ticket, Store, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: () => getMyProfile(),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { roles } = Route.useLoaderData();
  const loc = useLocation();
  const isAdmin = roles.includes("admin");

  const tabs = [
    { to: "/dashboard/buyer", label: "My tickets", icon: Ticket },
    { to: "/dashboard/seller", label: "Sell items", icon: Store },
    ...(isAdmin ? [{ to: "/dashboard/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const active = loc.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to as any}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
