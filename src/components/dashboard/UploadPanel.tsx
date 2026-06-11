import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
import { parseProductCsv, ParseResult } from "@/lib/csvParser";
import { Product } from "@/lib/mockData";

type Props = {
  onData: (products: Product[] | null) => void;
  uploadedCount: number;
};

export function UploadPanel({ onData, uploadedCount }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setParsing(true);
      setResult(null);
      const res = await parseProductCsv(f);
      setParsing(false);
      setResult(res);
      if (res.errors.length === 0 && res.products.length > 0) {
        onData(res.products);
      }
    },
    [onData]
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

  const hasData = uploadedCount > 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-gold">Data Import</h3>
          <p className="text-[11px] text-muted-foreground">
            Upload a CSV to power your calculations
          </p>
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
          {file ? file.name : "Drop your CSV here or click to browse"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Supports product-level PO, stock &amp; fulfillment data
        </p>
      </div>

      {parsing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--gold-soft)]">
          <span className="shimmer inline-block h-3 w-3 rounded-full" />
          Parsing your file…
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          {result.errors.length > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-xs text-[var(--destructive)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Import issues found</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-xs text-[var(--success)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Loaded <strong>{result.rowCount}</strong> rows successfully.
                Dashboard calculations now use your uploaded data.
              </span>
            </div>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-[11px] text-[var(--gold-soft)]">
              <p className="mb-1 font-medium">Notes</p>
              <ul className="list-inside list-disc space-y-0.5">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {result.detectedColumns && result.detectedColumns.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Detected columns: {result.detectedColumns.join(", ")}
            </p>
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
