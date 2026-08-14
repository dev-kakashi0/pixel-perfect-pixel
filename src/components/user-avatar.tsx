import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar", path],
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  });
}

export function UserAvatar({
  path,
  nom,
  className = "h-10 w-10",
}: {
  path: string | null | undefined;
  nom: string;
  className?: string;
}) {
  const { data: url } = useAvatarUrl(path);

  if (!url) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ${className}`}
        aria-hidden="true"
      >
        <User className="h-1/2 w-1/2" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={`Photo de ${nom}`}
      loading="lazy"
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
