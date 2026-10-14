import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — ONG Temps d'Aider" },
      { property: "og:title", content: "Nouveau mot de passe — ONG Temps d'Aider" },
      {
        property: "og:description",
        content: "Choisissez un nouveau mot de passe pour votre compte ONG Temps d'Aider.",
      },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Mot de passe mis à jour.");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col bg-background px-5 py-10">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-bold">Lien expiré</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien de réinitialisation est invalide ou a déjà été utilisé. Demandez-en un
            nouveau depuis la page de connexion.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button>Retour à la connexion</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <div className="surface-card mt-6 p-5">
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  void supabase.auth.signOut();
                  void navigate({ to: "/auth" });
                }}
              >
                Se connecter
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={updatePassword}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                Enregistrer
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
