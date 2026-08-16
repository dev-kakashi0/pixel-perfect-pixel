import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { anneeAcademiqueCourante } from "@/lib/annee";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";

type HouseForm = {
  id?: string;
  nom: string;
  ville: string;
  genre: "garcons" | "filles";
  capacite: number;
};

const emptyHouse: HouseForm = { nom: "", ville: "Lomé", genre: "garcons", capacite: 6 };

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
      const [housesRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from("houses").select("*").order("ville").order("nom"),
        supabase.from("profiles").select("id, house_id, statut, prenom, nom, telephone, photo_url"),
        supabase.from("user_roles").select("user_id, house_id").eq("role", "responsable"),
      ]);
      return {
        houses: housesRes.data ?? [],
        profiles: profilesRes.data ?? [],
        responsables: rolesRes.data ?? [],
      };
    },
  });

  const houses = data?.houses ?? [];
  const profiles = data?.profiles ?? [];
  const responsables = data?.responsables ?? [];

  const qc = useQueryClient();
  const [form, setForm] = useState<HouseForm | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form) return;
    if (!form.nom.trim()) {
      toast.error("Donne un nom à la maison");
      return;
    }
    setSaving(true);
    const payload = {
      nom: form.nom.trim(),
      ville: form.ville,
      genre: form.genre,
      capacite: Number(form.capacite) || 6,
    };
    const { error } = form.id
      ? await supabase.from("houses").update(payload).eq("id", form.id)
      : await supabase.from("houses").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Maison mise à jour" : "Maison ajoutée");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["maisons"] });
  };

  const remove = async (id: string, nom: string) => {
    if (!confirm(`Supprimer la maison « ${nom} » ?`)) return;
    const { error } = await supabase.from("houses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Maison supprimée");
    qc.invalidateQueries({ queryKey: ["maisons"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2">
            Année {anneeAcademiqueCourante()}
          </Badge>
          <h1 className="text-2xl font-bold">Les maisons</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Toutes les maisons de l'ONG à Lomé et Kara. Tu peux les nommer et les modifier."
              : `Les maisons de ${profile?.ville ?? "votre ville"}.`}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setForm({ ...emptyHouse })}>
            <Plus className="mr-1 h-4 w-4" /> Maison
          </Button>
        )}
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
                <div className="flex items-center gap-1">
                  <Badge variant={h.genre === "filles" ? "secondary" : "outline"}>
                    {h.genre === "filles" ? "Filles" : "Garçons"}
                  </Badge>
                  {isAdmin && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Modifier ${h.nom}`}
                        onClick={() =>
                          setForm({
                            id: h.id,
                            nom: h.nom,
                            ville: h.ville,
                            genre: h.genre,
                            capacite: h.capacite,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Supprimer ${h.nom}`}
                        onClick={() => remove(h.id, h.nom)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {count} / {h.capacite} résidents enregistrés
              </p>
              {(() => {
                const resp = responsables.find((r) => r.house_id === h.id);
                const fiche = resp ? profiles.find((p) => p.id === resp.user_id) : undefined;
                if (!fiche || !(mine || isAdmin)) return null;
                const tel = fiche.telephone?.replace(/[^0-9+]/g, "") ?? "";
                return (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                    <UserAvatar path={fiche.photo_url} nom={fiche.prenom} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Responsable
                      </p>
                      <p className="truncate text-sm font-medium">
                        {fiche.prenom} {fiche.nom}
                      </p>
                    </div>
                    {tel && (
                      <div className="flex gap-2">
                        <a
                          href={`tel:${tel}`}
                          aria-label={`Appeler ${fiche.prenom}`}
                          className="icon-chip h-9 w-9 bg-brand-blue text-primary-foreground"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${tel.replace(/^\+/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp ${fiche.prenom}`}
                          className="icon-chip h-9 w-9 bg-brand-green text-primary-foreground"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
              {mine && <Badge className="mt-3">Ma maison</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
