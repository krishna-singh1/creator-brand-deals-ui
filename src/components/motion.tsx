"use client";

import { type CSSProperties, type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls back once when the element scrolls into view. */
function useInView<T extends Element>(onEnter: () => void, rootMargin = "0px 0px -10% 0px") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      onEnter();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter();
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/** Fades/slides children in as they enter the viewport. `delay` staggers siblings. */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "scale" | "fade";
  as?: ElementType;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useInView<HTMLElement>(() => setVisible(true));
  return (
    <Tag
      ref={ref}
      data-variant={variant}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Counts up to `value` once visible (ease-out, ~1.6s); later changes (e.g. a refetch) show at once. */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1600,
  format = (n: number) => Math.round(n).toLocaleString("en-IN"),
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  const target = useRef(value);
  useEffect(() => {
    target.current = value;
    if (started.current) setDisplay(value);
  }, [value]);
  const ref = useInView<HTMLSpanElement>(() => {
    started.current = true;
    // Hidden tabs throttle animation frames; show the number rather than a stalled count.
    if (prefersReducedMotion() || document.hidden) {
      setDisplay(target.current);
      return;
    }
    const start = performance.now();
    const tick = () => {
      // Frame timestamps can predate `start`; clamp so the count never dips below zero ("-0").
      const t = Math.min(1, Math.max(0, (performance.now() - start) / duration));
      setDisplay(target.current * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}

/** Moves children at a fraction of the scroll speed (GPU transform, rAF-throttled). */
export function Parallax({ children, speed = 0.15, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/** Headline whose words rise into place one after another. */
export function AnimatedWords({
  text,
  className = "",
  wordClassName = "",
  startDelay = 0,
  step = 70,
}: {
  text: string;
  className?: string;
  /** Applied to each word; use for effects like background-clip text that must sit on the animated element. */
  wordClassName?: string;
  startDelay?: number;
  step?: number;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className={`word-rise ${wordClassName}`} style={{ "--word-delay": `${startDelay + i * step}ms` } as CSSProperties}>
            {word}
            {"\u00a0"}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Returns true once the page has scrolled past `offset` px (for sticky header styling). */
export function useScrolled(offset = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return scrolled;
}
