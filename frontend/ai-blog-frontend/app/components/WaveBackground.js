"use client";

import { useEffect, useRef } from "react";

export default function WaveBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let width, height;
        let waveStep = 0;

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        // Configuration for waves
        const waves = [
            { y: 0.6, length: 0.01, amplitude: 80, speed: 0.02, color: "rgba(34, 197, 94, 0.2)" }, // Green
            { y: 0.6, length: 0.015, amplitude: 60, speed: 0.01, color: "rgba(59, 130, 246, 0.2)" }, // Blue
            { y: 0.6, length: 0.005, amplitude: 60, speed: 0.03, color: "rgba(168, 85, 247, 0.2)" }, // Purple
        ];

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Base Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, "#020617"); // Slate 950
            gradient.addColorStop(1, "#111827"); // Gray 900
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw Waves
            waves.forEach((wave, i) => {
                ctx.beginPath();
                ctx.moveTo(0, height * wave.y);

                for (let x = 0; x < width; x++) {
                    // Sine wave formula: y = amplitude * sin(x * length + offset)
                    const dy = Math.sin(x * wave.length + waveStep * wave.speed + i) * wave.amplitude;
                    ctx.lineTo(x, height * wave.y + dy);
                }

                // Fill below the wave
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                ctx.fillStyle = wave.color;

                // Add smooth blur
                ctx.shadowBlur = 30;
                ctx.shadowColor = wave.color;

                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            });

            waveStep += 0.5;
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            resizeCanvas();
        };

        window.addEventListener("resize", handleResize);
        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
                pointerEvents: "none",
            }}
        />
    );
}
