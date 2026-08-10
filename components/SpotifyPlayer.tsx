"use client";

import { useEffect, useRef, useState } from "react";
import MarqueeText from "./MarqueeText";

interface PlaybackUpdateData {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}

interface EmbedController {
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  loadUri: (uri: string) => void;
  addListener: (event: string, cb: (e: { data: PlaybackUpdateData }) => void) => void;
  destroy: () => void;
}

interface IFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string },
    callback: (controller: EmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: IFrameAPI) => void;
  }
}

const SCRIPT_ID = "spotify-iframe-api";

// El script de la iFrame API solo llama a onSpotifyIframeApiReady UNA VEZ en toda la
// vida de la página. Como este componente se remonta con cada canción nueva (page.tsx
// lo desmonta mientras "loading" es true), hay que cachear la API a nivel de módulo,
// fuera de React, para que sobreviva a esos remounts.
let cachedIFrameAPI: IFrameAPI | null = null;
const pendingReadyCallbacks: Array<(api: IFrameAPI) => void> = [];

function onIFrameApiReady(api: IFrameAPI) {
  cachedIFrameAPI = api;
  pendingReadyCallbacks.splice(0).forEach((cb) => cb(api));
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SpotifyPlayer({
  trackUri,
  trackId,
  trackName,
  artists,
}: {
  trackUri: string;
  trackId: string;
  trackName: string;
  artists: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // page.tsx desmonta y remonta este componente con cada canción nueva (oculto detrás
  // del gate de "loading"), así que esto siempre corre como un montaje fresco.
  useEffect(() => {
    function initController(api: IFrameAPI) {
      if (!containerRef.current) return;
      const mountPoint = document.createElement("div");
      containerRef.current.appendChild(mountPoint);
      api.createController(mountPoint, { uri: trackUri }, (controller) => {
        controllerRef.current = controller;
        controller.addListener("playback_update", (e) => {
          setIsPaused(e.data.isPaused);
          setPosition(e.data.position);
          setDuration(e.data.duration);
        });
      });
    }

    if (cachedIFrameAPI) {
      initController(cachedIFrameAPI);
    } else {
      pendingReadyCallbacks.push(initController);
      if (!window.onSpotifyIframeApiReady) {
        window.onSpotifyIframeApiReady = onIFrameApiReady;
      }
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const newPosition = Number(e.target.value);
    setPosition(newPosition);
    controllerRef.current?.seek(newPosition / 1000);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        ref={containerRef}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
        aria-hidden
      />

      <div className="flex w-full flex-col items-start text-left">
        <MarqueeText text={trackName} className="font-semibold text-neutral-50" />
        <MarqueeText text={artists} className="text-sm text-neutral-400" />
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center justify-between gap-x-3 gap-y-1">
        <button
          onClick={() => controllerRef.current?.togglePlay()}
          aria-label={isPaused ? "Reproducir" : "Pausar"}
          className="flex shrink-0 items-center justify-center rounded-full text-[#FF4400] outline-none focus-visible:ring-2 focus-visible:ring-[#FF4400] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {isPaused ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M0 2v20l20-10z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>

        <div className="relative mx-auto flex h-4 w-[93%] items-center">
          <div className="absolute left-0 right-0 h-[3px] rounded-full bg-neutral-700" />
          <div
            className="absolute left-0 h-[3px] rounded-full bg-[#FF4400]"
            style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-[#FF4400]"
            style={{ left: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={position}
            onChange={handleSeek}
            aria-label="Progreso de la canción"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <a
          href={`https://open.spotify.com/track/${trackId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir en Spotify"
          className="flex shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-colors duration-300 hover:text-[#1DB954] focus-visible:ring-2 focus-visible:ring-[#FF4400] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24 0-.359-.12-.599-.24-1.68-.998-3.72-1.558-5.939-1.558-1.32 0-2.76.24-3.96.6-.241.12-.361.12-.481.12-.4 0-.72-.32-.72-.719 0-.4.2-.68.62-.8 1.44-.4 2.94-.6 4.56-.6 2.52 0 4.8.64 6.72 1.76.32.16.48.4.48.759 0 .381-.28.638-.681.638zm1.44-3.021c-.301 0-.481-.12-.72-.24-1.921-1.16-4.8-1.939-7.681-1.939-1.44 0-2.939.24-4.26.6-.241.06-.361.12-.601.12-.481 0-.881-.4-.881-.881 0-.48.24-.78.72-.9 1.62-.481 3.3-.719 5.1-.719 3.12 0 6.359.66 8.72 2.14.34.199.6.499.6.958 0 .48-.36.86-.98.86zm1.68-3.541c-.3 0-.5-.08-.72-.2-2.26-1.34-5.6-2.08-8.858-2.08-1.68 0-3.36.28-4.94.72-.2.06-.42.14-.679.14-.581 0-1.021-.46-1.021-1.041 0-.6.3-.98.86-1.14 1.9-.559 3.9-.899 6.32-.899 3.6 0 7.14.899 9.899 2.54.34.199.579.599.579 1.079 0 .6-.44 1.06-1.06 1.06" />
          </svg>
        </a>

        <div />
        <div className="mx-auto flex w-[93%] justify-between text-xs text-neutral-500">
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div />
      </div>
    </div>
  );
}
