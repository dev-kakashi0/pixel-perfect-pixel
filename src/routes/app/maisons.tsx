import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/maisons")({
  component: MaisonsPage,
  head: () => ({
    meta: [
      { title: "Les maisons — Foyers ONG Togo" },
      {
        name: "description",
        content: "Les 8 maisons de l'ONG à Lomé et Kara, leurs résidents et leurs responsables.",
      },
      { property: "og:title", content: "Les maisons — Foyers ONG Togo" },
      { property: "og:description", content: "Maisons d'hébergement étudiant à Lomé et Kara." },
    ],
  }),
});

function MaisonsPage() {
  const { managedHouseId, profile } = useAuth();

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
          6 maisons à Lomé et 2 à Kara, 6 résidents par maison.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {houses.map((h) => {
          const count = profiles.filter((p) => p.house_id === h.id).length;
          const mine = h.id === managedHouseId || h.id === profile?.house_id;
          return (
            <div key={h.id} className={`surface-card p-4 ${mine ? "border-primary" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{h.nom}</p>
                  <p className="text-sm text-muted-foreground">{h.ville}</p>
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
