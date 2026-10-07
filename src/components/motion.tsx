"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
const Animated = dynamic(() => import("./motion-in-view"));
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const marker = useRef<HTMLDivElement>(null),
    [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = marker.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={marker} className={className}>
      {seen ? <Animated>{children}</Animated> : children}
    </div>
  );
}
