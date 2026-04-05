"use client";

import { useEffect, useRef } from "react";

export default function NeuralBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let width, height;

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        // Configuration
        const nodeCount = 50;
        const connectionDistance = 200;
        const nodes = [];
        const pulses = [];

        class Node {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(48, 51, 222, 0.3)"; // Indigo (High visibility)
                ctx.fill();
            }
        }

        class Pulse {
            constructor(startNode, endNode) {
                this.startNode = startNode;
                this.endNode = endNode;
                this.progress = 0;
                this.speed = 0.02 + Math.random() * 0.03;
                this.life = 1;
            }

            update() {
                this.progress += this.speed;
                if (this.progress >= 1) {
                    this.life = 0; // Die
                }
            }

            draw() {
                if (this.life <= 0) return;

                const x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
                const y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(7, 250, 96, 1)"; // Bright Green signal
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(13, 238, 96, 1)";
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        const init = () => {
            nodes.length = 0;
            for (let i = 0; i < nodeCount; i++) {
                nodes.push(new Node());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Clear transparently

            // Update Nodes
            nodes.forEach(node => {
                node.update();
                node.draw();
            });

            // Draw Connections & Spawn Pulses
            ctx.strokeStyle = "rgba(99, 102, 241, 0.3)"; // Indigo lines (More visible)
            ctx.lineWidth = 1;

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();

                        // Randomly spawn pulse (data flow)
                        if (Math.random() < 0.002) {
                            pulses.push(new Pulse(nodes[i], nodes[j]));
                        }
                    }
                }
            }

            // Update & Draw Pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                pulses[i].update();
                pulses[i].draw();
                if (pulses[i].life <= 0) {
                    pulses.splice(i, 1);
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            resizeCanvas();
            init();
        };

        window.addEventListener("resize", handleResize);
        resizeCanvas();
        init();
        animate();

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
