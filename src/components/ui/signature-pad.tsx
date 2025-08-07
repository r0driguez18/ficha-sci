import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, height = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const dprRef = useRef<number>(1);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      // background transparent; draw existing value if any
      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, rect.width, height);
          ctx.drawImage(img, 0, 0, rect.width, height);
        };
        img.src = value;
      } else {
        ctx.clearRect(0, 0, rect.width, height);
      }
    }
  };

  useEffect(() => {
    resizeCanvas();
    const obs = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // redraw when external value changes
    resizeCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top),
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    setIsDrawing(true);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current!;
    // capture as data URL in PNG
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const container = containerRef.current!;
    ctx.clearRect(0, 0, container.clientWidth, height);
    onChange(null);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div
        className="border rounded-md bg-background"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%" }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button type="button" variant="outline" onClick={clear} size="sm">
          Limpar
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
