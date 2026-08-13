import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function useCoverUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["cover", path],
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("book-covers").createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  });
}

export function BookCover({
  path,
  titre,
  className = "h-24 w-16",
}: {
  path: string | null | undefined;
  titre: string;
  className?: string;
}) {
  const { data: url } = useCoverUrl(path);

  if (!url) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ${className}`}
      >
        <BookOpen className="h-5 w-5" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={`Couverture du livre ${titre}`}
      loading="lazy"
      className={`shrink-0 rounded-xl object-cover ${className}`}
    />
  );
}
