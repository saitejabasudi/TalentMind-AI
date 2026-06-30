import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Unscored</Badge>;
  }

  let variant: "default" | "destructive" | "secondary" = "default";
  let colorClass = "bg-green-500 hover:bg-green-600 text-white";

  if (score <= 40) {
    variant = "destructive";
    colorClass = "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
  } else if (score <= 70) {
    variant = "secondary";
    colorClass = "bg-amber-500 hover:bg-amber-600 text-white";
  }

  return <Badge variant={variant} className={colorClass}>{score}</Badge>;
}
