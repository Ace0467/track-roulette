"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotifyTrack } from "@/lib/types";

const MAX_REASON_LENGTH = 280;
const MAX_NAME_LENGTH = 60;

export default function RecommendModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SpotifyTrack | null>(null);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || selected) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.tracks ?? []);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selected.id,
          trackUri: selected.uri,
          name: name.trim(),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setSuccess(true);
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-neutral-900 p-6 text-neutral-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recomendar canción</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>

        {success ? (
          <p className="text-emerald-400">¡Gracias! Ya la agregamos al playlist.</p>
        ) : (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Buscá una canción..."
              className="rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {searching && <p className="text-sm text-neutral-400">Buscando...</p>}

            {!selected && results.length > 0 && (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {results.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => {
                        setSelected(t);
                        setQuery(`${t.name} — ${t.artists.join(", ")}`);
                        setResults([]);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-800"
                    >
                      {t.name} — {t.artists.join(", ")}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Tu nombre (opcional)"
                  className="rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={MAX_REASON_LENGTH}
                  placeholder="¿Por qué la compartís? (opcional)"
                  className="min-h-[100px] rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-right text-xs text-neutral-500">
                  {reason.length}/{MAX_REASON_LENGTH}
                </p>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
                >
                  {submitting ? "Agregando..." : "Agregar al playlist"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
