import { BellRing, BookOpen, Megaphone, Wallet, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMarquerLue, useNotifications, type NotificationType } from "@/lib/notifications";

const icones: Record<NotificationType, typeof BellRing> = {
  lecture: BookOpen,
  contribution: Wallet,
  annonce: Megaphone,
};

const couleurs: Record<NotificationType, string> = {
  lecture: "bg-brand-green",
  contribution: "bg-brand-orange",
  annonce: "bg-brand-blue",
};

export function NotificationsPanel() {
  const { user } = useAuth();
  const { data } = useNotifications(user?.id, true);
  const marquerLue = useMarquerLue(user?.id);

  const nonLues = (data ?? []).filter((n) => !n.lue);
  if (nonLues.length === 0) return null;

  return (
    <section className="space-y-2" aria-label="Rappels">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <BellRing className="h-4 w-4" />
        Rappels ({nonLues.length})
      </h2>
      {nonLues.map((n) => {
        const Icone = icones[n.type];
        return (
          <div key={n.id} className="surface-card flex items-start gap-3 p-4">
            <span className={`icon-chip h-9 w-9 shrink-0 ${couleurs[n.type]} text-primary-foreground`}>
              <Icone className="h-4 w-4" />
            </span>
            <p className="flex-1 text-sm">{n.message}</p>
            <button
              type="button"
              aria-label="Marquer comme lue"
              onClick={() => marquerLue.mutate(n.id)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </section>
  );
}
