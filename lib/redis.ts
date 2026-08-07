import { Redis } from "@upstash/redis";

// Vercel Marketplace suele exponer las credenciales de Upstash como
// KV_REST_API_URL/TOKEN o como UPSTASH_REDIS_REST_URL/TOKEN según la integración.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn(
    "[redis] Faltan credenciales de Upstash — los likes y recomendaciones van a fallar hasta que configures la integración."
  );
}

export const redis = new Redis({ url: url ?? "", token: token ?? "" });

const LIKES_KEY = (trackId: string) => `likes:${trackId}`;
const REASONS_KEY = (trackId: string) => `reasons:${trackId}`;

export interface Recommendation {
  reason: string;
  addedAt: number;
}

export async function getLikeCount(trackId: string): Promise<number> {
  const count = await redis.get<number>(LIKES_KEY(trackId));
  return count ?? 0;
}

export async function incrementLikeCount(trackId: string): Promise<number> {
  return redis.incr(LIKES_KEY(trackId));
}

export async function addReason(trackId: string, reason: string): Promise<void> {
  const entry: Recommendation = { reason, addedAt: Date.now() };
  await redis.lpush(REASONS_KEY(trackId), entry);
}

export async function getReasons(trackId: string): Promise<Recommendation[]> {
  return redis.lrange<Recommendation>(REASONS_KEY(trackId), 0, -1);
}
