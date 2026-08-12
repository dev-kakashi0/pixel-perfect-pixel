import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Connexion — Foyers ONG Togo" },
      {
        name: "description",
        content: "Connectez-vous ou créez votre compte pour accéder à votre maison et votre profil.",
      },
      { property: "og:title", content: "Connexion — Foyers ONG Togo" },
      { property: "og:description", content: "Accès à la plateforme des foyers étudiants de l'ONG." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/app" });
  }, [session, loading, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    void navigate({ to: "/app" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { prenom, nom },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé. Un administrateur doit valider votre accès.");
    void navigate({ to: "/app" });
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      return toast.error("Connexion Google impossible pour le moment.");
    }
    if (result.redirected) return;
    void navigate({ to: "/app" });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="text-sm text-muted-foreground">
          ← Accueil
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Foyers ONG Togo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre espace.
        </p>

        <div className="surface-card mt-6 p-5">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="mt-4 space-y-4" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-4 space-y-4" onSubmit={signUp}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Mot de passe</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Créer mon compte
                </Button>
                <p className="text-xs text-muted-foreground">
                  Votre compte sera validé et assigné à une maison par l'administrateur.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            Continuer avec Google
          </Button>
        </div>
      </div>
    </main>
  );
}
