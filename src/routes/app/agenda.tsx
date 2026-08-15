import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/agenda")({
  component: AgendaPage,
  head: () => ({
    meta: [
      { title: "Calendrier des activités — Le Temps d'Aider" },
      {
        name: "description",
        content:
          "Réunions, séances de lecture et activités collectives des maisons de l'ONG Le Temps d'Aider.",
      },
      { property: "og:title", content: "Calendrier des activités — Le Temps d'Aider" },
      {
        property: "og:description",
        content: "Toutes les activités à venir des foyers étudiants, au même endroit.",
      },
    ],
  }),
});

type Evenement = {
  id: string;
  titre: string;
  description: string | null;
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function AgendaPage() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [lieu, setLieu] = useState("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, titre, description, date_debut, date_fin, lieu")
        .order("date_debut", { ascending: true });
      return (data ?? []) as Evenement[];
    },
  });

  const evenements = data ?? [];
  const maintenant = Date.now();
  const aVenir = evenements.filter((e) => new Date(e.date_fin ?? e.date_debut).getTime() >= maintenant);
  const passes = evenements
    .filter((e) => new Date(e.date_fin ?? e.date_debut).getTime() < maintenant)
    .reverse();

  const creer = async () => {
    if (!titre.trim() || !debut) {
      toast.error("Un titre et une date de début sont nécessaires.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      titre: titre.trim(),
      description: description.trim() || null,
      date_debut: new Date(debut).toISOString(),
      date_fin: fin ? new Date(fin).toISOString() : null,
      lieu: lieu.trim() || null,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Activité ajoutée au calendrier.");
    setTitre("");
    setDescription("");
    setDebut("");
    setFin("");
    setLieu("");
    void qc.invalidateQueries({ queryKey: ["events"] });
  };

  const supprimer = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Activité supprimée.");
    void qc.invalidateQueries({ queryKey: ["events"] });
  };

  const carte = (e: Evenement, passe = false) => (
    <div key={e.id} className={`surface-card p-4 ${passe ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="icon-chip h-9 w-9 shrink-0 bg-brand-blue text-primary-foreground">
          <CalendarDays className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">{e.titre}</p>
          <p className="text-xs text-muted-foreground">{formatDate(e.date_debut)}</p>
          {e.description && <p className="mt-2 text-sm">{e.description}</p>}
          {e.lieu && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {e.lieu}
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
            aria-label={`Supprimer ${e.titre}`}
            onClick={() => void supprimer(e.id)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendrier des activités</h1>
        <p className="text-sm text-muted-foreground">
          Réunions, séances de lecture, sorties et rendez-vous des maisons.
        </p>
      </div>

      {isAdmin && (
        <div className="surface-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Nouvelle activité</h2>
          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="debut">Début</Label>
              <Input
                id="debut"
                type="datetime-local"
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fin">Fin (optionnel)</Label>
              <Input
                id="fin"
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lieu">Lieu</Label>
            <Input id="lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button className="rounded-full" onClick={creer} disabled={saving}>
            {saving ? "Enregistrement…" : "Ajouter au calendrier"}
          </Button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          À venir <Badge variant="secondary">{aVenir.length}</Badge>
        </h2>
        {aVenir.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune activité programmée pour l'instant.</p>
        ) : (
          aVenir.map((e) => carte(e))
        )}
      </section>

      {passes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Activités passées</h2>
          {passes.slice(0, 10).map((e) => carte(e, true))}
        </section>
      )}
    </div>
  );
}
