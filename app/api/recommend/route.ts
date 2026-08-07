import { NextResponse } from "next/server";
import { addTrackToPlaylist, invalidatePlaylistCache } from "@/lib/spotify";
import { addReason } from "@/lib/redis";

const MAX_REASON_LENGTH = 280;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const trackId = body?.trackId;
  const trackUri = body?.trackUri;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!trackId || !trackUri || typeof trackId !== "string" || typeof trackUri !== "string") {
    return NextResponse.json({ error: "trackId y trackUri son requeridos" }, { status: 400 });
  }
  if (reason.length === 0) {
    return NextResponse.json({ error: "Contanos por qué la recomendás" }, { status: 400 });
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      { error: `El motivo es demasiado largo (máx. ${MAX_REASON_LENGTH} caracteres)` },
      { status: 400 }
    );
  }

  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  if (!playlistId) {
    return NextResponse.json({ error: "SPOTIFY_PLAYLIST_ID no configurado" }, { status: 500 });
  }

  try {
    await addTrackToPlaylist(playlistId, trackUri);
    await addReason(trackId, reason);
    await invalidatePlaylistCache(playlistId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error && err.message.includes("SPOTIFY_REFRESH_TOKEN")
        ? "La autorización del dueño del sitio todavía no está configurada."
        : "No se pudo agregar la canción al playlist";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
