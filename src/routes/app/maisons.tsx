import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/maisons")({
  component: MaisonsPage,
  head: () => ({
    meta: [
      { title: "Les maisons — Le Temps d'Aider" },
      {
        name: "description",
        content: "Les maisons de l'ONG à Lomé et Kara, leurs résidents et leurs responsables.",
      },
      { property: "og:title", content: "Les maisons — Le Temps d'Aider" },
      { property: "og:description", content: "Maisons d'hébergement étudiant à Lomé et Kara." },
    ],
  }),
});

const chips = ["bg-brand-pink", "bg-brand-green", "bg-brand-blue", "bg-brand-orange"];

function MaisonsPage() {
  const { managedHouseId, profile, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["maisons"],
    queryFn: async () => {
      const [housesRes, profilesRes] = await Promise.all([
        supabase.from("houses").select("*").order("ville").order("nom"),
        supabase.from("profiles").select("id, house_id, statut"),
      ]);
      return { houses: housesRes.data ?? [], profiles: profilesRes.data ?? [] };
    },
  });

  const houses = data?.houses ?? [];
  const profiles = data?.profiles ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Les maisons</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Toutes les maisons de l'ONG : 6 à Lomé et 2 à Kara, 6 résidents par maison."
            : `Les maisons de ${profile?.ville ?? "votre ville"}, 6 résidents par maison.`}
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {houses.map((h, i) => {
          const count = profiles.filter((p) => p.house_id === h.id).length;
          const mine = h.id === managedHouseId || h.id === profile?.house_id;
          return (
            <div key={h.id} className={`surface-card p-4 ${mine ? "border-primary" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`icon-chip h-10 w-10 ${chips[i % chips.length]} text-primary-foreground`}
                  >
                    <Home className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{h.nom}</p>
                    <p className="text-sm text-muted-foreground">{h.ville}</p>
                  </div>
                </div>
                <Badge variant={h.genre === "filles" ? "secondary" : "outline"}>
                  {h.genre === "filles" ? "Filles" : "Garçons"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {count} / {h.capacite} résidents enregistrés
              </p>
              {mine && <Badge className="mt-3">Ma maison</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
