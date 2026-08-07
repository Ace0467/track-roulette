import { NextResponse } from "next/server";
import { getCachedPlaylistTracks } from "@/lib/spotify";
import { getLikeCount, getRecommendations } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  if (!playlistId) {
    return NextResponse.json({ error: "SPOTIFY_PLAYLIST_ID no configurado" }, { status: 500 });
  }

  try {
    const tracks = await getCachedPlaylistTracks(playlistId);
    if (tracks.length === 0) {
      return NextResponse.json({ error: "El playlist está vacío" }, { status: 404 });
    }
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    const likes = await getLikeCount(track.id);
    const recommendations = await getRecommendations(track.id);
    return NextResponse.json({ track, likes, recommendations });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error && err.message.includes("SPOTIFY_REFRESH_TOKEN")
        ? "El sitio todavía no está autorizado con Spotify (visitá /api/auth/spotify/login como dueño del sitio)."
        : "No se pudo elegir una canción";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
