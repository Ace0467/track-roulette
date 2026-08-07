"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpotifyTrack } from "@/lib/types";
import RecommendModal from "@/components/RecommendModal";

export default function HomePage() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  const fetchRandomTrack = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/random-track", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setTrack(data.track);
      setLikes(data.likes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomTrack();
  }, [fetchRandomTrack]);

  async function handleLike() {
    if (!track || liking) return;
    setLiking(true);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      });
      const data = await res.json();
      if (res.ok) setLikes(data.likes);
    } finally {
      setLiking(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-6 text-neutral-50">
      <h1 className="text-3xl font-bold tracking-tight">Track Roulette</h1>

      {loading && <p className="text-neutral-400">Girando la ruleta...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {track && !loading && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <iframe
            title={`${track.name} — ${track.artists.join(", ")}`}
            style={{ borderRadius: 12 }}
            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLike}
              disabled={liking}
              className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
            >
              ❤️ Me gusta ({likes})
            </button>
            <button
              onClick={fetchRandomTrack}
              className="rounded-full border border-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-800"
            >
              🎲 Otra canción
            </button>
            <button
              onClick={() => setShowRecommend(true)}
              className="rounded-full border border-neutral-700 px-4 py-2 font-semibold hover:bg-neutral-800"
            >
              ➕ Recomendar
            </button>
          </div>
        </div>
      )}

      {showRecommend && (
        <RecommendModal onClose={() => setShowRecommend(false)} onSuccess={() => setShowRecommend(false)} />
      )}
    </main>
  );
}
