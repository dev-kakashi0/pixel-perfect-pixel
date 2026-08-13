import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, LayoutDashboard, LogOut, User, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { VilleGate } from "@/components/ville-gate";
import logoAsset from "@/assets/logo-tda.png.asset.json";
const logo = logoAsset.url;

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, isAdmin, isResponsable, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (profile && !profile.ville && !isAdmin) {
    return <VilleGate />;
  }

  const nav = [
    { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, show: true, color: "text-brand-pink" },
    {
      to: "/app/etudiants",
      label: "Étudiants",
      icon: Users,
      show: isAdmin || isResponsable,
      color: "text-brand-blue",
    },
    { to: "/app/maisons", label: "Maisons", icon: Home, show: true, color: "text-brand-green" },
    { to: "/app/profil", label: "Profil", icon: User, show: true, color: "text-brand-orange" },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-deep px-5 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card p-1.5">
              <img
                src={logo}
                alt="Logo Le Temps d'Aider"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] opacity-80">Le Temps d'Aider</p>
              <p className="text-lg font-semibold">
                {profile?.prenom || profile?.nom
                  ? `${profile.prenom} ${profile.nom}`.trim()
                  : "Mon espace"}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-1 h-4 w-4" />
            Quitter
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`icon-chip h-9 w-9 ${active ? "bg-muted" : ""} ${item.color}`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
