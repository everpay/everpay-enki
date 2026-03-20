import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [])

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
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-8"
          >
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-[hsl(var(--primary))]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-white/90 font-body">Trusted by 1,000+ merchants</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-[56px] lg:text-[64px] font-extrabold text-white leading-[1.08] tracking-tight mb-6 font-heading"
          >
            Accept payments everywhere.{" "}
            <span className="text-[hsl(var(--primary))]">Grow faster.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-white/70 max-w-[580px] mx-auto mb-10 leading-relaxed font-body"
          >
            Everpay gives your business the same payment infrastructure as the biggest brands. One platform for cards, wallets, and local payment methods worldwide.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link to="/demo">
              <Button
                size="lg"
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(172,72%,32%)] text-white rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px] active:scale-[0.97] transition-all"
              >
                Get a free demo
              </Button>
            </Link>
            <a href="https://app.everpayinc.com/sign-up" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px] active:scale-[0.97] transition-all"
              >
                Start accepting payments
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
