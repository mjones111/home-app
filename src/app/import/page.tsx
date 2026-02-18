"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = !loading && (pdfFile !== null || text.trim().length > 0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPdfFile(file);
    if (file) setText("");
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (e.target.value) {
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      let body: string;

      if (pdfFile) {
        const buffer = await pdfFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        body = JSON.stringify({ pdf: base64 });
      } else {
        body = JSON.stringify({ input: text.trim() });
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/recipes/${data.id}`);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Import a Recipe</h1>
      <p className="text-zinc-500 mb-6">
        Upload the PDF from a Substack post, or paste a URL or recipe text.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PDF upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Upload PDF
          </label>
          <div
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-white px-6 py-8 cursor-pointer hover:border-zinc-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              {pdfFile ? (
                <p className="text-sm text-zinc-700 font-medium">{pdfFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-500">Click to choose a PDF</p>
                  <p className="text-xs text-zinc-400 mt-1">or drag and drop</p>
                </>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* Text / URL paste */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Paste a URL or recipe text
          </label>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="https://... or paste the full recipe"
            rows={8}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-400 focus:outline-none resize-none"
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Importing…" : "Import recipe"}
        </button>
      </form>
    </div>
  );
}
