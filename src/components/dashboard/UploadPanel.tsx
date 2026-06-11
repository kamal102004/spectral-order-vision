import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { parseCsv, ParseResult, ReportType, REPORT_SCHEMAS } from "@/lib/csvParser";
import { Product } from "@/lib/mockData";

type Props = {
  onData: (products: Product[] | null) => void;
  uploadedCount: number;
};

const REPORT_OPTIONS: ReportType[] = ["product", "campaign", "targeting", "inventory"];

export function UploadPanel({ onData, uploadedCount }: Props) {
  const [reportType, setReportType] = useState<ReportType>("product");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const schema = REPORT_SCHEMAS[reportType];

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setParsing(true);
      setResult(null);
      const res = await parseCsv(f, reportType);
      setParsing(false);
      setResult(res);
      if (res.reportType === "product" && res.errors.length === 0 && res.products.length > 0) {
        onData(res.products);
      }
    },
    [onData, reportType]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
        handleFile(f);
      }
    },
    [handleFile]
  );

  const clear = () => {
    setFile(null);
    setResult(null);
    onData(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const switchReport = (r: ReportType) => {
    setReportType(r);
    setPickerOpen(false);
    setResult(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasData = uploadedCount > 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-gold">Data Import</h3>
          <p className="text-[11px] text-muted-foreground">
            Choose a report type, then upload your CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Report type selector */}
          <div className="relative">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="glass-gold flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--gold-soft)]"
            >
              {schema.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-10 z-20 w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 p-1 backdrop-blur-xl">
                {REPORT_OPTIONS.map((r) => {
                  const s = REPORT_SCHEMAS[r];
                  return (
                    <button
                      key={r}
                      onClick={() => switchReport(r)}
                      className={`flex w-full flex-col items-start rounded-md px-2.5 py-2 text-left text-xs transition hover:bg-white/5 ${
                        r === reportType ? "bg-[var(--gold)]/10 text-[var(--gold-soft)]" : ""
                      }`}
                    >
                      <span className="font-medium">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.description}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {hasData && (
            <button
              onClick={clear}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-3 w-3" /> Reset to demo
            </button>
          )}
        </div>
      </div>

      {/* Required column hint */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {schema.required.map((c) => (
          <span
            key={c}
            className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-white/10 bg-black/20 hover:border-white/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)]/10">
          <Upload className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <p className="text-sm font-medium text-foreground/90">
          {file ? file.name : `Drop your ${schema.label} CSV here or click to browse`}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{schema.description}</p>
      </div>

      {parsing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold-soft)]">
          <span className="shimmer inline-block h-3 w-3 rounded-full" />
          Parsing your file…
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          {result.missingColumns.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-xs text-[var(--destructive)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Missing required columns</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.missingColumns.map((c) => (
                    <span key={c} className="rounded bg-[var(--destructive)]/20 px-1.5 py-0.5 font-mono text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.errors.length > 0 && result.missingColumns.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-xs text-[var(--destructive)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Import issues</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.missingColumns.length === 0 && (
            <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-xs text-[var(--success)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Loaded <strong>{result.rowCount}</strong> rows for{" "}
                  <strong>{REPORT_SCHEMAS[result.reportType].label}</strong>.
                  {result.reportType === "product"
                    ? " Dashboard now uses your data."
                    : " File validated successfully."}
                </span>
              </div>
              {Object.keys(result.mapping).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-[var(--gold-soft)]">
                    View column mapping ({Object.keys(result.mapping).length})
                  </summary>
                  <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {Object.entries(result.mapping).map(([raw, logical]) => (
                      <div
                        key={raw}
                        className="flex items-center justify-between gap-2 rounded bg-black/20 px-2 py-1 font-mono text-[10px] text-muted-foreground"
                      >
                        <span className="truncate">{raw}</span>
                        <span className="text-[var(--gold-soft)]">→ {logical}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {hasData && !file && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold-soft)]">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Using uploaded data · <strong>{uploadedCount}</strong> rows active
        </div>
      )}
    </div>
  );
}
