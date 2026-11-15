import React, { useRef, useEffect, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Sun,
  Eye,
  Camera,
  Layers
} from 'lucide-react';
import { sound } from '../../services/sound';

export const Stadium3DView = ({
  stadiumName = "Eden Gardens",
  pitchType = "Turning",
  lastDelivery = null,
  isNightMatch = true
}) => {
  const canvasRef = useRef(null);
  const [cameraAngle, setCameraAngle] = useState(35); // degrees
  const [cameraDistance, setCameraDistance] = useState(1.0);
  const [isRotating, setIsRotating] = useState(false);
  const [ballProgress, setBallProgress] = useState(1.0); // 0 to 1 for delivery animation

  // Animate ball delivery along 3D trajectory
  useEffect(() => {
    if (lastDelivery) {
      setBallProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += 0.05;
        if (p >= 1) {
          setBallProgress(1);
          clearInterval(interval);
        } else {
          setBallProgress(p);
        }
      }, 20);
      return () => clearInterval(interval);
    }
  }, [lastDelivery]);

  // Main 3D Canvas Perspective Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let rotation = cameraAngle;

    const render = () => {
      if (isRotating) {
        rotation = (rotation + 0.3) % 360;
        setCameraAngle(Math.round(rotation));
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const cx = width / 2;
      const cy = height / 2 + 30;

      // 3D Projection Function (isometric + perspective foreshortening)
      const project3D = (x, y, z) => {
        // Rotate around Y axis
        const rx = x * cos - z * sin;
        const rz = x * sin + z * cos;
        // Perspective foreshortening
        const fov = 450 * cameraDistance;
        const scale = fov / (fov + rz + 300);
        return {
          x: cx + rx * scale,
          y: cy - y * scale + (rz * 0.45) * scale,
          scale
        };
      };

      // 1. Stadium Grass Outfield Base (Circular 3D ring)
      ctx.beginPath();
      const outfieldRadius = 260;
      for (let i = 0; i <= 360; i += 10) {
        const theta = (i * Math.PI) / 180;
        const pt = project3D(Math.cos(theta) * outfieldRadius, -5, Math.sin(theta) * outfieldRadius);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      const grassGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, outfieldRadius);
      grassGrad.addColorStop(0, '#10391E');
      grassGrad.addColorStop(1, '#061D0F');
      ctx.fillStyle = grassGrad;
      ctx.fill();
      ctx.strokeStyle = '#1E582E';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. 22-Yard Cricket Pitch (Rectangular 3D Box)
      const pitchW = 42;
      const pitchL = 170;

      const p1 = project3D(-pitchW, 0, -pitchL);
      const p2 = project3D(pitchW, 0, -pitchL);
      const p3 = project3D(pitchW, 0, pitchL);
      const p4 = project3D(-pitchW, 0, pitchL);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      // Pitch texture color based on condition
      let pitchColor = '#A0764E'; // Dry
      if (pitchType === 'Green') pitchColor = '#5C7A4E';
      else if (pitchType === 'Cracked') pitchColor = '#8A6848';
      else if (pitchType === 'Flat') pitchColor = '#B88D60';

      ctx.fillStyle = pitchColor;
      ctx.fill();
      ctx.strokeStyle = '#D4A373';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Crease Lines (Bowling crease, Popping crease, Return crease)
      const drawCrease = (zOffset) => {
        const c1 = project3D(-pitchW * 1.3, 0.5, zOffset);
        const c2 = project3D(pitchW * 1.3, 0.5, zOffset);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      drawCrease(-pitchL + 25);
      drawCrease(pitchL - 25);

      // 4. Wooden Stumps & Bails (Striker & Non-Striker Wickets)
      const drawWickets = (zPos) => {
        const stumpHeight = 28;
        [-6, 0, 6].forEach(xOffset => {
          const base = project3D(xOffset, 0, zPos);
          const top = project3D(xOffset, stumpHeight, zPos);
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.strokeStyle = '#E2B170';
          ctx.lineWidth = 3 * base.scale;
          ctx.stroke();
        });
        // Bails
        const b1 = project3D(-8, stumpHeight, zPos);
        const b2 = project3D(8, stumpHeight, zPos);
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };
      drawWickets(-pitchL + 18);
      drawWickets(pitchL - 18);

      // 5. 3D Ball Trajectory Arc
      if (ballProgress < 1.0) {
        const startZ = pitchL - 10;
        const endZ = -pitchL + 22;
        const curZ = startZ + (endZ - startZ) * ballProgress;

        // Parabolic trajectory bounce
        let ballY = 25;
        if (ballProgress < 0.65) {
          // In-flight before bounce
          ballY = 35 * (1 - ballProgress / 0.65) + 3;
        } else {
          // Off pitch bounce towards batter
          const bounceProg = (ballProgress - 0.65) / 0.35;
          ballY = Math.sin(bounceProg * Math.PI) * 22 + 4;
        }

        const ballPos = project3D(2, ballY, curZ);
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y, 4.5 * ballPos.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444'; // Red cricket ball
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 6. Stadium Floodlight Beams
      if (isNightMatch) {
        const floodlights = [
          { x: -240, z: -200 },
          { x: 240, z: -200 },
          { x: -240, z: 200 },
          { x: 240, z: 200 }
        ];
        floodlights.forEach(fl => {
          const base = project3D(fl.x, 0, fl.z);
          const top = project3D(fl.x, 140, fl.z);
          // Tower Mast
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Light Array
          ctx.beginPath();
          ctx.arc(top.x, top.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#F8FAFC';
          ctx.shadowColor = '#FDE047';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      if (isRotating) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraAngle, cameraDistance, isRotating, ballProgress, pitchType, isNightMatch]);

  return (
    <div className="relative bg-stadium-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* 3D Canvas Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-stadium-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-display font-black text-xs uppercase text-white">
            {stadiumName} • 3D PITCH CAM
          </span>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
            {pitchType} TURF
          </span>
        </div>

        {/* Camera Control Widgets */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              sound.playClick();
              setIsRotating(!isRotating);
            }}
            className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              isRotating
                ? 'bg-gold-500 text-slate-950 border-gold-400 shadow-gold-glow'
                : 'bg-stadium-900/90 text-slate-300 border-white/10 hover:text-white'
            }`}
            title="Auto-rotate 3D camera"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            {isRotating ? 'ORBIT ON' : 'ORBIT'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCameraAngle((cameraAngle + 45) % 360);
            }}
            className="p-2 rounded-xl bg-stadium-900/90 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold"
            title="Rotate camera 45 degrees"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Perspective Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={400}
        className="w-full h-72 sm:h-96 block cursor-grab active:cursor-grabbing"
      />

      {/* Trajectory & Status Footer */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none">
        <span>3D Coordinate Engine: Mulberry32 Deterministic Seed</span>
        <span className="bg-black/60 px-2.5 py-1 rounded-xl border border-white/5">
          Angle: {cameraAngle}° • Pitch: 22 Yards
        </span>
      </div>
    </div>
  );
};

