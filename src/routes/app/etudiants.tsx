import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, statutLabels, type AppRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/etudiants")({
  component: EtudiantsPage,
  head: () => ({
    meta: [
      { title: "Étudiants — Foyers ONG Togo" },
      {
        name: "description",
        content: "Fiches des résidents : validation des comptes, maison assignée et rôles.",
      },
      { property: "og:title", content: "Étudiants — Foyers ONG Togo" },
      { property: "og:description", content: "Gestion des résidents des foyers de l'ONG." },
    ],
  }),
});

type Row = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  age: number | null;
  origine: string | null;
  faculte: string | null;
  annee_etude: string | null;
  annee_integration: number | null;
  telephone: string | null;
  house_id: string | null;
  statut: "en_attente" | "valide" | "refuse";
};

function EtudiantsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["etudiants"],
    queryFn: async () => {
      const [profilesRes, housesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("nom"),
        supabase.from("houses").select("id, nom, ville").order("nom"),
        supabase.from("user_roles").select("user_id, role, house_id"),
      ]);
      return {
        profiles: (profilesRes.data ?? []) as Row[],
        houses: housesRes.data ?? [],
        roles: (rolesRes.data ?? []) as { user_id: string; role: AppRole; house_id: string | null }[],
      };
    },
  });

  const houses = data?.houses ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.profiles ?? []).filter((p) =>
      q ? `${p.prenom} ${p.nom} ${p.email ?? ""}`.toLowerCase().includes(q) : true,
    );
  }, [data, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["etudiants"] });

  const updateProfile = async (id: string, values: Partial<Row>) => {
    const { error } = await supabase.from("profiles").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mise à jour enregistrée");
    invalidate();
  };

  const setResponsable = async (userId: string, houseId: string | null) => {
    if (!houseId) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "responsable");
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Rôle responsable retiré");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "responsable", house_id: houseId }, { onConflict: "user_id,role" });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Responsable de maison défini");
    }
    invalidate();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Étudiants</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "Tous les résidents de l'ONG" : "Les résidents de votre maison"}
        </p>
      </div>

      <Input
        placeholder="Rechercher un nom ou un email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun étudiant à afficher.</p>
      )}

      <div className="space-y-3">
        {rows.map((p) => {
          const house = houses.find((h) => h.id === p.house_id);
          const isResp = data?.roles.some((r) => r.user_id === p.id && r.role === "responsable");
          const open = openId === p.id;
          return (
            <div key={p.id} className="surface-card p-4">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setOpenId(open ? null : p.id)}
              >
                <div>
                  <p className="font-semibold">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={p.statut === "valide" ? "default" : "outline"}>
                      {statutLabels[p.statut]}
                    </Badge>
                    {house && <Badge variant="secondary">{house.nom}</Badge>}
                    {isResp && <Badge variant="secondary">Responsable</Badge>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{open ? "Fermer" : "Détails"}</span>
              </button>

              {open && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Âge" value={p.age?.toString()} />
                    <Info label="Téléphone" value={p.telephone} />
                    <Info label="Origine" value={p.origine} />
                    <Info label="Faculté" value={p.faculte} />
                    <Info label="Année d'étude" value={p.annee_etude} />
                    <Info label="Intégration" value={p.annee_integration?.toString()} />
                  </dl>

                  {isAdmin && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Maison</p>
                          <Select
                            value={p.house_id ?? "none"}
                            onValueChange={(v) =>
                              updateProfile(p.id, { house_id: v === "none" ? null : v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une maison" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucune</SelectItem>
                              {houses.map((h) => (
                                <SelectItem key={h.id} value={h.id}>
                                  {h.nom} · {h.ville}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Responsable de
                          </p>
                          <Select
                            value={
                              data?.roles.find((r) => r.user_id === p.id && r.role === "responsable")
                                ?.house_id ?? "none"
                            }
                            onValueChange={(v) => setResponsable(p.id, v === "none" ? null : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Aucune" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non responsable</SelectItem>
                              {houses.map((h) => (
                                <SelectItem key={h.id} value={h.id}>
                                  {h.nom} · {h.ville}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => updateProfile(p.id, { statut: "valide" })}>
                          Valider le compte
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProfile(p.id, { statut: "en_attente" })}
                        >
                          Mettre en attente
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateProfile(p.id, { statut: "refuse" })}
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
