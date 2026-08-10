"use client";

import { useEffect, useRef, useState } from "react";

export default function MarqueeText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    function check() {
      if (!containerRef.current || !measureRef.current) return;
      setOverflowing(measureRef.current.scrollWidth > containerRef.current.clientWidth);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden whitespace-nowrap">
      {/* Copia invisible solo para medir si el texto real desborda el contenedor. */}
      <span ref={measureRef} className={`invisible absolute ${className ?? ""}`} aria-hidden>
        {text}
      </span>

      {overflowing ? (
        <div className="flex w-max animate-marquee">
          <span className={`${className ?? ""} pr-12`}>{text}</span>
          <span className={`${className ?? ""} pr-12`} aria-hidden>
            {text}
          </span>
        </div>
      ) : (
        <span className={className}>{text}</span>
      )}
    </div>
  );
}
