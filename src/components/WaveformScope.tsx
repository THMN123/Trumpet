import React, { useEffect, useRef } from 'react';
import { trumpetAudio } from '../audio/trumpetEngine';

interface WaveformScopeProps {
  isBlowing: boolean;
}

export const WaveformScope: React.FC<WaveformScopeProps> = ({ isBlowing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isBlowingRef = useRef(isBlowing);
  isBlowingRef.current = isBlowing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = new Uint8Array(new ArrayBuffer(512));
    let rafId = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle center baseline
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const hasData = trumpetAudio.getTimeDomainData(buffer);

      ctx.strokeStyle = isBlowingRef.current ? '#F5C45E' : '#475569';
      ctx.lineWidth = isBlowingRef.current ? 2 : 1.25;
      ctx.beginPath();

      if (hasData) {
        const sliceWidth = width / buffer.length;
        let x = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      } else {
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
      }

      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className="w-full h-16 rounded-md bg-[#0B0D11] border border-[#232834]"
      aria-label="Real-time brass acoustic waveform"
    />
  );
};
