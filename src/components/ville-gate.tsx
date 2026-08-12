import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-tda.png";

const villes = [
  { nom: "Lomé", texte: "6 maisons dans la capitale", couleur: "bg-brand-pink" },
  { nom: "Kara", texte: "2 maisons au nord du pays", couleur: "bg-brand-blue" },
] as const;

export function VilleGate() {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const choisir = async (ville: string) => {
    if (!user) return;
    setBusy(ville);
    const { error } = await supabase.from("profiles").update({ ville }).eq("id", user.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Bienvenue à ${ville} !`);
    await refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md text-center">
        <img
          src={logo}
          alt="Logo de l'ONG Le Temps d'Aider"
          width={96}
          height={96}
          className="mx-auto h-24 w-24"
        />
        <h1 className="mt-4 text-2xl font-bold">Choisissez votre ville</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous verrez ensuite uniquement les maisons de votre ville. L'administrateur vous
          attribuera une maison précise.
        </p>

        <div className="mt-6 space-y-3">
          {villes.map((v) => (
            <button
              key={v.nom}
              type="button"
              disabled={busy !== null}
              onClick={() => choisir(v.nom)}
              className="surface-card flex w-full items-center gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className={`icon-chip ${v.couleur} text-primary-foreground`}>
                <MapPin className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-lg font-semibold">{v.nom}</span>
                <span className="block text-sm text-muted-foreground">{v.texte}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Ce choix est définitif : seul un administrateur peut le modifier ensuite.
        </p>
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => supabase.auth.signOut()}
          disabled={busy !== null}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
