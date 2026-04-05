"use client";

import { useEffect, useRef } from "react";

export default function GridBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;

        let offset = 0;
        const speed = 0.5;
        const gridSize = 40;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Base Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#020617");   // Sky (Dark Slate)
            gradient.addColorStop(0.5, "#0f172a"); // Horizon
            gradient.addColorStop(1, "#1e1b4b");   // Ground (Deep Indigo)
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Perspective Grid Logic
            ctx.save();
            ctx.beginPath();

            const horizonY = canvas.height * 0.4;
            const fov = 300;

            ctx.strokeStyle = "rgba(99, 102, 241, 0.3)"; // Indigo lines
            ctx.lineWidth = 1;

            // Vertical Lines (Perspective)
            for (let x = -canvas.width; x < canvas.width * 2; x += gridSize) {
                // Calculate perspective
                // Simple 3D projection simulation
                ctx.moveTo(x, canvas.height);

                // Converge to center horizon
                const perspectiveX = (x - canvas.width / 2) * (fov / (canvas.height - horizonY)) + canvas.width / 2;

                ctx.lineTo(perspectiveX, horizonY);
            }

            // Horizontal Lines (Moving)
            // We simulate movement by offsetting the "z" depth
            for (let y = canvas.height; y > horizonY; y -= gridSize / 2) {
                // The closer to horizon, the denser the lines (logarithmic-ish)

                const progress = (y - horizonY) / (canvas.height - horizonY); // 0 at horizon, 1 at bottom
                const movingY = y + (offset % (gridSize / 2));

                // Only draw if within bounds
                if (movingY <= canvas.height && movingY > horizonY) {
                    ctx.moveTo(0, movingY);
                    ctx.lineTo(canvas.width, movingY);
                }
            }

            ctx.stroke();
            ctx.restore();

            // Glow at Horizon
            const glow = ctx.createLinearGradient(0, horizonY - 50, 0, horizonY + 100);
            glow.addColorStop(0, "rgba(99, 102, 241, 0)");
            glow.addColorStop(0.4, "rgba(99, 102, 241, 0.5)"); // Horizon line glow
            glow.addColorStop(1, "rgba(99, 102, 241, 0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, horizonY - 50, canvas.width, 150);

            offset += speed;
            animationFrameId = requestAnimationFrame(drawGrid);
        };

        const handleResize = () => {
            resizeCanvas();
        };

        window.addEventListener("resize", handleResize);
        resizeCanvas();
        drawGrid();

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
                pointerEvents: "none"
            }}
        />
    );
}
