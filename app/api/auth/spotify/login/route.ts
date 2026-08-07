import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId) {
    return NextResponse.json({ error: "SPOTIFY_CLIENT_ID no configurado" }, { status: 500 });
  }
  if (!redirectUri) {
    return NextResponse.json({ error: "SPOTIFY_REDIRECT_URI no configurado" }, { status: 500 });
  }

  const scope =
    "playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
