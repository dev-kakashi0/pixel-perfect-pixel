export type LogJour = { date: string; pages_lues: number };

const jour = (d: Date) => d.toISOString().slice(0, 10);

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins 1 page lue. */
export function calculerStreak(logs: LogJour[]): number {
  const jours = new Set(logs.filter((l) => l.pages_lues > 0).map((l) => l.date));
  if (jours.size === 0) return 0;

  const curseur = new Date();
  // si rien aujourd'hui, on démarre la veille (la série n'est pas encore cassée)
  if (!jours.has(jour(curseur))) curseur.setDate(curseur.getDate() - 1);

  let total = 0;
  while (jours.has(jour(curseur))) {
    total += 1;
    curseur.setDate(curseur.getDate() - 1);
  }
  return total;
}

export function libelleStreak(n: number) {
  if (n === 0) return "Commence ta série aujourd'hui";
  if (n === 1) return "1 jour d'affilée";
  return `${n} jours d'affilée`;
}
