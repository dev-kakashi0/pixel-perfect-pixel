import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/profil")({
  component: ProfilPage,
  head: () => ({
    meta: [
      { title: "Mon profil — Foyers ONG Togo" },
      { name: "description", content: "Complétez votre fiche : études, origine et coordonnées." },
      { property: "og:title", content: "Mon profil — Foyers ONG Togo" },
      { property: "og:description", content: "Fiche résident de l'ONG au Togo." },
    ],
  }),
});

function ProfilPage() {
  const { profile, refresh, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    age: "",
    origine: "",
    faculte: "",
    annee_etude: "",
    annee_integration: "",
    telephone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        prenom: profile.prenom ?? "",
        nom: profile.nom ?? "",
        age: profile.age?.toString() ?? "",
        origine: profile.origine ?? "",
        faculte: profile.faculte ?? "",
        annee_etude: profile.annee_etude ?? "",
        annee_integration: profile.annee_integration?.toString() ?? "",
        telephone: profile.telephone ?? "",
      });
    }
  }, [profile]);

  const { data: house } = useQuery({
    queryKey: ["ma-maison", profile?.house_id],
    enabled: Boolean(profile?.house_id),
    queryFn: async () => {
      const { data } = await supabase
        .from("houses")
        .select("nom, ville")
        .eq("id", profile!.house_id!)
        .maybeSingle();
      return data;
    },
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        prenom: form.prenom,
        nom: form.nom,
        age: form.age ? Number(form.age) : null,
        origine: form.origine || null,
        faculte: form.faculte || null,
        annee_etude: form.annee_etude || null,
        annee_integration: form.annee_integration ? Number(form.annee_integration) : null,
        telephone: form.telephone || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil enregistré");
    await refresh();
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  const uploaderPhoto = async (file: File) => {
    if (!user) return;
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const chemin = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(chemin, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { error } = await supabase.from("profiles").update({ photo_url: chemin }).eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Photo mise à jour");
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar path={profile?.photo_url} nom={profile?.prenom ?? "moi"} className="h-16 w-16" />
        <div>
          <h1 className="text-2xl font-bold">Mon profil</h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary">
            <Camera className="h-4 w-4" />
            Changer ma photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploaderPhoto(f);
              }}
            />
          </label>
        </div>
      </div>



      <div className="surface-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Ville & maison</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile?.ville && <Badge variant="outline">{profile.ville}</Badge>}
          {house ? (
            <Badge>
              {house.nom} · {house.ville}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Aucune maison pour le moment — l'administrateur vous répartira dans une maison de
              votre ville.
            </span>
          )}
        </div>
      </div>


      <form className="surface-card space-y-4 p-5" onSubmit={save}>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("prenom", "Prénom")}
          {field("nom", "Nom")}
          {field("age", "Âge", "number")}
          {field("telephone", "Téléphone")}
          {field("origine", "Ville / pays d'origine")}
          {field("faculte", "Faculté")}
          {field("annee_etude", "Année d'étude")}
          {field("annee_integration", "Année d'intégration à l'ONG", "number")}
        </div>
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
