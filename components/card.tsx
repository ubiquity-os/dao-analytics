import { cn } from "@/app/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={cn(className, "p-6 rounded-xl shadow-lg border")}>{children}</div>;
}
