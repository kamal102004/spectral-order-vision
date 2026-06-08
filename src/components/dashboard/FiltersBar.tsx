import { Calendar, MapPin, Search, Sparkles } from "lucide-react";
import { CITIES, PLATFORMS, Platform } from "@/lib/mockData";

type Props = {
  platform: Platform | "All";
  setPlatform: (p: Platform | "All") => void;
  city: string;
  setCity: (c: string) => void;
  period: string;
  setPeriod: (p: string) => void;
  query: string;
  setQuery: (q: string) => void;
};

const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

export function FiltersBar({ platform, setPlatform, city, setCity, period, setPeriod, query, setQuery }: Props) {
  return (
    <div className="glass sticky top-4 z-30 flex flex-wrap items-center gap-3 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 rounded-xl bg-black/20 p-1">
        {(["All", ...PLATFORMS] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              platform === p
                ? "bg-[var(--gradient-gold)] text-[var(--primary-foreground)] shadow-[var(--shadow-gold)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={platform === p ? { background: "var(--gradient-gold)" } : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
        <MapPin className="h-3.5 w-3.5 text-[var(--gold)]" />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-transparent text-xs font-medium outline-none"
        >
          <option className="bg-zinc-900" value="All">All Cities</option>
          {CITIES.map((c) => (
            <option className="bg-zinc-900" key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
        <Calendar className="h-3.5 w-3.5 text-[var(--gold)]" />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-transparent text-xs font-medium outline-none"
        >
          {PERIODS.map((p) => (
            <option className="bg-zinc-900" key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SKU or product…"
          className="w-56 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      <button className="glass-gold flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[var(--gold-soft)]">
        <Sparkles className="h-3.5 w-3.5" />
        Ask AI
      </button>
    </div>
  );
}
