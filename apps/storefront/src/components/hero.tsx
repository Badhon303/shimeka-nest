'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP entrance timeline for the hero (lazy — only on this section).
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.5 })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.6 }, '-=0.2')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
        .from('.hero-blob', { scale: 0.8, opacity: 0, duration: 0.8 }, '-=0.6');
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-cream to-white">
      <div className="hero-blob pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="hero-blob pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="container-x relative grid gap-8 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="hero-eyebrow badge w-fit bg-brand-100 text-brand-700">
            New Festive Collection
          </span>
          <h1 className="hero-title mt-4 font-serif text-4xl font-bold leading-tight text-ink md:text-6xl">
            Beauty &amp; Style,
            <br />
            <span className="text-brand-600">Delivered.</span>
          </h1>
          <p className="hero-sub mt-5 max-w-md text-ink/60">
            Discover curated makeup and clothing for the modern woman — from velvet lipsticks to
            handpicked sarees and lehengas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/makeup" className="hero-cta btn-primary">
              Shop Makeup
            </Link>
            <Link href="/category/clothing" className="hero-cta btn-outline">
              Shop Clothing
            </Link>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="hero-blob relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-brand-100 shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://picsum.photos/seed/shimeka-hero/700/900"
              alt="Shimeka collection"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
