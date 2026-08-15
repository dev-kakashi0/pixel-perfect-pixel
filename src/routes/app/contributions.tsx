import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Printer, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { telechargerCsv, imprimerPdf } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/contributions")({
  component: ContributionsPage,
  head: () => ({
    meta: [
      { title: "Contributions — Le Temps d'Aider" },
      {
        name: "description",
        content: "Suivi des contributions mensuelles de 10 000 FCFA des étudiants des foyers.",
      },
      { property: "og:title", content: "Contributions — Le Temps d'Aider" },
      {
        property: "og:description",
        content: "Cochez les paiements du mois maison par maison et suivez l'historique.",
      },
    ],
  }),
});

type Contribution = {
  id: string;
  student_id: string;
  mois: string;
  montant: number;
  paye: boolean;
};

function derniersMois(n = 12) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

const labelMois = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

function ContributionsPage() {
  const { user, isAdmin, isResponsable, managedHouseId } = useAuth();
  const qc = useQueryClient();
  const mois = useMemo(() => derniersMois(), []);
  const [moisChoisi, setMoisChoisi] = useState(mois[0]!);

  const { data } = useQuery({
    queryKey: ["contributions"],
    queryFn: async () => {
      const [contribRes, profilesRes, housesRes] = await Promise.all([
        supabase.from("contributions").select("id, student_id, mois, montant, paye"),
        supabase.from("profiles").select("id, prenom, nom, house_id, statut").order("nom"),
        supabase.from("houses").select("id, nom, ville").order("nom"),
      ]);
      return {
        contributions: (contribRes.data ?? []) as Contribution[],
        profiles: profilesRes.data ?? [],
        houses: housesRes.data ?? [],
      };
    },
  });

  const contributions = data?.contributions ?? [];
  const profiles = data?.profiles ?? [];
  const houses = data?.houses ?? [];

  const gerable = (houseId: string | null) =>
    isAdmin || (isResponsable && houseId !== null && houseId === managedHouseId);

  const ligne = (studentId: string) =>
    contributions.find((c) => c.student_id === studentId && c.mois === moisChoisi);

  const basculer = async (studentId: string, paye: boolean) => {
    const existante = ligne(studentId);
    const payload = {
      student_id: studentId,
      mois: moisChoisi,
      montant: 10000,
      paye,
      coche_par: user?.id ?? null,
      coche_le: new Date().toISOString(),
    };
    const { error } = existante
      ? await supabase.from("contributions").update(payload).eq("id", existante.id)
      : await supabase.from("contributions").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(paye ? "Contribution enregistrée." : "Contribution annulée.");
    void qc.invalidateQueries({ queryKey: ["contributions"] });
  };

  const maLigne = ligne(user?.id ?? "");
  const etudiant = !isAdmin && !isResponsable;

  const maisonsAffichees = isAdmin ? houses : houses.filter((h) => h.id === managedHouseId);

  const totalMois = profiles.length
    ? Math.round(
        (contributions.filter((c) => c.mois === moisChoisi && c.paye).length / profiles.length) *
          100,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contributions</h1>
        <p className="text-sm text-muted-foreground">10 000 FCFA par étudiant et par mois.</p>
      </div>

      <div className="surface-card p-4">
        <Label>Mois</Label>
        <Select value={moisChoisi} onValueChange={setMoisChoisi}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mois.map((m) => (
              <SelectItem key={m} value={m}>
                {labelMois(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(isAdmin || isResponsable) && (
          <p className="mt-3 text-sm text-muted-foreground">
            {isAdmin ? "Taux de contribution — toute l'ONG" : "Taux de contribution — ma maison"} :{" "}
            <span className="font-semibold text-foreground">{totalMois}%</span>
          </p>
        )}
      </div>

      {etudiant && (
        <div className="surface-card p-5">
          <span className="icon-chip h-10 w-10 bg-brand-orange text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm text-muted-foreground">{labelMois(moisChoisi)}</p>
          <p className="text-2xl font-bold">{maLigne?.paye ? "Payé ✅" : "Non payé"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Montant attendu : {(maLigne?.montant ?? 10000).toLocaleString("fr-FR")} FCFA. Seul votre
            responsable de maison peut valider le paiement.
          </p>
        </div>
      )}

      {(isAdmin || isResponsable) &&
        maisonsAffichees.map((h) => {
          const membres = profiles.filter((p) => p.house_id === h.id);
          if (membres.length === 0) return null;
          return (
            <div key={h.id} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{h.nom}</h2>
                <Badge variant="secondary">{h.ville}</Badge>
              </div>
              <ul className="mt-3 space-y-2">
                {membres.map((m) => {
                  const c = ligne(m.id);
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 border-b pb-2 text-sm"
                    >
                      <span className="font-medium">
                        {m.prenom} {m.nom}
                      </span>
                      <label className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {c?.paye ? "Payé" : "Non payé"}
                        </span>
                        <Checkbox
                          checked={Boolean(c?.paye)}
                          disabled={!gerable(m.house_id)}
                          onCheckedChange={(v) => basculer(m.id, v === true)}
                          aria-label={`Contribution payée par ${m.prenom} ${m.nom}`}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
    </div>
  );
}
