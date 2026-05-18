import { Card } from "./Card";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 px-8 py-12 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
      {action}
    </Card>
  );
}
