export function telechargerCsv(nomFichier: string, entetes: string[], lignes: (string | number)[][]) {
  const echapper = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenu = [entetes, ...lignes].map((l) => l.map(echapper).join(";")).join("\r\n");
  // BOM pour qu'Excel lise correctement les accents
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier.endsWith(".csv") ? nomFichier : `${nomFichier}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function imprimerPdf() {
  if (typeof window !== "undefined") window.print();
}
