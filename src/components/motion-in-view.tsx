"use client";
import { LazyMotion, domAnimation, m } from "motion/react";
export default function Animated({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
