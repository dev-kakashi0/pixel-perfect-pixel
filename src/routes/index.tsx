import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Home, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Foyers ONG Togo — Gestion des maisons d'étudiants" },
      {
        name: "description",
        content:
          "Gérez les 8 maisons d'étudiants de l'ONG au Togo : résidents, suivi de lecture et contributions mensuelles.",
      },
      { property: "og:title", content: "Foyers ONG Togo" },
      {
        property: "og:description",
        content: "Gestion des maisons d'étudiants de l'ONG au Togo, depuis votre téléphone.",
      },
    ],
  }),
});

const features = [
  { icon: Home, titre: "8 maisons", texte: "6 à Lomé, 2 à Kara — 6 résidents par maison." },
  { icon: Users, titre: "3 rôles", texte: "Admin, responsable de maison et étudiant." },
  { icon: BookOpen, titre: "Lecture", texte: "Bibliothèque et suivi quotidien des pages lues." },
  { icon: Wallet, titre: "Contributions", texte: "10 000 FCFA par mois, suivis par maison." },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-deep px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">ONG · Togo</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Les foyers étudiants, gérés simplement
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-90">
            Une plateforme unique pour suivre les résidents des maisons de Lomé et de Kara, leurs
            lectures et leurs contributions mensuelles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Créer un compte</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "login" }}>
                Se connecter
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-2xl font-bold">Ce que vous pouvez faire</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.titre} className="surface-card p-5">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{f.titre}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        ONG d'hébergement étudiant — Lomé & Kara, Togo
      </footer>
    </main>
  );
}
