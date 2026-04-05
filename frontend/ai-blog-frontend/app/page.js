"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <>


      {/* HERO SECTION */}
      <main
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            padding: "3rem",
            borderRadius: "1.2rem",
            background:
              "linear-gradient(145deg, rgba(15,23,42,0.75), rgba(15,23,42,0.65))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148,163,184,0.25)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
        >
          <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>
            Welcome to AI-Powered Blog Platform
          </h1>

          <p
            style={{
              maxWidth: "700px",
              color: "#cbd5f5",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Draft, improve, summarize, and enrich your blog posts using powerful
            AI tools. Focus on your ideas while AI handles writing quality,
            originality, tone, and visuals.
          </p>

          <h3 style={{ marginBottom: "1rem" }}>
            AI Applications Available
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            {[
              "AI Blog Writer",
              "AI Blog Summarizer",
              "AI Headline Generator",
              "AI Tone Changer",
              "AI Plagiarism Checker",
              "AI Image Caption Generator",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "1rem",
                  borderRadius: "0.8rem",
                  background: "rgba(2,6,23,0.7)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <span
                  style={{
                    width: "0.55rem",
                    height: "0.55rem",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                {item}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => router.push("/write")}
              style={{
                padding: "1rem 2.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#022c22",
                boxShadow: "0 20px 50px rgba(34,197,94,0.6)",
              }}
            >
              Start Writing with AI
            </button>
            <p
              style={{
                marginTop: "0.9rem",
                fontSize: "0.85rem",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              All AI applications are included in the writing workspace.
            </p>

          </div>
        </div>
      </main>
    </>
  );
}
