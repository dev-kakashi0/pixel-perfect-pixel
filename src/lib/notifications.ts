import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "lecture" | "contribution" | "annonce";

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  lue: boolean;
  created_at: string;
};

const jourISO = (d = new Date()) => d.toISOString().slice(0, 10);
const moisISO = (d = new Date()) => d.toISOString().slice(0, 7);

export function joursRestantsDansLeMois(d = new Date()) {
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return fin.getDate() - d.getDate();
}

/** Crée les rappels du jour (lecture, cotisation) s'ils n'existent pas déjà. */
export async function genererRappels(userId: string) {
  const aujourdhui = jourISO();
  const mois = moisISO();
  const cleLecture = `lecture-${aujourdhui}`;
  const cleContribution = `contribution-${mois}`;

  const [logRes, contribRes, existantesRes] = await Promise.all([
    supabase.from("reading_logs").select("id").eq("student_id", userId).eq("date", aujourdhui).maybeSingle(),
    supabase.from("contributions").select("paye").eq("student_id", userId).eq("mois", mois).maybeSingle(),
    supabase.from("notifications").select("cle").eq("user_id", userId).in("cle", [cleLecture, cleContribution]),
  ]);

  const deja = new Set((existantesRes.data ?? []).map((n: { cle: string | null }) => n.cle));
  const nouvelles: {
    user_id: string;
    type: NotificationType;
    message: string;
    cle: string;
  }[] = [];

  if (!logRes.data && !deja.has(cleLecture)) {
    nouvelles.push({
      user_id: userId,
      type: "lecture",
      message: "Vous n'avez pas encore rempli votre suivi de lecture aujourd'hui.",
      cle: cleLecture,
    });
  }

  if (joursRestantsDansLeMois() <= 3 && !contribRes.data?.paye && !deja.has(cleContribution)) {
    nouvelles.push({
      user_id: userId,
      type: "contribution",
      message: `Votre cotisation de ${mois} n'est pas encore marquée payée. La fin du mois approche.`,
      cle: cleContribution,
    });
  }

  if (nouvelles.length) await supabase.from("notifications").insert(nouvelles);
}

export function useNotifications(userId: string | undefined, genererAuChargement = false) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [] as Notification[];
      if (genererAuChargement) {
        try {
          await genererRappels(userId);
        } catch {
          // les rappels sont optionnels
        }
      }
      const { data } = await supabase
        .from("notifications")
        .select("id, message, type, lue, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Notification[];
    },
  });
}

export function useMarquerLue(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ lue: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}
