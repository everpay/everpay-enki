import { useEffect, useRef } from 'react';

interface MetaballsBackgroundProps {
  count?: number;
  className?: string;
}

export function MetaballsBackground({ count = 5, className = '' }: MetaballsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const balls = containerRef.current.querySelectorAll('.metaball');
    const styles: HTMLStyleElement[] = [];

    balls.forEach((ball, index) => {
      const element = ball as HTMLElement;
      const duration = 15 + Math.random() * 10;
      const delay = index * 2;
      const xRange = 80;
      const yRange = 80;

      element.style.animation = `float-${index} ${duration}s ease-in-out ${delay}s infinite`;

      const keyframes = `
        @keyframes float-${index} {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(${Math.random() * xRange - xRange / 2}%, ${Math.random() * yRange - yRange / 2}%) scale(${0.8 + Math.random() * 0.4}); }
          50% { transform: translate(${Math.random() * xRange - xRange / 2}%, ${Math.random() * yRange - yRange / 2}%) scale(${0.8 + Math.random() * 0.4}); }
          75% { transform: translate(${Math.random() * xRange - xRange / 2}%, ${Math.random() * yRange - yRange / 2}%) scale(${0.8 + Math.random() * 0.4}); }
        }
      `;
      const styleSheet = document.createElement('style');
      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);
      styles.push(styleSheet);
    });

    return () => { styles.forEach(s => s.remove()); };
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ filter: 'brightness(100%) contrast(1200%)' }}>
        <div ref={containerRef} className="absolute inset-0" style={{ filter: 'blur(40px)' }}>
          {Array.from({ length: count }).map((_, i) => {
            const size = 150 + Math.random() * 200;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            return (
              <div key={i} className="metaball absolute rounded-full bg-[#1aa478] opacity-40" style={{ width: `${size}px`, height: `${size}px`, left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
