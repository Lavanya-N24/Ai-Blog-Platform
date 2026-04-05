"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import API_BASE_URL from "../config";
import remarkGfm from "remark-gfm";

const TOOLS = [
  {
    key: "writer",
    label: "AI Blog Writer",
    placeholder: "Start writing your blog here...",
    button: "Generate Blog",
    requiresLanguage: true,
  },
  {
    key: "translator",
    label: "AI Translator",
    placeholder: "Paste text to translate...",
    button: "Translate",
    requiresLanguage: true,
  },
  {
    key: "summarizer",
    label: "AI Blog Summarizer",
    placeholder: "Paste content to summarize...",
    button: "Summarize",
  },
  {
    key: "headline",
    label: "AI Headline Generator",
    placeholder: "Paste content to generate headlines...",
    button: "Generate Headline",
  },
  {
    key: "tone",
    label: "AI Tone Changer",
    placeholder: "Paste text to change tone...",
    button: "Change Tone",
  },
  {
    key: "detector",
    label: "AI Plagiarism Checker",
    placeholder: "Paste content to check for AI patterns (plagiarism)...",
    button: "Check Content",
  },
  {
    key: "grammar",
    label: "Grammar & Spell Checker",
    placeholder: "Paste content to fix grammar and spelling...",
    button: "Fix Grammar",
  },
  {
    key: "image",
    label: "Image Caption Generator",
    placeholder: "Describe the image or paste image-related text...",
    button: "Generate Caption",
  },
];

const LANGUAGES = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati",
  "Kannada", "Malayalam", "Punjabi", "Urdu", "Spanish", "French", "German",
  "Chinese", "Arabic", "Portuguese", "Russian", "Japanese", "Italian", "Dutch"
];

export default function WritePage() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState(TOOLS[0]);
  const [language, setLanguage] = useState("English");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, []);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  // ---------------- PASTING IMAGES ----------------

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf("image") === 0) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            // Switch to image tool or just show notification? 
            // Current UX shows preview in sidebar or main area depending on design.
            // valid image set.
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  // ---------------- IMAGE UPLOAD ----------------
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ---------------- TEXT-BASED AI ----------------
  const runAI = async () => {
    if (!input.trim()) {
      alert("Please enter some text first");
      return;
    }

    setLoading(true);
    setOutput("");

    const API_BASE = `${API_BASE_URL}/api/ai`;

    try {
      let response;
      let result;

      switch (activeTool.key) {
        case "writer":
          const userId = localStorage.getItem("user_id");
          response = await fetch(`${API_BASE}/generate-blog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic: input,
              length: "medium",
              language: language,
              user_id: userId ? parseInt(userId) : null,
            }),
          });
          result = await response.json();
          setOutput(result.content);
          break;

        case "translator":
          response = await fetch(`${API_BASE}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input, target_language: language }),
          });
          result = await response.json();
          setOutput(result.translated_text);
          break;

        case "summarizer":

        case "headline":
          response = await fetch(`${API_BASE}/generate-headline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input, language: language }),
          });
          result = await response.json();
          setOutput(result.headlines.map(h => `### ${h}`).join("\n\n"));
          break;

        case "tone":
          const tone = prompt("Enter desired tone (in lower case e.g. professional, casual, friendly, formal):", "professional");
          if (!tone) {
            setLoading(false);
            return;
          }
          response = await fetch(`${API_BASE}/change-tone`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input, tone: tone, language: language }),
          });
          result = await response.json();
          setOutput(result.content);
          break;

        case "detector": // Renamed from plagiarism
          response = await fetch(`${API_BASE}/plagiarism-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input, language: language }),
          });
          result = await response.json();
          setOutput(
            `Originality Score: ${result.originality_score}%\nIs Original: ${result.is_original ? "Yes" : "No"}\n\n${result.message}`
          );
          break;

        case "grammar":
          response = await fetch(`${API_BASE}/grammar-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input, language: language }),
          });
          result = await response.json();
          setOutput(result.corrected_content);
          break;

        case "image":
          if (!image) {
            alert("Please upload an image first for caption generation.");
            setLoading(false);
            return;
          }

          // Convert image to Base64
          const reader = new FileReader();
          const base64Image = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const res = reader.result;
              // Send only the base64 data, remove prefix if needed (though backend handles it)
              resolve(res.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(image);
          });

          response = await fetch(`${API_BASE}/image-caption`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: base64Image, language: language }),
          });
          result = await response.json();

          if (result.success) {
            setOutput(`📸 **Caption:**\n\n${result.caption}`);
          } else {
            setOutput(`❌ Error: ${result.message}`);
          }
          break;

        default:
          setOutput("Unknown tool selected.");
          setLoading(false);
          return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error calling API:", error);
      let errorMessage = error.message;
      if (error.message === "Failed to fetch") {
        errorMessage = "Cannot connect to backend server. Please ensure the backend is running.";
      }
      setOutput(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- IMAGE → BLOG ----------------
  const generateBlogFromImage = async () => {
    if (!image) {
      alert("Please upload an image first");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      // 1. Convert Image to Base64
      const reader = new FileReader();

      const base64Image = await new Promise((resolve, reject) => {
        reader.onload = () => {
          // Remove "data:image/jpeg;base64," prefix if present because backend re-adds it 
          // actually standard is to keep it or just send raw base64. 
          // Let's send raw base64 string (split from comma)
          const result = reader.result;
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });

      // 2. Analyze Image (Vision API)
      const API_BASE = `${API_BASE_URL}/api/ai`;

      const analyzeResponse = await fetch(`${API_BASE}/analyze-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64Image }),
      });

      const analysisResult = await analyzeResponse.json();

      if (!analyzeResponse.ok || !analysisResult.success) {
        throw new Error(analysisResult.caption || "Failed to analyze image");
      }

      const imageDescription = analysisResult.caption;
      setOutput(`📸 **Image Analysis:**\n\n${imageDescription}\n\n📝 **Generating Blog Post based on this...**`);

      // 3. Generate Blog from Description
      const blogResponse = await fetch(`${API_BASE}/generate-blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Write a blog based on this image description: ${imageDescription}`,
          length: "medium",
          user_id: localStorage.getItem("user_id") ? parseInt(localStorage.getItem("user_id")) : null
        }),
      });

      const blogResult = await blogResponse.json();
      if (!blogResponse.ok) throw new Error("Failed to generate blog");

      setOutput(blogResult.content);

      // Clear image input
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Error calling API:", error);
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE BLOG ----------------
  const handleSaveBlog = async () => {
    if (!output) return;

    const title = prompt("Enter a title for your blog post:");
    if (!title) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/blog/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          content: output,
          title: title,
          content: output,
          author: localStorage.getItem("user_name") || "Anonymous",
          user_id: localStorage.getItem("user_id") ? parseInt(localStorage.getItem("user_id")) : null,
          tags: ["AI Generated", activeTool.key]
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Blog saved successfully! Check the Admin Dashboard.");
      } else {
        alert("Failed to save blog.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving blog.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 72px)",
        color: "#e5e7eb",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "280px",
          borderRight: "1px solid rgba(148,163,184,0.1)",
          background: "rgba(15, 23, 42, 0.3)",
          backdropFilter: "blur(10px)",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          position: "sticky",
          top: 0,
          height: "calc(100vh - 72px)",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#94a3b8",
            marginBottom: "1rem",
            fontWeight: "bold",
          }}
        >
          AI Tools
        </h2>
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            onClick={() => {
              setActiveTool(tool);
              setInput("");
              setOutput("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background:
                activeTool.key === tool.key
                  ? "linear-gradient(90deg, rgba(34,197,94,0.15), transparent)"
                  : "transparent",
              color: activeTool.key === tool.key ? "#4ade80" : "#cbd5e1",
              borderLeft:
                activeTool.key === tool.key
                  ? "3px solid #4ade80"
                  : "3px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.95rem",
              transition: "all 0.2s ease",
              fontWeight: activeTool.key === tool.key ? "600" : "400",
            }}
          >
            {tool.label}
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        style={{
          flex: 1,
          padding: "3rem",
          overflowY: "auto",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "800",
              background: "linear-gradient(to right, #f8fafc, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            {activeTool.label}
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            {activeTool.placeholder}
          </p>
        </header>

        {/* IMAGE UPLOAD */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            border: "2px dashed rgba(148,163,184,0.2)",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            background: "rgba(30, 41, 59, 0.3)",
          }}
        >
          <label
            style={{
              cursor: "pointer",
              background: "#334155",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
              color: "#cbd5f5",
              fontWeight: "500",
            }}
          >
            Choose Image (Optional)
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>

          {imagePreview && (
            <div style={{ position: "relative" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  height: "200px",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <button
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Language Selector (Always Visible) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem" }}>Select Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(15, 23, 42, 0.3)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "white",
              outline: "none",
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} style={{ background: "#1e293b" }}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* INPUT AREA */}
        <textarea
          placeholder="Enter your topic or content specifically here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            padding: "1.25rem",
            borderRadius: "0.75rem",
            background: "rgba(15, 23, 42, 0.3)",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#e2e8f0",
            fontSize: "1rem",
            lineHeight: "1.6",
            resize: "vertical",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            fontFamily: "inherit",
          }}
        />

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
          <button
            onClick={runAI}
            disabled={loading}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "0.75rem",
              border: "none",
              background: loading
                ? "#334155"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 15px -3px rgba(34, 197, 94, 0.2)",
              transition: "transform 0.1s",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span className="animate-spin">⚡</span> Processing...
              </span>
            ) : (
              `✨ ${activeTool.button}`
            )}
          </button>

          <button
            onClick={generateBlogFromImage}
            disabled={loading}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "1.1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 15px -3px rgba(14, 165, 233, 0.2)",
              transition: "transform 0.1s",
            }}
          >
            🖼️ Write Blog from Image
          </button>
        </div>

        {/* RESULT OUTPUT */}
        {output && (
          <div
            style={{
              padding: "2rem",
              borderRadius: "1rem",
              background: "rgba(15, 23, 42, 0.4)",
              border: "1px solid rgba(148,163,184,0.1)",
              backdropFilter: "blur(5px)",
              position: "relative"
            }}
          >
            <button
              onClick={handleSaveBlog}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              💾 Save Blog
            </button>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: "800",
                      marginBottom: "1.5rem",
                      color: "#f1f5f9",
                      lineHeight: "1.2",
                    }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "700",
                      marginTop: "2.5rem",
                      marginBottom: "1rem",
                      color: "#60a5fa",
                      borderBottom: "1px solid rgba(148,163,184,0.2)",
                      paddingBottom: "0.5rem",
                    }}
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginTop: "1.5rem",
                      marginBottom: "0.75rem",
                      color: "#93c5fd",
                    }}
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    style={{
                      marginBottom: "1.25rem",
                      fontSize: "1.1rem",
                      lineHeight: "1.8",
                      color: "#e2e8f0",
                    }}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    style={{
                      marginLeft: "1.5rem",
                      marginBottom: "1.5rem",
                      listStyleType: "disc",
                      color: "#cbd5e1",
                    }}
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
                  <img
                    style={{
                      maxWidth: "100%",
                      borderRadius: "0.75rem",
                      marginTop: "2rem",
                      marginBottom: "2rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                    }}
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: "4px solid #60a5fa",
                      paddingLeft: "1rem",
                      marginLeft: "0",
                      fontStyle: "italic",
                      color: "#94a3b8",
                    }}
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    style={{
                      marginLeft: "1.5rem",
                      marginBottom: "1.5rem",
                      listStyleType: "decimal",
                      color: "#cbd5e1",
                    }}
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: "0.5rem", paddingLeft: "0.5rem" }} {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: "4px solid #60a5fa",
                      paddingLeft: "1rem",
                      fontStyle: "italic",
                      margin: "1.5rem 0",
                      color: "#94a3b8",
                      background: "rgba(30, 41, 59, 0.5)",
                      padding: "1rem",
                      borderRadius: "0 0.5rem 0.5rem 0",
                    }}
                    {...props}
                  />
                ),
                code: ({ node, inline, className, children, ...props }) => (
                  <code
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "0.375rem",
                      fontFamily: "monospace",
                      color: "#f472b6",
                      fontSize: "0.9em",
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                ),
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    style={{
                      maxWidth: "100%",
                      borderRadius: "1rem",
                      margin: "2rem auto",
                      display: "block",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  />
                ),
              }}
            >
              {output}
            </ReactMarkdown>
          </div>
        )
        }
      </main >
    </div >
  );
}
