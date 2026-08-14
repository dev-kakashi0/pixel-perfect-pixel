import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "responsable" | "etudiant";

export type Profile = {
  id: string;
  email: string | null;
  prenom: string;
  nom: string;
  age: number | null;
  origine: string | null;
  faculte: string | null;
  annee_etude: string | null;
  house_id: string | null;
  annee_integration: number | null;
  telephone: string | null;
  ville: "Lomé" | "Kara" | null;
  photo_url: string | null;
  statut: "en_attente" | "valide" | "refuse";

};

type RoleRow = { role: AppRole; house_id: string | null };

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: RoleRow[];
  loading: boolean;
  isAdmin: boolean;
  isResponsable: boolean;
  managedHouseId: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role, house_id").eq("user_id", userId),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRoles((rolesRes.data as RoleRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setTimeout(() => {
          void loadData(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadData(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadData]);

  const refresh = useCallback(async () => {
    if (session?.user) await loadData(session.user.id);
  }, [session, loadData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  }, []);

  const value = useMemo<AuthState>(() => {
    const responsable = roles.find((r) => r.role === "responsable");
    return {
      session,
      user: session?.user ?? null,
      profile,
      roles,
      loading,
      isAdmin: roles.some((r) => r.role === "admin"),
      isResponsable: Boolean(responsable),
      managedHouseId: responsable?.house_id ?? null,
      refresh,
      signOut,
    };
  }, [session, profile, roles, loading, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrateur",
  responsable: "Responsable de maison",
  etudiant: "Étudiant",
};

export const statutLabels: Record<Profile["statut"], string> = {
  en_attente: "En attente",
  valide: "Validé",
  refuse: "Refusé",
};
