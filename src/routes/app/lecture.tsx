import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, CloudOff, Download, Flame, Printer } from "lucide-react";
import { telechargerCsv, imprimerPdf } from "@/lib/export";
import { calculerStreak, libelleStreak } from "@/lib/streak";
import { ajouterAFile, estHorsLigne, synchroniserFile } from "@/lib/offline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/lecture")({
  component: LecturePage,
  head: () => ({
    meta: [
      { title: "Lecture du jour — Le Temps d'Aider" },
      {
        name: "description",
        content: "Suivi quotidien des pages lues par les étudiants des foyers de l'ONG.",
      },
      { property: "og:title", content: "Lecture du jour — Le Temps d'Aider" },
      {
        property: "og:description",
        content: "Enregistrez vos pages lues chaque jour et suivez la progression des maisons.",
      },
    ],
  }),
});

type Log = {
  id: string;
  student_id: string;
  book_id: string | null;
  date: string;
  pages_lues: number;
  motif_non_lecture: string | null;
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function LecturePage() {
  const { user, isAdmin, isResponsable } = useAuth();
  const qc = useQueryClient();
  const [pages, setPages] = useState("");
  const [motif, setMotif] = useState("");
  const [bookId, setBookId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["lecture"],
    queryFn: async () => {
      const [logsRes, booksRes, assignRes, profilesRes, housesRes] = await Promise.all([
        supabase.from("reading_logs").select("*").order("date", { ascending: false }).limit(1000),
        supabase.from("books").select("id, titre"),
        supabase.from("book_assignments").select("book_id, student_id, ordre_lecture"),
        supabase.from("profiles").select("id, prenom, nom, house_id"),
        supabase.from("houses").select("id, nom, ville"),
      ]);
      return {
        logs: (logsRes.data ?? []) as Log[],
        books: booksRes.data ?? [],
        assignments: assignRes.data ?? [],
        profiles: profilesRes.data ?? [],
        houses: housesRes.data ?? [],
      };
    },
  });

  const logs = data?.logs ?? [];
  const books = data?.books ?? [];
  const profiles = data?.profiles ?? [];
  const houses = data?.houses ?? [];
  const coran = books.find((b) => b.titre.toLowerCase() === "coran");
  const livresAssignes = (data?.assignments ?? [])
    .filter((a) => a.student_id === user?.id)
    .sort((a, b) => a.ordre_lecture - b.ordre_lecture)
    .map((a) => books.find((b) => b.id === a.book_id))
    .filter(Boolean) as { id: string; titre: string }[];
  const mesLivres = [
    ...(coran ? [coran] : []),
    ...livresAssignes.filter((b) => b.id !== coran?.id),
  ];

  const mesLogs = logs.filter((l) => l.student_id === user?.id);
  const dujour = mesLogs.find((l) => l.date === aujourdhui());

  const derniers7 = useMemo(() => {
    const limite = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    return logs.filter((l) => l.date >= limite);
  }, [logs]);

  const streak = useMemo(() => calculerStreak(mesLogs), [mesLogs]);

  useEffect(() => {
    const sync = async () => {
      const n = await synchroniserFile();
      if (n > 0) {
        toast.success(`${n} lecture(s) hors ligne synchronisée(s).`);
        void qc.invalidateQueries({ queryKey: ["lecture"] });
      }
    };
    void sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [qc]);

  const enregistrer = async () => {
    if (!user) return;
    const nb = Number(pages);
    if (Number.isNaN(nb) || nb < 0) {
      toast.error("Indiquez un nombre de pages valide.");
      return;
    }
    if (nb === 0 && !motif.trim()) {
      toast.error("Expliquez pourquoi vous n'avez pas pu lire aujourd'hui.");
      return;
    }
    const entree = {
      student_id: user.id,
      book_id: bookId || null,
      date: aujourdhui(),
      pages_lues: nb,
      motif_non_lecture: nb === 0 ? motif.trim() : null,
    };
    if (estHorsLigne()) {
      ajouterAFile(entree);
      setPages("");
      setMotif("");
      toast.success("Hors ligne : lecture enregistrée, elle sera synchronisée au retour du réseau.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("reading_logs")
      .upsert(entree, { onConflict: "student_id,date" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lecture du jour enregistrée. Bravo !");
    setPages("");
    setMotif("");
    void qc.invalidateQueries({ queryKey: ["lecture"] });
  };

  const statsEtudiants = profiles
    .map((p) => {
      const sien = derniers7.filter((l) => l.student_id === p.id);
      const jours = sien.filter((l) => l.pages_lues > 0).length;
      return {
        ...p,
        jours,
        pages: sien.reduce((s, l) => s + l.pages_lues, 0),
        taux: Math.round((jours / 7) * 100),
      };
    })
    .sort((a, b) => b.pages - a.pages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lecture</h1>
        <p className="text-sm text-muted-foreground">
          Un petit pas chaque jour : notez vos pages lues.
        </p>
      </div>

      <div className="surface-card space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="icon-chip h-9 w-9 bg-brand-green text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          Combien de pages as-tu lues aujourd'hui ?
        </h2>
        {dujour && (
          <p className="text-sm text-muted-foreground">
            Déjà enregistré aujourd'hui : {dujour.pages_lues} page(s)
            {dujour.motif_non_lecture ? ` — « ${dujour.motif_non_lecture} »` : ""}. Vous pouvez
            corriger ci-dessous.
          </p>
        )}
        {mesLivres.length > 0 && (
          <div>
            <Label>Coran ou livre en cours</Label>
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le Coran ou un livre" />
              </SelectTrigger>
              <SelectContent>
                {mesLivres.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.titre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="pages">Pages lues</Label>
          <Input
            id="pages"
            type="number"
            min={0}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="0"
          />
        </div>
        {Number(pages) === 0 && pages !== "" && (
          <div>
            <Label htmlFor="motif">Pourquoi tu n'as pas pu lire aujourd'hui ?</Label>
            <Textarea id="motif" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </div>
        )}
        <Button onClick={enregistrer} disabled={saving} className="rounded-full">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-lg font-semibold">Mon historique</h2>
        {mesLogs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune lecture enregistrée.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {mesLogs.slice(0, 14).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 border-b pb-2">
                <span className="text-muted-foreground">
                  {new Date(l.date).toLocaleDateString("fr-FR")}
                </span>
                <span className="font-medium">
                  {l.pages_lues > 0 ? `${l.pages_lues} pages` : (l.motif_non_lecture ?? "0 page")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(isAdmin || isResponsable) && (
        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">
            {isAdmin
              ? "Suivi de tous les étudiants (7 derniers jours)"
              : "Suivi de ma maison (7 derniers jours)"}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {statsEtudiants.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 border-b pb-2">
                <span>
                  <span className="font-medium">
                    {s.prenom} {s.nom}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {houses.find((h) => h.id === s.house_id)?.nom ?? "Sans maison"}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-semibold">{s.pages} pages</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.jours}/7 jours · {s.taux}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
