"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NeuralBackground from "./components/NeuralBackground";
import AnimatedBackground from "./components/AnimatedBackground";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    // We check on pathname change to update UI after login/logout redirects
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("user_role");
    setIsLoggedIn(!!userId);
    setUserRole(role);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear(); // Simply clear everything
    setIsLoggedIn(false);
    router.push("/login");
  };

  // Function to style active nav links
  const linkStyle = (path) => ({
    cursor: "pointer",
    color: pathname === path ? "#22c55e" : "#cbd5f5",
    fontWeight: pathname === path ? 600 : 400,
    transition: "color 0.2s ease",
  });

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          color: "#e5e7eb",
        }}
      >
        <AnimatedBackground />
        <NeuralBackground />
        {/* ================= NAVBAR ================= */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            width: "100%",
            background: "rgba(2,6,23,0.85)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(148,163,184,0.15)",
            zIndex: 100,
          }}
        >
          {/* Navbar content aligned with page */}
          <div
            style={{
              maxWidth: "1000px",
              margin: "0 auto",
              padding: "1rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* LOGO */}
            <div
              onClick={() => router.push("/")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                fontWeight: 700,
                fontSize: "1.05rem",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: "0.6rem",
                  height: "0.6rem",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 0 6px rgba(34,197,94,0.25)",
                }}
              />
              AI BLOG PLATFORM
            </div>

            {/* NAV LINKS */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <span style={linkStyle("/")} onClick={() => router.push("/")}>
                Home
              </span>
              <span
                style={linkStyle("/write")}
                onClick={() => router.push("/write")}
              >
                Write
              </span>

              {/* AUTH LINKS */}
              {isLoggedIn ? (
                <>
                  <span
                    style={linkStyle("/profile")}
                    onClick={() => router.push("/profile")}
                  >
                    Profile
                  </span>
                  {userRole === "admin" && (
                    <span
                      style={linkStyle("/admin")}
                      onClick={() => router.push("/admin")}
                    >
                      Admin
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      padding: "0.4rem 1rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      transition: "all 0.2s"
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={linkStyle("/login")}
                    onClick={() => router.push("/login")}
                  >
                    Login
                  </span>
                  <button
                    onClick={() => router.push("/register")}
                    style={{
                      background: "#22c55e",
                      color: "#022c22",
                      border: "none",
                      padding: "0.4rem 1rem",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ================= PAGE CONTENT ================= */}
        {children}
      </body>
    </html>
  );
}
