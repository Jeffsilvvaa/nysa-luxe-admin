import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
  delay?: number;
}

export function MetricCard({ label, value, hint, icon: Icon, loading, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden bg-card border border-border rounded-xl p-5 shadow-soft transition-shadow hover:shadow-gold"
    >
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-gold opacity-[0.08] group-hover:opacity-20 transition-opacity" />
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="font-display text-3xl text-foreground">{value}</p>
          )}
          {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-gold grid place-items-center text-primary-foreground shadow-gold/50">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
