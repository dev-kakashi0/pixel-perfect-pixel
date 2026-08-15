import { supabase } from "@/integrations/supabase/client";

export type LectureEnAttente = {
  student_id: string;
  book_id: string | null;
  date: string;
  pages_lues: number;
  motif_non_lecture: string | null;
};

const CLE = "tda_lectures_en_attente";

export function estHorsLigne() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function lireFile(): LectureEnAttente[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? "[]") as LectureEnAttente[];
  } catch {
    return [];
  }
}

export function ajouterAFile(entree: LectureEnAttente) {
  const file = lireFile().filter(
    (e) => !(e.student_id === entree.student_id && e.date === entree.date),
  );
  file.push(entree);
  localStorage.setItem(CLE, JSON.stringify(file));
}

/** Renvoie le nombre d'entrées synchronisées. */
export async function synchroniserFile(): Promise<number> {
  const file = lireFile();
  if (file.length === 0 || estHorsLigne()) return 0;
  const { error } = await supabase
    .from("reading_logs")
    .upsert(file, { onConflict: "student_id,date" });
  if (error) return 0;
  localStorage.removeItem(CLE);
  return file.length;
}
