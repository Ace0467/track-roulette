"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recommendation, SpotifyTrack } from "@/lib/types";
import RecommendModal from "@/components/RecommendModal";

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [likes, setLikes] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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
      setRecommendations(data.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started) fetchRandomTrack();
  }, [started, fetchRandomTrack]);

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

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-6 text-center text-neutral-50">
        <h1 className="text-3xl font-bold tracking-tight">Track Roulette</h1>
        <p className="max-w-sm text-neutral-400">
          Para escuchar las canciones completas (no solo 30 segundos), iniciá sesión en Spotify antes de arrancar.
        </p>
        <a
          href="https://accounts.spotify.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-300 underline hover:text-neutral-100"
        >
          Iniciar sesión en Spotify
        </a>
        <button
          onClick={() => setStarted(true)}
          className="rounded-full bg-emerald-500 px-6 py-2 font-semibold text-black"
        >
          Empezar
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-6 text-neutral-50">
      <h1 className="text-3xl font-bold tracking-tight">Track Roulette</h1>

      {loading && <p className="text-neutral-400">Girando la ruleta...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {track && !loading && (
        <div className="flex w-full max-w-sm flex-col gap-4">
          {track.albumImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.albumImage}
              alt={`Tapa de ${track.albumName}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          )}

          <iframe
            title={`${track.name} — ${track.artists.join(", ")}`}
            style={{ borderRadius: 12 }}
            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />

          {recommendations.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg bg-neutral-900 px-4 py-3">
              {recommendations.map((rec, i) => (
                <div key={i}>
                  <h2 className="text-sm font-semibold text-neutral-200">
                    {rec.name?.trim() || "..."} recomendó esta canción
                  </h2>
                  {rec.reason?.trim() && (
                    <p className="text-sm text-neutral-400">{rec.reason}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-neutral-900 px-4 py-3 text-sm italic text-neutral-500">
              Esta canción ya venía con la playlist.
            </p>
          )}

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
              ➕ Recomendá una canción vos
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
