export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  albumName: string;
  albumImage: string | null;
}

export interface Recommendation {
  name?: string;
  reason?: string;
  addedAt: number;
}
