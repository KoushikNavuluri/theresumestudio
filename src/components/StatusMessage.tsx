import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface StatusMessageProps {
  status: { message: string; type: "idle" | "loading" | "success" | "error" };
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (!status.message) return null;

  const icons = {
    idle: null,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />,
    error: <AlertCircle className="w-4 h-4 text-destructive" />,
  };

  const colors = {
    idle: "text-muted-foreground",
    loading: "text-muted-foreground",
    success: "text-[hsl(var(--success))]",
    error: "text-destructive",
  };

  return (
    <div className={`flex items-center gap-2 mt-4 text-sm ${colors[status.type]}`}>
      {icons[status.type]}
      <span>{status.message}</span>
    </div>
  );
}
