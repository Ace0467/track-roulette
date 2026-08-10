"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recommendation, SpotifyTrack } from "@/lib/types";
import RecommendModal from "@/components/RecommendModal";
import AboutModal from "@/components/AboutModal";
import SpotifyPlayer from "@/components/SpotifyPlayer";

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center text-neutral-50">
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-[2.0625rem] font-bold tracking-tight">Track Roulette</h1>
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition-colors duration-300 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            ¿Qué es esto y para qué sirve?
          </button>
        </div>

        <div className="hidden max-w-sm flex-col items-center gap-3 sm:flex">
          <p className="text-neutral-400">
            Para escuchar las canciones completas (no solo 30 segundos), iniciá sesión en Spotify antes de arrancar.
          </p>
          <a
            href="https://accounts.spotify.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-300 underline transition-colors duration-300 hover:text-neutral-100"
          >
            Iniciar sesión en Spotify
          </a>
        </div>

        <p className="max-w-sm text-neutral-400 sm:hidden">
          En el celular, Spotify solo deja escuchar 30 segundos de cada canción desde el navegador — abrí la app de
          Spotify si querés escuchar el tema completo.
        </p>

        <button
          onClick={() => setStarted(true)}
          className="rounded-full bg-[#FF4400] px-6 py-2 font-semibold text-black"
        >
          Empezar
        </button>

        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </main>
    );
  }

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden bg-neutral-950 p-8 text-neutral-50">
      {track?.albumImage && (
        <div
          className="absolute inset-0 -z-10 scale-110 bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url(${track.albumImage})` }}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-black/[66%]" />

      <div className="flex flex-col items-center gap-1.5">
        <h1 className="text-[2.0625rem] font-bold tracking-tight">Track Roulette</h1>
        <button
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition-colors duration-300 hover:bg-neutral-700 hover:text-neutral-100"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          ¿Qué es esto y para qué sirve?
        </button>
      </div>

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

          <SpotifyPlayer
            trackUri={track.uri}
            trackId={track.id}
            trackName={track.name}
            artists={track.artists.join(", ")}
          />

          {recommendations.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg bg-neutral-900 px-6 py-5">
              {recommendations.map((rec, i) => (
                <div key={i}>
                  <h2 className="text-sm font-semibold text-neutral-200">
                    {rec.name?.trim() || "..."} recomendó esta canción
                  </h2>
                  <p className="text-sm text-neutral-400">&quot;{rec.reason?.trim() || "..."}&quot;</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-neutral-900 px-6 py-5 text-sm italic text-neutral-500">
              Esta canción ya venía con la playlist, pero alguien ya te la va a recomendar.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRecommend(true)}
              className="rounded-full bg-[#FF4400] px-5 py-2.5 font-semibold text-black transition-colors duration-300 hover:bg-[#E63D00]"
            >
              ➕ Recomendá una canción
            </button>
            <button
              onClick={fetchRandomTrack}
              className="rounded-full bg-neutral-900 px-5 py-2.5 font-semibold transition-colors duration-300 hover:bg-neutral-800"
            >
              🎲 Otra canción
            </button>
            <button
              onClick={handleLike}
              disabled={liking}
              className="rounded-full bg-neutral-900 px-5 py-2.5 font-semibold transition-colors duration-300 hover:bg-neutral-800 disabled:opacity-50"
            >
              ❤️ Me gusta ({likes})
            </button>
          </div>
        </div>
      )}

      {showRecommend && (
        <RecommendModal onClose={() => setShowRecommend(false)} onSuccess={() => setShowRecommend(false)} />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </main>
  );
}
