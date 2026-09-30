import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "muted";
}

export function EmptyState({ icon: Icon, title, description, action, variant = "default" }: EmptyStateProps) {
  const bgColor = variant === "muted" ? "bg-secondary/30" : "bg-sage-light";
  const iconColor = variant === "muted" ? "text-muted-foreground" : "text-primary";

  return (
    <div className={`flex flex-col items-center justify-center rounded-md border border-border ${bgColor} p-8 sm:p-12 text-center`}>
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card sm:h-20 sm:w-20 ${iconColor}`}>
        <Icon size={32} className="sm:size-40" />
      </div>
      <h3 className="mb-2 font-display text-lg font-bold text-foreground sm:text-xl">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="w-full sm:w-auto">
          {action.label}
        </Button>
      )}
    </div>
  );
}