import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileImage, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type GradeReport = {
  id: string;
  student_id: string;
  periode: string | null;
  storage_path: string;
  created_at: string;
};

export function useNotes(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ["notes-universitaires", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_reports")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GradeReport[];
    },
  });
}

async function ouvrir(path: string) {
  const { data, error } = await supabase.storage
    .from("grade-reports")
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    toast.error("Impossible d'ouvrir cette capture");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ListeNotes({
  notes,
  onSupprimer,
}: {
  notes: GradeReport[];
  onSupprimer?: (n: GradeReport) => void;
}) {
  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune capture de notes envoyée.</p>;
  }
  return (
    <ul className="space-y-2">
      {notes.map((n) => (
        <li key={n.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
          <span className="icon-chip h-9 w-9 bg-brand-blue text-primary-foreground">
            <FileImage className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{n.periode || "Période non précisée"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void ouvrir(n.storage_path)}>
            <ExternalLink className="mr-1 h-4 w-4" /> Voir
          </Button>
          {onSupprimer && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer cette capture"
              onClick={() => onSupprimer(n)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MesNotes({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: notes = [], isLoading } = useNotes(userId);
  const [periode, setPeriode] = useState("");
  const [busy, setBusy] = useState(false);

  const envoyer = async (file: File) => {
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const chemin = `${userId}/notes-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("grade-reports")
      .upload(chemin, file, { contentType: file.type });
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { error } = await supabase.from("grade_reports").insert({
      student_id: userId,
      periode: periode.trim() || null,
      storage_path: chemin,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPeriode("");
    toast.success("Capture envoyée");
    qc.invalidateQueries({ queryKey: ["notes-universitaires", userId] });
  };

  const supprimer = async (n: GradeReport) => {
    if (!confirm("Supprimer cette capture ?")) return;
    await supabase.storage.from("grade-reports").remove([n.storage_path]);
    const { error } = await supabase.from("grade_reports").delete().eq("id", n.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Capture supprimée");
    qc.invalidateQueries({ queryKey: ["notes-universitaires", userId] });
  };

  return (
    <section className="surface-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">Mes notes universitaires</h2>
        <p className="text-sm text-muted-foreground">
          Envoie une capture de tes résultats. Seuls le responsable de ta maison et
          l'administrateur peuvent la consulter.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="periode">Période concernée (optionnel)</Label>
          <Input
            id="periode"
            value={periode}
            placeholder="Ex. Semestre 1 - 2025/2026"
            onChange={(e) => setPeriode(e.target.value)}
          />
        </div>
        <label className="inline-flex">
          <Button asChild disabled={busy}>
            <span className="cursor-pointer">
              <Upload className="mr-1 h-4 w-4" />
              {busy ? "Envoi…" : "Envoyer une capture"}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void envoyer(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <ListeNotes notes={notes} onSupprimer={supprimer} />
      )}
    </section>
  );
}

export function NotesEtudiant({ studentId }: { studentId: string }) {
  const { data: notes = [], isLoading } = useNotes(studentId);
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Notes universitaires</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <ListeNotes notes={notes} />
      )}
    </div>
  );
}
