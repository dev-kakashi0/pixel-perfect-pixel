import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/bibliotheque")({
  component: BibliothequePage,
  head: () => ({
    meta: [
      { title: "Bibliothèque — Le Temps d'Aider" },
      {
        name: "description",
        content: "Livres de la bibliothèque de l'ONG et attribution des lectures aux étudiants.",
      },
      { property: "og:title", content: "Bibliothèque — Le Temps d'Aider" },
      {
        property: "og:description",
        content: "Catalogue des livres et ordre de lecture attribué à chaque étudiant.",
      },
    ],
  }),
});

type Book = {
  id: string;
  titre: string;
  auteur: string | null;
  couverture_url: string | null;
  pages_total: number;
};

type Assignment = {
  id: string;
  student_id: string;
  book_id: string;
  ordre_lecture: number;
  annee_integration: number | null;
};

type Student = {
  id: string;
  prenom: string;
  nom: string;
  annee_integration: number | null;
};

function BibliothequePage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();

  const [titre, setTitre] = useState("");
  const [auteur, setAuteur] = useState("");
  const [pages, setPages] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [cible, setCible] = useState<string>("");
  const [promo, setPromo] = useState<string>("");
  const [choisis, setChoisis] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["bibliotheque"],
    queryFn: async () => {
      const [booksRes, assignRes, studentsRes] = await Promise.all([
        supabase.from("books").select("*").order("titre"),
        supabase
          .from("book_assignments")
          .select("id, student_id, book_id, ordre_lecture, annee_integration")
          .order("ordre_lecture"),
        supabase.from("profiles").select("id, prenom, nom, annee_integration").order("nom"),
      ]);
      return {
        books: (booksRes.data ?? []) as Book[],
        assignments: (assignRes.data ?? []) as Assignment[],
        students: (studentsRes.data ?? []) as Student[],
      };
    },
  });

  const books = data?.books ?? [];
  const assignments = data?.assignments ?? [];
  const students = data?.students ?? [];
  const promos = useMemo(
    () =>
      Array.from(
        new Set(students.map((s) => s.annee_integration).filter((a): a is number => Boolean(a))),
      ).sort((a, b) => b - a),
    [students],
  );

  const mesLivres = assignments
    .filter((a) => a.student_id === user?.id)
    .map((a) => ({ ...a, book: books.find((b) => b.id === a.book_id) }))
    .filter((a) => a.book);

  const ajouterLivre = async () => {
    if (!titre.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    setSaving(true);
    let couverture: string | null = null;
    if (fichier) {
      const ext = fichier.name.split(".").pop() ?? "jpg";
      const chemin = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(chemin, fichier, { upsert: false });
      if (upErr) {
        setSaving(false);
        toast.error(upErr.message);
        return;
      }
      couverture = chemin;
    }
    const { error } = await supabase.from("books").insert({
      titre: titre.trim(),
      auteur: auteur.trim() || null,
      pages_total: Number(pages) || 0,
      couverture_url: couverture,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitre("");
    setAuteur("");
    setPages("");
    setFichier(null);
    toast.success("Livre ajouté à la bibliothèque.");
    void qc.invalidateQueries({ queryKey: ["bibliotheque"] });
  };

  const supprimerLivre = async (id: string) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Livre supprimé.");
    void qc.invalidateQueries({ queryKey: ["bibliotheque"] });
  };

  const attribuer = async () => {
    const destinataires =
      cible === "promo"
        ? students.filter((s) => String(s.annee_integration ?? "") === promo)
        : students.filter((s) => s.id === cible);

    if (destinataires.length === 0 || choisis.length === 0) {
      toast.error("Choisissez au moins un étudiant et un livre.");
      return;
    }

    setAssigning(true);
    const lignes = destinataires.flatMap((s) => {
      const dejaMax = Math.max(
        0,
        ...assignments.filter((a) => a.student_id === s.id).map((a) => a.ordre_lecture),
      );
      return choisis.map((bookId, i) => ({
        student_id: s.id,
        book_id: bookId,
        ordre_lecture: dejaMax + i + 1,
        annee_integration: s.annee_integration,
      }));
    });

    const { error } = await supabase
      .from("book_assignments")
      .upsert(lignes, { onConflict: "student_id,book_id" });
    setAssigning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setChoisis([]);
    toast.success(`${lignes.length} attribution(s) enregistrée(s).`);
    void qc.invalidateQueries({ queryKey: ["bibliotheque"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <p className="text-sm text-muted-foreground">
          Les livres proposés par l'ONG et l'ordre de lecture de chacun.
        </p>
      </div>

      {isAdmin && (
        <div className="surface-card space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="icon-chip h-9 w-9 bg-brand-pink text-primary-foreground">
              <Plus className="h-4 w-4" />
            </span>
            Ajouter un livre
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="auteur">Auteur</Label>
              <Input id="auteur" value={auteur} onChange={(e) => setAuteur(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pages">Nombre de pages</Label>
              <Input
                id="pages"
                type="number"
                min={0}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="couv">Couverture</Label>
              <Input
                id="couv"
                type="file"
                accept="image/*"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button onClick={ajouterLivre} disabled={saving} className="rounded-full">
            {saving ? "Enregistrement…" : "Ajouter le livre"}
          </Button>
        </div>
      )}

      {isAdmin && books.length > 0 && (
        <div className="surface-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Attribuer des livres</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Destinataire</Label>
              <Select value={cible} onValueChange={setCible}>
                <SelectTrigger>
                  <SelectValue placeholder="Un étudiant ou une promotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Toute une promotion</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.prenom} {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cible === "promo" && (
              <div>
                <Label>Année d'intégration</Label>
                <Select value={promo} onValueChange={setPromo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une promotion" />
                  </SelectTrigger>
                  <SelectContent>
                    {promos.map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        Promotion {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Livres (l'ordre de sélection définit l'ordre de lecture)</Label>
            <div className="flex flex-wrap gap-2">
              {books.map((b) => {
                const index = choisis.indexOf(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setChoisis((c) =>
                        c.includes(b.id) ? c.filter((x) => x !== b.id) : [...c, b.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      index >= 0
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "bg-card text-foreground"
                    }`}
                  >
                    {index >= 0 ? `${index + 1}. ` : ""}
                    {b.titre}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={attribuer} disabled={assigning} className="rounded-full">
            {assigning ? "Attribution…" : "Attribuer"}
          </Button>
        </div>
      )}

      {!isAdmin && (
        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Mes lectures attribuées</h2>
          {mesLivres.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun livre ne vous a encore été attribué.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {mesLivres.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <BookCover path={a.book!.couverture_url} titre={a.book!.titre} />
                  <div>
                    <p className="font-semibold">
                      {a.ordre_lecture}. {a.book!.titre}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.book!.auteur ?? "Auteur inconnu"} · {a.book!.pages_total} pages
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Catalogue</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Chargement…</p>
        ) : books.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            La bibliothèque est encore vide.
            {isAdmin ? "" : " L'administrateur ajoutera bientôt des livres."}
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {books.map((b) => (
              <div key={b.id} className="surface-card flex items-center gap-3 p-4">
                <BookCover path={b.couverture_url} titre={b.titre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.titre}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.auteur ?? "Auteur inconnu"}
                  </p>
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <BookOpen className="h-3 w-3" />
                    {b.pages_total} pages
                  </Badge>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer ${b.titre}`}
                    onClick={() => supprimerLivre(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
