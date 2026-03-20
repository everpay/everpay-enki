import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/favicon.png"
      >
        <source src="/video/everpay-intro.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-[800px] mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-8">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-[#1aa478]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-white/90">Trusted by 1,000+ merchants</span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-[62px] lg:text-[72px] font-extrabold text-white leading-[1.08] tracking-tight mb-6"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Accept Payments Everywhere. <span className="text-[#1aa478]">Grow Faster.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/70 max-w-[580px] mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Everpay gives your business the same payment infrastructure as the biggest brands. One platform for cards,
            wallets, and local payment methods worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/demo">
              <Button
                size="lg"
                className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
              >
                Get a free demo
              </Button>
            </Link>
            <a href="/sign-up" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
              >
                Start accepting payments
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
