import { NextResponse } from "next/server";
import { addTrackToPlaylist, invalidatePlaylistCache } from "@/lib/spotify";
import { addRecommendation } from "@/lib/redis";

const MAX_REASON_LENGTH = 280;
const MAX_NAME_LENGTH = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const trackId = body?.trackId;
  const trackUri = body?.trackUri;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!trackId || !trackUri || typeof trackId !== "string" || typeof trackUri !== "string") {
    return NextResponse.json({ error: "trackId y trackUri son requeridos" }, { status: 400 });
  }
  if (name.length === 0) {
    return NextResponse.json({ error: "Contanos tu nombre" }, { status: 400 });
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      { error: `El motivo es demasiado largo (máx. ${MAX_REASON_LENGTH} caracteres)` },
      { status: 400 }
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `El nombre es demasiado largo (máx. ${MAX_NAME_LENGTH} caracteres)` },
      { status: 400 }
    );
  }

  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  if (!playlistId) {
    return NextResponse.json({ error: "SPOTIFY_PLAYLIST_ID no configurado" }, { status: 500 });
  }

  try {
    // Se agrega siempre como entrada nueva (sin chequear si ya está en el playlist),
    // así cada recomendación de una misma canción queda registrada por separado.
    await addTrackToPlaylist(playlistId, trackUri);
    await addRecommendation(trackId, { name, reason: reason || undefined });
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
