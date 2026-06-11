import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Wand2, Save } from "lucide-react";
import { parseFile, ParsedFile } from "@/lib/csvParser";
import {
  FILE_TYPES, FileTypeId, getConfig, loadSavedMapping, missingRequired, saveMapping,
} from "@/lib/fileTypes";

export type UploadResult = {
  parsed: ParsedFile;
  mapping: Record<string, string | null>;
};

type Props = {
  onApply: (res: UploadResult | null) => void;
  activeLabel?: string;
};

const TYPE_LABELS: Record<FileTypeId, string> = {
  inventory: "Inventory / PO Data",
  campaign: "Campaign Performance",
  keyword: "Keyword Performance Report",
  search_term: "Search Term Report",
  product_performance: "Product Performance",
  unknown: "Unknown — please map manually",
};

export function UploadPanel({ onApply, activeLabel }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [typeOverride, setTypeOverride] = useState<FileTypeId | null>(null);
  const [applied, setApplied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeType: FileTypeId = typeOverride ?? parsed?.detectedType ?? "unknown";
  const activeConfig = getConfig(activeType);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setParsed(null);
    setApplied(false);
    setTypeOverride(null);
    const res = await parseFile(f);
    setParsing(false);
    setParsed(res);
    const saved = loadSavedMapping(res.detectedType);
    setMapping(saved && Object.keys(saved).length ? saved : res.mapping);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) handleFile(f);
  }, [handleFile]);

  const clear = () => {
    setFile(null); setParsed(null); setMapping({}); setApplied(false); setTypeOverride(null);
    if (inputRef.current) inputRef.current.value = "";
    onApply(null);
  };

  const changeType = (id: FileTypeId) => {
    setTypeOverride(id);
    const cfg = getConfig(id);
    if (cfg && parsed) {
      const saved = loadSavedMapping(id);
      // remap auto from current headers
      const auto: Record<string, string | null> = {};
      for (const f of cfg.fields) {
        const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
        const found = parsed.headers.find((h) => f.aliases.includes(norm(h)));
        auto[f.key] = found ?? null;
      }
      setMapping(saved ?? auto);
    }
  };

  const apply = () => {
    if (!parsed || !activeConfig) return;
    saveMapping(activeType, mapping);
    onApply({ parsed: { ...parsed, detectedType: activeType, config: activeConfig }, mapping });
    setApplied(true);
  };

  const missing = activeConfig ? missingRequired(activeConfig, mapping) : [];
  const showMapper = activeConfig && (missing.length > 0 || parsed?.detectedType === "unknown");

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-gold">Data Import</h3>
          <p className="text-[11px] text-muted-foreground">
            Auto-detects Inventory, Campaign, Keyword, Search Term & Product Performance files
          </p>
        </div>
        {activeLabel && (
          <button
            onClick={clear}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-white/10 bg-black/20 hover:border-white/20"
        }`}
      >
        <input
          ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)]/10">
          <Upload className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <p className="text-sm font-medium text-foreground/90">
          {file ? file.name : "Drop your CSV here or click to browse"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Inventory · Campaigns · Keywords · Search Terms · Products
        </p>
      </div>

      {parsing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold-soft)]">
          <span className="shimmer inline-block h-3 w-3 rounded-full" /> Parsing your file…
        </div>
      )}

      {parsed && (
        <div className="mt-4 space-y-3">
          {parsed.errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-xs text-[var(--destructive)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {parsed.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            </div>
          )}

          {/* Detection banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3">
            <div className="flex items-center gap-2 text-xs">
              <Wand2 className="h-4 w-4 text-[var(--gold)]" />
              <span className="text-muted-foreground">Detected File Type:</span>
              <strong className="text-[var(--gold-soft)]">{TYPE_LABELS[activeType]}</strong>
              <span className="text-[10px] text-muted-foreground">· {parsed.rows.length.toLocaleString()} rows</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={activeType}
                onChange={(e) => changeType(e.target.value as FileTypeId)}
                className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-foreground/90"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column mapper */}
          {activeConfig && showMapper && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-foreground/90">Map your columns</p>
                {missing.length > 0 && (
                  <span className="text-[10px] text-rose-300">Missing: {missing.join(", ")}</span>
                )}
              </div>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {activeConfig.fields.map((f) => (
                  <label key={f.key} className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
                    <span className="truncate text-[11px] text-foreground/80">
                      {f.label}{f.required && <span className="text-rose-400">*</span>}
                    </span>
                    <select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                      className="max-w-[55%] rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[11px] text-foreground/90"
                    >
                      <option value="">— none —</option>
                      {parsed.headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview first 10 rows */}
          {activeConfig && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-medium text-foreground/90">Preview · first 10 rows</p>
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {activeConfig.fields.slice(0, 8).map((f) => (
                        <th key={f.key} className="border-b border-white/5 px-2 py-1 text-left font-medium">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.preview.map((r, i) => (
                      <tr key={i}>
                        {activeConfig.fields.slice(0, 8).map((f) => {
                          const src = mapping[f.key];
                          const v = src ? r[src] : "";
                          return (
                            <td key={f.key} className="border-b border-white/5 px-2 py-1 text-foreground/80">
                              {v != null ? String(v) : <span className="text-muted-foreground">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              {parsed.warnings.length > 0 ? parsed.warnings[0] : "Mappings are saved per file type for next time."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={apply}
                disabled={!activeConfig || missing.length > 0}
                className="glass-gold flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gold-soft)] disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                {applied ? "Re-apply" : "Apply & analyse"}
              </button>
            </div>
          </div>

          {applied && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Loaded {parsed.rows.length.toLocaleString()} rows as {TYPE_LABELS[activeType]}. Dashboard updated.
            </div>
          )}
        </div>
      )}

      {activeLabel && !file && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold-soft)]">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Active: <strong>{activeLabel}</strong>
        </div>
      )}
    </div>
  );
}
