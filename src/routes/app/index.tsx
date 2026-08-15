import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Home,
  MapPin,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { calculerStreak, libelleStreak } from "@/lib/streak";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleLabels, statutLabels } from "@/lib/auth";
import { anneeAcademiqueCourante } from "@/lib/annee";
import { Badge } from "@/components/ui/badge";
import { NotificationsPanel } from "@/components/notifications-panel";
import { Annonces } from "@/components/annonces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Tableau de bord — Le Temps d'Aider" },
      { name: "description", content: "Vue d'ensemble des maisons, des résidents et de votre profil." },
      { property: "og:title", content: "Tableau de bord — Le Temps d'Aider" },
      { property: "og:description", content: "Vue d'ensemble des maisons et des résidents de l'ONG." },
    ],
  }),
});

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
  hint?: string;
}) {
  return (
    <div className="surface-card p-4">
      <span className={`icon-chip h-10 w-10 ${color} text-primary-foreground`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { profile, roles, isAdmin, isResponsable, managedHouseId } = useAuth();
  const [anneeChoisie, setAnneeChoisie] = useState<string | null>(null);

  const { data: annees } = useQuery({
    queryKey: ["academic_years"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academic_years")
        .select("id, label, active")
        .order("label", { ascending: false });
      return (data ?? []) as { id: string; label: string; active: boolean }[];
    },
  });

  const anneeActive = annees?.find((a) => a.active)?.label ?? anneeAcademiqueCourante();
  const anneeCourante = anneeChoisie ?? anneeActive;
  const historique = anneeCourante !== anneeActive;

  const { data } = useQuery({
    queryKey: ["dashboard", isAdmin, managedHouseId],
    queryFn: async () => {
      const moisCourant = new Date().toISOString().slice(0, 7);
      const depuis = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const [profilesRes, housesRes, contribRes, logsRes, assignRes] = await Promise.all([
        supabase.from("profiles").select("id, statut, house_id"),
        supabase.from("houses").select("id, nom, ville"),
        supabase.from("contributions").select("student_id, paye").eq("mois", moisCourant),
        supabase.from("reading_logs").select("student_id, pages_lues, date").gte("date", depuis),
        supabase.from("house_assignments").select("profile_id, house_id, annee_academique"),
      ]);
      return {
        profiles: profilesRes.data ?? [],
        houses: housesRes.data ?? [],
        contributions: contribRes.data ?? [],
        logs: logsRes.data ?? [],
        assignments: assignRes.data ?? [],
      };
    },
  });

  const profiles = data?.profiles ?? [];
  const houses = data?.houses ?? [];
  const assignments = data?.assignments ?? [];
  const enAttente = profiles.filter((p) => p.statut === "en_attente").length;
  const valides = profiles.filter((p) => p.statut === "valide").length;
  const contributions = data?.contributions ?? [];
  const logs = data?.logs ?? [];
  const tauxContribution = profiles.length
    ? Math.round((contributions.filter((c) => c.paye).length / profiles.length) * 100)
    : 0;
  const tauxLecture = profiles.length
    ? Math.round((logs.filter((l) => l.pages_lues > 0).length / (profiles.length * 7)) * 100)
    : 0;
  const valideIds = new Set(profiles.filter((p) => p.statut === "valide").map((p) => p.id));
  const parMaison = houses.map((h) => ({
    ...h,
    actifs: historique
      ? assignments.filter(
          (a) =>
            a.house_id === h.id &&
            a.annee_academique === anneeCourante &&
            valideIds.has(a.profile_id),
        ).length
      : profiles.filter((p) => p.house_id === h.id && p.statut === "valide").length,
  }));
  const maMaison = houses.find((h) => h.id === (managedHouseId ?? profile?.house_id));


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour {profile?.prenom || ""} 👋</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="bg-brand-blue text-primary-foreground">Année {anneeCourante}</Badge>

          {roles.map((r) => (
            <Badge key={r.role} variant="secondary">
              {roleLabels[r.role]}
            </Badge>
          ))}
          {profile && (
            <Badge variant={profile.statut === "valide" ? "default" : "outline"}>
              {statutLabels[profile.statut]}
            </Badge>
          )}
          {profile?.ville && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {profile.ville}
            </Badge>
          )}
        </div>
      </div>

      {isAdmin && (annees?.length ?? 0) > 0 && (
        <div className="surface-card flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium">Année académique consultée</span>
          <Select value={anneeCourante} onValueChange={setAnneeChoisie}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {annees?.map((a) => (
                <SelectItem key={a.id} value={a.label}>
                  {a.label}
                  {a.active ? " (active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {historique && (
            <Badge variant="outline">Consultation en lecture seule</Badge>
          )}
        </div>
      )}

      <NotificationsPanel />



      {profile?.statut === "en_attente" && (
        <div className="surface-card border-l-4 border-l-primary p-4">
          <p className="text-sm font-medium">Compte en attente de validation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            L'administrateur doit valider votre compte et vous assigner à une maison de votre ville.
            Vous pouvez déjà compléter votre profil.
          </p>
          <Link to="/app/profil" className="mt-3 inline-block text-sm font-medium text-primary">
            Compléter mon profil →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(isAdmin || isResponsable) && (
          <>
            <StatCard
              icon={Users}
              label={isAdmin ? "Résidents de l'ONG" : "Résidents de ma maison"}
              value={profiles.length}
              color="bg-brand-pink"
              hint={isAdmin ? "Lomé et Kara" : "Ma maison uniquement"}
            />
            <StatCard
              icon={CheckCircle2}
              label="Comptes validés"
              value={valides}
              color="bg-brand-green"
              hint={isAdmin ? "Sur toute l'ONG" : "Dans ma maison"}
            />
            <StatCard
              icon={Clock}
              label="En attente"
              value={enAttente}
              color="bg-brand-orange"
              hint={isAdmin ? "Sur toute l'ONG" : "Dans ma maison"}
            />
          </>
        )}
        <StatCard
          icon={Home}
          label={isAdmin ? "Maisons de l'ONG" : `Maisons à ${profile?.ville ?? "votre ville"}`}
          value={houses.length}
          color="bg-brand-blue"
        />
      </div>

      {maMaison && (
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ma maison</p>
          <p className="mt-1 text-lg font-semibold">{maMaison.nom}</p>
          <p className="text-sm text-muted-foreground">{maMaison.ville}</p>
        </div>
      )}

      {isAdmin && (
        <>
          {!historique && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Wallet}
                label="Contributions du mois"
                value={`${tauxContribution}%`}
                color="bg-brand-orange"
              />
              <StatCard
                icon={BookOpen}
                label="Lecture (7 derniers jours)"
                value={`${tauxLecture}%`}
                color="bg-brand-green"
              />
            </div>
          )}

          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">
              Étudiants actifs par maison ({anneeCourante})
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {parMaison.map((h) => (
                <li key={h.id} className="flex items-center justify-between border-b pb-2">
                  <span>
                    <span className="font-medium">{h.nom}</span>
                    <span className="block text-xs text-muted-foreground">{h.ville}</span>
                  </span>
                  <span className="font-semibold">{h.actifs}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Annonces />
    </div>

  );
}
