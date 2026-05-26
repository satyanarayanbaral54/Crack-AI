"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      completeTimerRef.current = setTimeout(onComplete, 800);
    }, 2800);

    return () => {
      clearTimeout(timer);
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#05070b] transition-opacity duration-700 ease-in-out ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <style jsx>{`
        @keyframes backdropReveal {
          from {
            opacity: 0;
            transform: scale(1.08);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes logoReveal {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.72) rotate(-8deg);
            filter: blur(14px) saturate(0.6);
          }
          52% {
            opacity: 1;
            transform: translateY(-8px) scale(1.08) rotate(2deg);
            filter: blur(0) saturate(1.15);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0);
            filter: blur(0) saturate(1);
          }
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes auraPulse {
          0%,
          100% {
            opacity: 0.34;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.72;
            transform: scale(1.06);
          }
        }

        @keyframes ringSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes textRise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressLoad {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .welcome-backdrop {
          animation: backdropReveal 900ms ease-out both;
        }

        .logo-shell {
          animation: logoReveal 1150ms cubic-bezier(0.16, 1, 0.3, 1) both,
            logoFloat 3.8s ease-in-out 1.2s infinite;
        }

        .logo-aura {
          animation: auraPulse 2.6s ease-in-out infinite;
        }

        .logo-ring::before {
          animation: ringSweep 3.2s linear infinite;
        }

        .welcome-copy {
          animation: textRise 800ms ease-out 780ms both;
        }

        .progress-fill {
          animation: progressLoad 2.45s cubic-bezier(0.22, 1, 0.36, 1) 260ms both;
          transform-origin: left center;
        }

        @media (prefers-reduced-motion: reduce) {
          .welcome-backdrop,
          .logo-shell,
          .logo-aura,
          .logo-ring::before,
          .welcome-copy,
          .progress-fill {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>

      <div className="welcome-backdrop pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.2),transparent_34%),radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(56,189,248,0.12),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px] opacity-35" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />
      </div>

      <div
        className={`relative flex w-full max-w-[420px] flex-col items-center px-4 transition-all duration-700 sm:px-6 ${
          fadeOut ? "translate-y-3 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
        }`}
      >
        <div className="relative flex h-60 w-60 items-center justify-center sm:h-80 sm:w-80">
          <div className="logo-aura absolute h-48 w-48 rounded-full bg-teal-300/20 blur-3xl sm:h-64 sm:w-64" />
          <div className="logo-ring absolute h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72">
            <div className="absolute inset-0 rounded-full border border-teal-300/15" />
            <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-teal-200 shadow-[0_0_24px_rgba(45,212,191,0.9)]" />
          </div>
          <div className="logo-shell relative rounded-[24px] bg-white/[0.03] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:rounded-[28px] sm:p-5">
            <Image
              src="/crack-ai-logo.png"
              alt="Crack AI logo"
              width={240}
              height={240}
              priority
              className="h-auto w-40 drop-shadow-[0_0_36px_rgba(45,212,191,0.38)] sm:w-[230px]"
            />
          </div>
        </div>

        <div className="welcome-copy mt-3 w-full text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.42em] text-teal-200/80">
            Crack AI
          </p>
          <div className="mx-auto mt-6 h-1 w-full max-w-56 overflow-hidden rounded-full bg-white/10">
            <div className="progress-fill h-full rounded-full bg-gradient-to-r from-teal-300 via-cyan-200 to-orange-300" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.32em] text-slate-300/65">
            Launching
          </p>
        </div>
      </div>
    </div>
  );
}
