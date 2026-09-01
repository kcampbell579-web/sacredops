import Link from "next/link";
import { categoryEmoji, categoryLabel, formatPay } from "@/lib/categories";

type TaskCardProps = {
  id: string;
  title: string;
  category: string;
  payCents: number;
  neighborhood: string | null;
  neededBy: Date | null;
  status?: string;
  posterName?: string;
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  CLAIMED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-brand-50 text-brand-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function TaskCard(props: TaskCardProps) {
  const { id, title, category, payCents, neighborhood, neededBy, status, posterName } = props;
  return (
    <Link href={`/tasks/${id}`} className="card block transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="chip">
          {categoryEmoji(category)} {categoryLabel(category)}
        </span>
        <span className="whitespace-nowrap text-lg font-extrabold text-brand-600">{formatPay(payCents)}</span>
      </div>

      <h3 className="mt-3 line-clamp-2 font-bold text-[#3f2c39]">{title}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b4b5f]">
        {neighborhood && <span>📍 {neighborhood}</span>}
        {neededBy && (
          <span>
            🗓 by{" "}
            {new Date(neededBy).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
        {posterName && <span>· {posterName}</span>}
        {status && status !== "OPEN" && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status] ?? ""}`}>
            {status.toLowerCase()}
          </span>
        )}
      </div>
    </Link>
  );
}
