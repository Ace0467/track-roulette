import { NextResponse } from "next/server";

function htmlResponse(bodyHtml: string) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Track Roulette — Autorización Spotify</title></head><body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem;">${bodyHtml}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return htmlResponse(`<p>Spotify devolvió un error: ${escapeHtml(error)}</p>`);
  }
  if (!code) {
    return htmlResponse(`<p>Falta el parámetro "code" en la URL.</p>`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret) {
    return htmlResponse(`<p>Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET en el servidor.</p>`);
  }
  if (!redirectUri) {
    return htmlResponse(`<p>Falta SPOTIFY_REDIRECT_URI en el servidor.</p>`);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return htmlResponse(
      `<p>Error intercambiando el código: ${res.status}</p><pre>${escapeHtml(text)}</pre>`
    );
  }

  const data = await res.json();
  const refreshToken = data.refresh_token as string;

  return htmlResponse(`
    <h1>¡Listo!</h1>
    <p>Copiá este <strong>refresh token</strong> y guardalo como <code>SPOTIFY_REFRESH_TOKEN</code>
       en tu <code>.env.local</code> (y en las variables de entorno de Vercel para producción).
       No lo compartas públicamente — con esto cualquiera podría escribir en tu playlist.</p>
    <textarea readonly style="width:100%;height:6rem;font-family:monospace;font-size:0.85rem;">${escapeHtml(
      refreshToken
    )}</textarea>
    <p>Después de guardarlo, reiniciá el servidor de desarrollo (o hacé un redeploy en Vercel)
       para que "recomendar canción" pueda escribir en el playlist.</p>
  `);
}
