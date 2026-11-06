"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
export function HomeCarousel({ images }: { images: string[] }) {
  const slides = [...new Set(images.filter(Boolean))].slice(0, 8);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [reduced, setReduced] = useState(true),
    [visible, setVisible] = useState(true);
  const touch = useRef<number | null>(null);
  useEffect(
    () =>
      setIndex((current) => Math.min(current, Math.max(0, slides.length - 1))),
    [slides.length],
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    preference();
    media.addEventListener("change", preference);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (
      paused ||
      hovered ||
      focused ||
      reduced ||
      !visible ||
      !ready ||
      slides.length < 2
    )
      return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [paused, hovered, focused, reduced, visible, ready, slides.length]);
  const go = (next: number) => setIndex((next + slides.length) % slides.length);
  if (!slides.length) return null;
  return (
    <section
      className="home-carousel"
      aria-label="Carrusel de portada"
      aria-roledescription="carrusel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setFocused(false);
      }}
      onTouchStart={(event) => {
        touch.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touch.current === null) return;
        const delta = event.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1));
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        }
      }}
    >
      {slides.map((src, i) => (
        <div
          className={`carousel-slide${index === i ? " is-active" : ""}`}
          key={src}
          aria-hidden={index !== i}
          aria-label={`Imagen ${i + 1} de ${slides.length}`}
          role="group"
          aria-roledescription="diapositiva"
          data-image={src}
        >
          {(i === 0 ||
            i === index ||
            (ready && i === (index + 1) % slides.length)) && (
            <Image
              onLoad={() => setReady(true)}
              src={src}
              alt={`Colección Jham-or, ambiente ${i + 1}`}
              fill
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? undefined : "eager"}
            />
          )}
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow previous"
            aria-label="Imagen anterior"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="carousel-arrow next"
            aria-label="Imagen siguiente"
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={24} />
          </button>
          <div className="carousel-controls">
            <div
              className="carousel-dots"
              aria-label="Elegir imagen de portada"
            >
              {slides.map((src, i) => (
                <button
                  type="button"
                  key={src}
                  aria-label={`Mostrar imagen ${i + 1}`}
                  aria-current={index === i ? "true" : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <span>
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label={paused ? "Reanudar carrusel" : "Pausar carrusel"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
