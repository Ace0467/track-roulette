import { redis } from "./redis";
import type { SpotifyTrack } from "./types";

const ACCOUNTS_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";
const PLAYLIST_CACHE_TTL_SECONDS = 300;

let clientCredentialsCache: { token: string; expiresAt: number } | null = null;

function basicAuthHeader(): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

/** Client Credentials flow — solo lectura (playlist, búsqueda). */
export async function getClientCredentialsToken(): Promise<string> {
  if (clientCredentialsCache && clientCredentialsCache.expiresAt > Date.now()) {
    return clientCredentialsCache.token;
  }

  const res = await fetch(ACCOUNTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`No se pudo obtener el token de Spotify (client credentials): ${res.status}`);
  }
  const data = await res.json();
  clientCredentialsCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return clientCredentialsCache.token;
}

/** Refresh Token flow con la cuenta del dueño del sitio — habilita escritura (playlist-modify). */
export async function getOwnerAccessToken(): Promise<string> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "Falta SPOTIFY_REFRESH_TOKEN — todavía no se autorizó la cuenta del dueño del sitio (visitá /api/auth/spotify/login)."
    );
  }

  const res = await fetch(ACCOUNTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`No se pudo refrescar el token del dueño del sitio: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function simplifyTrack(track: any): SpotifyTrack {
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    artists: (track.artists ?? []).map((a: any) => a.name),
    albumName: track.album?.name ?? "",
    albumImage: track.album?.images?.[0]?.url ?? null,
  };
}

async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const token = await getClientCredentialsToken();
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `${API_URL}/playlists/${playlistId}/tracks?limit=100&fields=` +
    encodeURIComponent("next,items(track(id,uri,name,artists(name),album(name,images)))");

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`No se pudo leer el playlist de Spotify: ${res.status}`);
    }
    const data = await res.json();
    for (const item of data.items) {
      if (item.track?.id) {
        tracks.push(simplifyTrack(item.track));
      }
    }
    url = data.next;
  }

  return tracks;
}

/** Lista de tracks del playlist, cacheada en Redis para no golpear la API de Spotify en cada visita. */
export async function getCachedPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const cacheKey = `playlist-cache:${playlistId}`;
  const cached = await redis.get<SpotifyTrack[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }
  const tracks = await fetchPlaylistTracks(playlistId);
  await redis.set(cacheKey, tracks, { ex: PLAYLIST_CACHE_TTL_SECONDS });
  return tracks;
}

export async function invalidatePlaylistCache(playlistId: string): Promise<void> {
  await redis.del(`playlist-cache:${playlistId}`);
}

export async function searchTracks(query: string, limit = 8): Promise<SpotifyTrack[]> {
  const token = await getClientCredentialsToken();
  const params = new URLSearchParams({ q: query, type: "track", limit: String(limit) });
  const res = await fetch(`${API_URL}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Falló la búsqueda en Spotify: ${res.status}`);
  }
  const data = await res.json();
  return (data.tracks?.items ?? []).map(simplifyTrack);
}

export async function addTrackToPlaylist(playlistId: string, trackUri: string): Promise<void> {
  const token = await getOwnerAccessToken();
  const res = await fetch(`${API_URL}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [trackUri] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo agregar la canción al playlist: ${res.status} ${body}`);
  }
}
