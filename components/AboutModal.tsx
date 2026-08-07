"use client";

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-neutral-900 p-6 text-neutral-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">¿Qué es esto?</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm text-neutral-300">
          <p>
            Track Roulette te tira una canción al azar de una playlist de Spotify. Le das play, la
            escuchás, y si querés, le das "me gusta" o pedís otra.
          </p>
          <p>
            Con "Recomendá una canción vos" podés buscar un tema y agregarlo de verdad a la
            playlist — a partir de ahí, esa canción también puede salir sorteada para otros
            visitantes. Podés contar quién sos y por qué la compartís (el motivo es opcional), y
            eso se muestra junto al tema cuando le toca salir.
          </p>
        </div>
      </div>
    </div>
  );
}
