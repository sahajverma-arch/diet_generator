"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

const STEPS = [
  "Uploading your PDF",
  "Extracting the diet text",
  "Analysing with LEANR AI",
  "Rendering your branded report",
] as const;

export function UploadForm() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [clientName, setClientName] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(0);

  // Advance the step indicator while the request is in flight (the server work
  // is opaque, so this is an approximation for good UX).
  React.useEffect(() => {
    if (!submitting) return;
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2600);
    return () => clearInterval(id);
  }, [submitting]);

  function validateAndSet(f: File | undefined) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("That file is larger than 10 MB.");
      return;
    }
    setFile(f);
    if (!clientName) {
      const base = f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
      setClientName(base.slice(0, 60));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Add a diet PDF to continue.");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Enter the client's name.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("clientName", clientName.trim());

      const res = await fetch("/api/reports/generate", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong generating the report.");
      }

      toast.success("Report generated.");
      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-10 text-center shadow-sm">
        <div className="relative">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-yellow">
            <Sparkles className="size-7 text-brand-black" />
          </div>
          <Loader2 className="absolute -inset-2 size-20 animate-spin text-brand-yellow/40" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Generating your report</h3>
          <p className="text-sm text-muted-foreground">
            This usually takes 15–40 seconds. Please keep this tab open.
          </p>
        </div>
        <ol className="w-full max-w-sm space-y-2 text-left">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              {i < step ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : i === step ? (
                <Loader2 className="size-4 animate-spin text-brand-black" />
              ) : (
                <span className="size-4 rounded-full border" />
              )}
              <span className={cn(i <= step ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          validateAndSet(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          dragging ? "border-brand-yellow bg-brand-yellow/5" : "border-input hover:border-brand-yellow/60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => validateAndSet(e.target.files?.[0] ?? undefined)}
        />
        {file ? (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border bg-background p-3 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-yellow/20">
              <FileText className="size-5 text-brand-black" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
              <UploadCloud className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Drop the diet PDF here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Text-based PDF · up to 10 MB
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientName">Client name</Label>
        <Input
          id="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          maxLength={120}
          required
        />
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full">
        <Sparkles className="size-4" />
        Generate report
      </Button>
    </form>
  );
}
