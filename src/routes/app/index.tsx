import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Home, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleLabels, statutLabels } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Tableau de bord — Le Temps d'Aider" },
      { name: "description", content: "Vue d'ensemble des maisons, des résidents et de votre profil." },
      { property: "og:title", content: "Tableau de bord — Le Temps d'Aider" },
      { property: "og:description", content: "Vue d'ensemble des maisons et des résidents de l'ONG." },
    ],
  }),
});

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="surface-card p-4">
      <span className={`icon-chip h-10 w-10 ${color} text-primary-foreground`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const { profile, roles, isAdmin, isResponsable, managedHouseId } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", isAdmin, managedHouseId],
    queryFn: async () => {
      const [profilesRes, housesRes] = await Promise.all([
        supabase.from("profiles").select("id, statut, house_id"),
        supabase.from("houses").select("id, nom, ville"),
      ]);
      return {
        profiles: profilesRes.data ?? [],
        houses: housesRes.data ?? [],
      };
    },
  });

  const profiles = data?.profiles ?? [];
  const houses = data?.houses ?? [];
  const enAttente = profiles.filter((p) => p.statut === "en_attente").length;
  const valides = profiles.filter((p) => p.statut === "valide").length;
  const maMaison = houses.find((h) => h.id === (managedHouseId ?? profile?.house_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {profile?.prenom || ""} 👋</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {roles.map((r) => (
            <Badge key={r.role} variant="secondary">
              {roleLabels[r.role]}
            </Badge>
          ))}
          {profile && (
            <Badge variant={profile.statut === "valide" ? "default" : "outline"}>
              {statutLabels[profile.statut]}
            </Badge>
          )}
          {profile?.ville && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {profile.ville}
            </Badge>
          )}
        </div>
      </div>

      {profile?.statut === "en_attente" && (
        <div className="surface-card border-l-4 border-l-primary p-4">
          <p className="text-sm font-medium">Compte en attente de validation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            L'administrateur doit valider votre compte et vous assigner à une maison de votre ville.
            Vous pouvez déjà compléter votre profil.
          </p>
          <Link to="/app/profil" className="mt-3 inline-block text-sm font-medium text-primary">
            Compléter mon profil →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(isAdmin || isResponsable) && (
          <>
            <StatCard
              icon={Users}
              label="Résidents visibles"
              value={profiles.length}
              color="bg-brand-pink"
            />
            <StatCard
              icon={CheckCircle2}
              label="Comptes validés"
              value={valides}
              color="bg-brand-green"
            />
            <StatCard icon={Clock} label="En attente" value={enAttente} color="bg-brand-orange" />
          </>
        )}
        <StatCard
          icon={Home}
          label={isAdmin ? "Maisons de l'ONG" : `Maisons à ${profile?.ville ?? "votre ville"}`}
          value={houses.length}
          color="bg-brand-blue"
        />
      </div>

      {maMaison && (
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ma maison</p>
          <p className="mt-1 text-lg font-semibold">{maMaison.nom}</p>
          <p className="text-sm text-muted-foreground">{maMaison.ville}</p>
        </div>
      )}

      <div className="surface-card p-5">
        <h2 className="text-lg font-semibold">Prochaines étapes</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
          <li>Bibliothèque et suivi de lecture quotidien</li>
          <li>Contributions mensuelles de 10 000 FCFA</li>
          <li>Statistiques détaillées par maison</li>
        </ul>
      </div>
    </div>
  );
}
