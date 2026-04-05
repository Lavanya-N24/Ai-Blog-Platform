"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import API_BASE_URL from "../config";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If already logged in as admin, redirect to admin panel
        if (localStorage.getItem("user_role") === "admin") {
            router.push("/admin");
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Login failed");
            }

            if (data.success) {
                // Save session
                localStorage.setItem("user_id", data.user_id);
                localStorage.setItem("user_role", data.role);
                localStorage.setItem("user_name", data.full_name);

                // Redirect based on role
                if (data.role === "admin") {
                    router.push("/admin");
                } else {
                    router.push("/profile");
                }
            }
        } catch (err) {
            if (err.message === "Failed to fetch") {
                setError("Cannot connect to backend server. Make sure the backend is running.");
            } else {
                setError(err.message || "Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: "rgba(30, 41, 59, 0.3)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(148,163,184,0.1)",
                padding: "2.5rem",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        width: "60px", height: "60px",
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem auto",
                        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
                    }}>
                        <Lock color="white" size={28} />
                    </div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "white", marginBottom: "0.5rem" }}>Welcome to Your Creative Hub</h1>
                    <p style={{ color: "#94a3b8" }}>Securely login as a <span style={{ color: "#3b82f6", fontWeight: "600" }}>User</span> or access the <span style={{ color: "#8b5cf6", fontWeight: "600" }}>Admin</span> dashboard.</p>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#fca5a5",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        marginBottom: "1.5rem",
                        fontSize: "0.9rem",
                        textAlign: "center"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "block", color: "#cbd5e1", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Email Address</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    borderRadius: "0.5rem",
                                    color: "white",
                                    outline: "none"
                                }}
                            />
                            <Mail size={18} color="#64748b" style={{ position: "absolute", left: "12px", top: "12px" }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", color: "#cbd5e1", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    borderRadius: "0.5rem",
                                    color: "white",
                                    outline: "none"
                                }}
                            />
                            <Lock size={18} color="#64748b" style={{ position: "absolute", left: "12px", top: "12px" }} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            border: "none",
                            padding: "0.85rem",
                            borderRadius: "0.5rem",
                            fontWeight: "600",
                            fontSize: "1rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                            marginTop: "0.5rem",
                            transition: "transform 0.1s"
                        }}
                    >
                        {loading ? "Signing In..." : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>
                    Don't have an account? <a href="/register" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "600" }}>Register here</a>
                </div>
            </div>
            <style jsx global>{`
                * {
                    box-sizing: border-box;
                }
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active{
                    -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
                    -webkit-text-fill-color: white !important;
                }
            `}</style>
        </div>
    );
}
