import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Home, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-tda.png";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Le Temps d'Aider — Foyers étudiants au Togo" },
      {
        name: "description",
        content:
          "L'ONG Le Temps d'Aider accompagne les étudiants de Lomé et Kara : maisons, lecture et contributions mensuelles.",
      },
      { property: "og:title", content: "Le Temps d'Aider — Foyers étudiants au Togo" },
      {
        property: "og:description",
        content: "Gestion des maisons d'étudiants de l'ONG au Togo, depuis votre téléphone.",
      },
    ],
  }),
});

const features = [
  {
    icon: Home,
    titre: "Des maisons",
    texte: "6 à Lomé, 2 à Kara — 6 résidents par maison.",
    couleur: "bg-brand-pink",
  },
  {
    icon: Users,
    titre: "3 rôles",
    texte: "Admin, responsable de maison et étudiant.",
    couleur: "bg-brand-blue",
  },
  {
    icon: BookOpen,
    titre: "Lecture",
    texte: "Bibliothèque et suivi quotidien des pages lues.",
    couleur: "bg-brand-green",
  },
  {
    icon: Wallet,
    titre: "Contributions",
    texte: "10 000 FCFA par mois, suivis par maison.",
    couleur: "bg-brand-orange",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-deep px-5 pb-16 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card p-2">
              <img
                src={logo}
                alt="Logo de l'ONG Le Temps d'Aider"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-90">
              Le Temps d'Aider · Togo
            </p>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Les foyers étudiants, gérés avec le cœur
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-95">
            Une plateforme joyeuse et simple pour accompagner les jeunes des maisons de Lomé et de
            Kara : leurs lectures, leurs contributions et leur quotidien.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/auth">Créer un compte</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
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
              <span className={`icon-chip ${f.couleur} text-primary-foreground`}>
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-semibold">{f.titre}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        Le Temps d'Aider — Lomé &amp; Kara, Togo
      </footer>
    </main>
  );
}
