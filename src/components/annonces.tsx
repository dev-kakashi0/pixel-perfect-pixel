import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Annonces() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");

  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, titre, contenu, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Annonce[];
    },
  });

  const publier = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("announcements")
        .insert({ titre: titre.trim(), contenu: contenu.trim(), created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitre("");
      setContenu("");
      setOuvert(false);
      toast.success("Annonce publiée");
      void qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Annonce supprimée");
      void qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const annonces = data ?? [];

  return (
    <section className="surface-card p-5" aria-label="Annonces">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="icon-chip h-9 w-9 bg-brand-blue text-primary-foreground">
            <Megaphone className="h-4 w-4" />
          </span>
          Annonces
        </h2>
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={() => setOuvert((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            {ouvert ? "Annuler" : "Publier"}
          </Button>
        )}
      </div>

      {isAdmin && ouvert && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!titre.trim() || !contenu.trim()) {
              toast.error("Titre et contenu obligatoires");
              return;
            }
            publier.mutate();
          }}
        >
          <Input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre de l'annonce"
            maxLength={120}
          />
          <Textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Message adressé à tous les membres…"
            rows={4}
          />
          <Button type="submit" disabled={publier.isPending}>
            {publier.isPending ? "Publication…" : "Publier l'annonce"}
          </Button>
        </form>
      )}

      {annonces.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {annonces.map((a) => (
            <li key={a.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.titre}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    aria-label={`Supprimer l'annonce ${a.titre}`}
                    onClick={() => supprimer.mutate(a.id)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.contenu}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
