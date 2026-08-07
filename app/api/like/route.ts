import { NextResponse } from "next/server";
import { incrementLikeCount } from "@/lib/redis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const trackId = body?.trackId;

  if (!trackId || typeof trackId !== "string") {
    return NextResponse.json({ error: "trackId requerido" }, { status: 400 });
  }

  try {
    const likes = await incrementLikeCount(trackId);
    return NextResponse.json({ likes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se pudo registrar el like" }, { status: 502 });
  }
}
