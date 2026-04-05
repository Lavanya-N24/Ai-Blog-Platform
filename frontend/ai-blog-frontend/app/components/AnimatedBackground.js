"use client";

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -2,
        overflow: "hidden",
        background: "#020617", // Dark Slate 950 base
      }}
    >
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <style jsx>{`
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: float infinite ease-in-out alternate;
        }
        .blob-1 {
          width: 50vw;
          height: 50vw;
          background: #312e81; /* Indigo 900 - Deep */
          top: -10%;
          left: -10%;
          animation-duration: 25s;
        }
        .blob-2 {
          width: 40vw;
          height: 40vw;
          background: #1e3a8a; /* Blue 900 - Deep */
          bottom: -10%;
          right: -10%;
          animation-duration: 30s;
          animation-direction: alternate-reverse;
        }
        .blob-3 {
          width: 30vw;
          height: 30vw;
          background: #4c1d95; /* Violet 900 - Deep */
          top: 40%;
          left: 30%;
          animation-duration: 22s;
          animation-delay: -5s;
        }

        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1) rotate(10deg);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9) rotate(-5deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}
