"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Calendar, Edit2, Save, X, BookOpen, Clock, Linkedin, Github, Twitter, ExternalLink, LayoutDashboard, Settings as SettingsIcon, FileText, Search, PlusCircle, LogOut, Trash2, TrendingUp, Award, Zap, Activity, Star, Target, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import API_BASE_URL from "../config";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myBlogs, setMyBlogs] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [activeTab, setActiveTab] = useState("overview"); // overview, blogs, settings, bookmarks
    const [searchQuery, setSearchQuery] = useState("");
    const [recentActivity, setRecentActivity] = useState([]);
    const [writingStreak, setWritingStreak] = useState(0);
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, title

    // Edit State (for Settings tab)
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        bio: "",
        social_links: { twitter: "", linkedin: "", github: "" }
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Get user ID from localStorage (set during login)
    const getUserID = () => {
        const storedId = localStorage.getItem("user_id");
        if (!storedId) {
            router.push("/login");
            return null;
        }
        return parseInt(storedId);
    };

    const fetchProfile = async () => {
        const USER_ID = getUserID();
        if (!USER_ID) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/${USER_ID}`);
            const data = await res.json();
            if (data) {
                setUser(data);
                setFormData({
                    full_name: data.full_name,
                    email: data.email,
                    bio: data.bio || "",
                    social_links: data.social_links || { twitter: "", linkedin: "", github: "" }
                });
                fetchMyBlogs(data.full_name);
                fetchBookmarks();
                fetchUserHistory(USER_ID); // Fetch history as well
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHistory = async (userId) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/blog/user/${userId}`);
            const data = await res.json();
            if (data.success) {
                setHistory(data.blogs);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const calculateActivityFeed = () => {
        const activities = [];
        // Add blog creation activities
        myBlogs.forEach(blog => {
            activities.push({
                type: "blog_created",
                title: `Created blog: "${blog.title}"`,
                date: blog.created_at,
                icon: FileText,
                color: "#3b82f6"
            });
        });
        // Add bookmark activities
        bookmarks.forEach(bookmark => {
            activities.push({
                type: "bookmarked",
                title: `Bookmarked: "${bookmark.title}"`,
                date: bookmark.created_at || new Date().toISOString(),
                icon: BookOpen,
                color: "#f59e0b"
            });
        });
        // Sort by date (newest first) and take last 5
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivity(activities.slice(0, 5));
    };

    const calculateWritingStreak = () => {
        if (myBlogs.length === 0) {
            setWritingStreak(0);
            return;
        }
        // Simple streak calculation: consecutive days with blog posts
        const blogDates = myBlogs.map(b => new Date(b.created_at).toDateString());
        const uniqueDates = [...new Set(blogDates)].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        const today = new Date().toDateString();
        let checkDate = new Date();

        for (let i = 0; i < uniqueDates.length; i++) {
            const dateStr = checkDate.toDateString();
            if (uniqueDates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        setWritingStreak(streak);
    };

    const fetchMyBlogs = async (authorName) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/blog/`);
            const data = await res.json();
            if (data.success) {
                const userBlogs = data.blogs.filter(b => b.author === authorName);
                setMyBlogs(userBlogs);
            }
        } catch (err) {
            console.error("Failed to fetch blogs", err);
        }
    }

    const fetchBookmarks = async () => {
        const USER_ID = getUserID();
        if (!USER_ID) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookmarks/${USER_ID}`);
            const data = await res.json();
            if (data.success) {
                setBookmarks(data.bookmarks || []); // This returns a list of blog objects
            }
        } catch (err) {
            console.error("Failed to fetch bookmarks", err);
        }
    }

    const toggleBookmark = async (blogId) => {
        const USER_ID = getUserID();
        if (!USER_ID) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: USER_ID, blog_id: blogId })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh bookmarks
                fetchBookmarks();
            }
        } catch (err) {
            console.error("Failed to toggle bookmark", err);
        }
    };

    const isBookmarked = (blogId) => {
        return bookmarks.some(b => b.id === blogId);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (myBlogs.length > 0 || bookmarks.length > 0) {
            calculateActivityFeed();
            calculateWritingStreak();
        }
    }, [myBlogs, bookmarks]);

    const handleSave = async () => {
        const USER_ID = getUserID();
        if (!USER_ID) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/${USER_ID}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                alert("Profile updated successfully!");
                fetchMyBlogs(data.user.full_name);
            }
        } catch (err) {
            alert("Failed to update profile");
            console.error(err);
        }
    };

    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const USER_ID = getUserID();
        if (!USER_ID) return;
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/${USER_ID}/avatar`, {
                method: "POST",
                body: uploadData
            });
            const data = await res.json();
            if (data.success) {
                setUser(prev => ({ ...prev, avatar_url: data.avatar_url }));
                alert("Avatar updated!");
            }
        } catch (err) {
            console.error("Failed to upload avatar", err);
            alert("Failed to upload avatar");
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert("New passwords do not match!");
            return;
        }

        const USER_ID = getUserID();
        if (!USER_ID) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/user/${USER_ID}/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Password updated successfully!");
                setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
            } else {
                alert(data.detail || "Failed to update password");
            }
        } catch (err) {
            console.error("Failed to update password", err);
            alert("An error occurred while updating password");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_name");
        window.location.href = "/login";
    };

    // Filter blogs based on search
    const filteredBlogs = myBlogs
        .filter(blog =>
            blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === "title") return a.title.localeCompare(b.title);
            return 0;
        });

    // Filter bookmarks based on search (reusing searchQuery for now, or could work for both)
    const filteredBookmarks = Array.isArray(bookmarks) ? bookmarks.filter(blog =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];


    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "30px", height: "30px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p>Loading Profile...</p>
            </div>
            <style jsx>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
        </div>
    );

    if (!user) return <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>User not found.</div>;

    return (
        <div style={{ display: "flex", height: "100vh", color: "#e2e8f0", overflow: "hidden" }}>

            {/* SIDEBAR */}
            <aside style={{ width: "260px", background: "rgba(30, 41, 59, 0.3)", backdropFilter: "blur(10px)", borderRight: "1px solid rgba(148,163,184,0.1)", display: "flex", flexDirection: "column", padding: "1.5rem" }}>

                {/* Brand / New Post */}
                <div style={{ marginBottom: "2rem" }}>
                    <button
                        onClick={() => router.push("/write")}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", background: "#3b82f6", color: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.5)", transition: "all 0.2s" }}
                        onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        <PlusCircle size={20} /> New Blog Post
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                    <button
                        onClick={() => setActiveTab("overview")}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === "overview" ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === "overview" ? "#60a5fa" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "colors 0.2s" }}
                    >
                        <LayoutDashboard size={18} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("blogs")}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === "blogs" ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === "blogs" ? "#60a5fa" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "colors 0.2s" }}
                    >
                        <FileText size={18} /> My Blogs
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === "history" ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === "history" ? "#60a5fa" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "colors 0.2s" }}
                    >
                        <Clock size={18} /> History
                    </button>
                    <button
                        onClick={() => setActiveTab("bookmarks")}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === "bookmarks" ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === "bookmarks" ? "#60a5fa" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "colors 0.2s" }}
                    >
                        <BookOpen size={18} /> Bookmarks
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: activeTab === "settings" ? "rgba(59, 130, 246, 0.1)" : "transparent", color: activeTab === "settings" ? "#60a5fa" : "#94a3b8", cursor: "pointer", textAlign: "left", fontSize: "0.95rem", transition: "colors 0.2s" }}
                    >
                        <SettingsIcon size={18} /> Settings
                    </button>
                </nav>

                {/* User Mini Profile (Bottom) */}
                <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid #334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(45deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", overflow: "hidden" }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                user.full_name.charAt(0)
                            )}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <p style={{ color: "white", fontWeight: "500", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.full_name}</p>
                            <p style={{ color: "#94a3b8", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.85rem", justifyContent: "center" }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto" }}>

                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "white" }}>Dashboard Overview</h1>

                        {/* Stats Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                            <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(5px)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", transition: "transform 0.2s" }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                onClick={() => setActiveTab("blogs")}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: "500" }}>Total Blogs</h3>
                                    <BookOpen size={20} color="#3b82f6" />
                                </div>
                                <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "white" }}>{user.blog_count}</p>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>Click to view all</p>
                            </div>
                            <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(5px)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(148,163,184,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: "500" }}>Writing Streak</h3>
                                    <Zap size={20} color="#f59e0b" />
                                </div>
                                <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "white" }}>{writingStreak}</p>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>days in a row</p>
                            </div>
                            <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(5px)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(148,163,184,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: "500" }}>Saved Blogs</h3>
                                    <BookOpen size={20} color="#f59e0b" />
                                </div>
                                <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "white" }}>{bookmarks ? bookmarks.length : 0}</p>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>Click bookmarks tab</p>
                            </div>
                            <div style={{ background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(5px)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(148,163,184,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", fontWeight: "500" }}>Member Since</h3>
                                    <Calendar size={20} color="#8b5cf6" />
                                </div>
                                <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "white" }}>
                                    {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>
                                    {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} days ago
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #334155", marginBottom: "2rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Zap size={18} color="#f59e0b" /> Quick Actions
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                                <button
                                    onClick={() => router.push("/write")}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                                        padding: "1rem", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)",
                                        borderRadius: "0.75rem", color: "#60a5fa", cursor: "pointer", transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                                >
                                    <PlusCircle size={24} />
                                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>New Blog</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("settings")}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                                        padding: "1rem", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.3)",
                                        borderRadius: "0.75rem", color: "#a78bfa", cursor: "pointer", transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                                >
                                    <Edit2 size={24} />
                                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Edit Profile</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("bookmarks")}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                                        padding: "1rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)",
                                        borderRadius: "0.75rem", color: "#fbbf24", cursor: "pointer", transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.2)"; e.currentTarget.style.transform = "scale(1.05)"; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(245, 158, 11, 0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                                >
                                    <BookOpen size={24} />
                                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Bookmarks</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #334155", marginBottom: "2rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Activity size={18} color="#10b981" /> Recent Activity
                            </h3>
                            {recentActivity.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {recentActivity.map((activity, idx) => (
                                        <div key={idx} style={{
                                            display: "flex", alignItems: "center", gap: "1rem",
                                            padding: "0.75rem", background: "rgba(30, 41, 59, 0.5)",
                                            borderRadius: "0.5rem", border: "1px solid #334155"
                                        }}>
                                            <div style={{
                                                width: "36px", height: "36px", borderRadius: "50%",
                                                background: `${activity.color}20`, display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                flexShrink: 0
                                            }}>
                                                <activity.icon size={18} color={activity.color} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: "white", fontSize: "0.9rem", fontWeight: "500" }}>{activity.title}</p>
                                                <p style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                                                    {new Date(activity.date).toLocaleDateString()} â€¢ {new Date(activity.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No recent activity. Start writing to see your activity feed!</p>
                            )}
                        </div>

                        {/* Achievements Section */}
                        <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #334155", marginBottom: "2rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Award size={18} color="#f59e0b" /> Achievements
                            </h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                {user.blog_count >= 1 && (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.75rem 1rem", background: "rgba(34, 197, 94, 0.1)",
                                        border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "0.5rem"
                                    }}>
                                        <Star size={16} color="#22c55e" fill="#22c55e" />
                                        <span style={{ color: "#86efac", fontSize: "0.85rem", fontWeight: "500" }}>First Blog</span>
                                    </div>
                                )}
                                {user.blog_count >= 5 && (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.75rem 1rem", background: "rgba(59, 130, 246, 0.1)",
                                        border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "0.5rem"
                                    }}>
                                        <Target size={16} color="#3b82f6" fill="#3b82f6" />
                                        <span style={{ color: "#93c5fd", fontSize: "0.85rem", fontWeight: "500" }}>5 Blogs Published</span>
                                    </div>
                                )}
                                {writingStreak >= 3 && (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.75rem 1rem", background: "rgba(245, 158, 11, 0.1)",
                                        border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "0.5rem"
                                    }}>
                                        <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                                        <span style={{ color: "#fbbf24", fontSize: "0.85rem", fontWeight: "500" }}>3 Day Streak</span>
                                    </div>
                                )}
                                {bookmarks.length >= 10 && (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.75rem 1rem", background: "rgba(139, 92, 246, 0.1)",
                                        border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "0.5rem"
                                    }}>
                                        <BookOpen size={16} color="#8b5cf6" fill="#8b5cf6" />
                                        <span style={{ color: "#a78bfa", fontSize: "0.85rem", fontWeight: "500" }}>Bookworm</span>
                                    </div>
                                )}
                                {user.blog_count === 0 && bookmarks.length === 0 && (
                                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Start writing or bookmarking blogs to unlock achievements!</p>
                                )}
                            </div>
                        </div>

                        {/* Popular Posts Section */}
                        {myBlogs.length > 0 && (
                            <div style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #334155", marginBottom: "2rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <TrendingUp size={18} color="#10b981" /> Popular Posts
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab("blogs")}
                                        style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.85rem" }}
                                    >
                                        View All â†’
                                    </button>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {myBlogs
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .slice(0, 3)
                                        .map(blog => (
                                            <div
                                                key={blog.id}
                                                style={{
                                                    padding: "1rem", background: "rgba(30, 41, 59, 0.5)",
                                                    borderRadius: "0.5rem", border: "1px solid #334155",
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.transform = "translateX(4px)"; }}
                                                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "translateX(0)"; }}
                                                onClick={() => setActiveTab("blogs")}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ color: "white", fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                                            {blog.title}
                                                        </h4>
                                                        <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                                            {new Date(blog.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <TrendingUp size={16} color="#10b981" style={{ marginTop: "0.25rem" }} />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Bio Section */}
                        <div style={{ background: "#1e293b", padding: "2rem", borderRadius: "1rem", border: "1px solid #334155", marginBottom: "2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <User size={20} color="#60a5fa" /> About Me
                                </h2>
                                <button onClick={() => setActiveTab("settings")} style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.9rem" }}>Edit</button>
                            </div>
                            <p style={{ color: "#cbd5e1", lineHeight: "1.6" }}>{user.bio || "No bio added yet."}</p>

                            {/* Social Links Preview */}
                            {user.social_links && (
                                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #334155" }}>
                                    {user.social_links.twitter && <a href={user.social_links.twitter} target="_blank" style={{ color: "#38bdf8" }}><Twitter size={20} /></a>}
                                    {user.social_links.linkedin && <a href={user.social_links.linkedin} target="_blank" style={{ color: "#0a66c2" }}><Linkedin size={20} /></a>}
                                    {user.social_links.github && <a href={user.social_links.github} target="_blank" style={{ color: "#fff" }}><Github size={20} /></a>}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* 2. MY BLOGS TAB */}
                {activeTab === "blogs" && (
                    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>My Blogs</h1>

                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    style={{
                                        background: "#1e293b", border: "1px solid #334155",
                                        padding: "0.5rem 1rem", borderRadius: "0.5rem",
                                        color: "white", outline: "none", cursor: "pointer",
                                        fontSize: "0.9rem"
                                    }}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title">Title A-Z</option>
                                </select>

                                {/* Search Bar */}
                                <div style={{ position: "relative" }}>
                                    <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                    <input
                                        type="text"
                                        placeholder="Search blogs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ background: "#1e293b", border: "1px solid #334155", padding: "0.5rem 1rem 0.5rem 2.5rem", borderRadius: "0.5rem", color: "white", outline: "none", minWidth: "250px" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {filteredBlogs.length > 0 ? (
                                filteredBlogs.map(blog => (
                                    <div key={blog.id} style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #334155", transition: "transform 0.2s", cursor: "pointer", position: "relative" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#60a5fa"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#334155"}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white" }}>{blog.title}</h3>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <span style={{ fontSize: "0.85rem", color: "#94a3b8", background: "rgba(148,163,184,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                                                    {new Date(blog.created_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(blog.id); }}
                                                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                                                >
                                                    <BookOpen size={20} color={isBookmarked(blog.id) ? "#f59e0b" : "#94a3b8"} fill={isBookmarked(blog.id) ? "#f59e0b" : "none"} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {blog.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                                    <FileText size={48} style={{ opacity: 0.5, marginBottom: "1rem" }} />
                                    <p>No blogs found.</p>
                                    {searchQuery && <button onClick={() => setSearchQuery("")} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginTop: "0.5rem" }}>Clear Search</button>}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* 3. BOOKMARKS TAB (Updated) */}
                {activeTab === "bookmarks" && (
                    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>Saved Blogs</h1>
                            <div style={{ position: "relative" }}>
                                <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="text"
                                    placeholder="Search saved..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ background: "#1e293b", border: "1px solid #334155", padding: "0.5rem 1rem 0.5rem 2.5rem", borderRadius: "0.5rem", color: "white", outline: "none", minWidth: "250px" }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {filteredBookmarks.length > 0 ? (
                                filteredBookmarks.map(blog => (
                                    <div key={blog.id} style={{ background: "#1e293b", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #334155", transition: "transform 0.2s", cursor: "pointer", position: "relative" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#60a5fa"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#334155"}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white" }}>{blog.title}</h3>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <span style={{ fontSize: "0.85rem", color: "#94a3b8", background: "rgba(148,163,184,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                                                    {new Date(blog.created_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(blog.id); }}
                                                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                                                >
                                                    <BookOpen size={20} color={isBookmarked(blog.id) ? "#f59e0b" : "#94a3b8"} fill={isBookmarked(blog.id) ? "#f59e0b" : "none"} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {blog.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: "center", padding: "4rem", background: "#1e293b", borderRadius: "1rem", border: "1px solid #334155", color: "#64748b" }}>
                                    <BookOpen size={64} style={{ opacity: 0.3, marginBottom: "1.5rem" }} />
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "white", marginBottom: "0.5rem" }}>No bookmarks yet</h3>
                                    <p>Blogs you save will appear here for easy access.</p>
                                    <button onClick={() => setActiveTab("blogs")} style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}>
                                        Browse My Blogs
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* 3. HISTORY TAB */}
                {activeTab === "history" && (
                    <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "white", marginBottom: "1.5rem" }}>
                            Generation History
                        </h2>
                        {loadingHistory ? (
                            <p style={{ color: "#94a3b8" }}>Loading history...</p>
                        ) : history.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem", background: "rgba(30, 41, 59, 0.3)", borderRadius: "1rem" }}>
                                <p style={{ color: "#94a3b8" }}>No history found. Start writing specific content!</p>
                                <button
                                    onClick={() => router.push("/write")}
                                    style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
                                >
                                    Go to Writer
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {history.map((blog) => (
                                    <div key={blog.id} style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #334155" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600" }}>{blog.title}</h3>
                                            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{new Date(blog.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {blog.content.replace(/[#*`]/g, "")}
                                        </p>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            {blog.tags && blog.tags.map((tag, idx) => (
                                                <span key={idx} style={{ background: "#1e293b", color: "#94a3b8", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.8rem" }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. SETTINGS TAB */}
                {activeTab === "settings" && (
                    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem", color: "white" }}>Profile Settings</h1>

                        <div style={{ background: "#1e293b", padding: "2rem", borderRadius: "1rem", border: "1px solid #334155" }}>

                            {/* Personal Info Group */}
                            <div style={{ marginBottom: "2rem" }}>
                                <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.5rem", borderBottom: "1px solid #334155", paddingBottom: "0.75rem" }}>Personal Information</h3>

                                {/* Avatar Upload UI */}
                                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
                                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(45deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2rem", fontWeight: "bold", position: "relative", overflow: "hidden" }}>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            formData.full_name ? formData.full_name.charAt(0) : "U"
                                        )}
                                        <button onClick={() => fileInputRef.current.click()} style={{ position: "absolute", bottom: "0", right: "0", background: "#334155", borderRadius: "50%", padding: "0.4rem", border: "2px solid #1e293b", cursor: "pointer", color: "white" }}>
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                            accept="image/*"
                                        />
                                        <button onClick={() => fileInputRef.current.click()} style={{ background: "#334155", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.9rem", marginRight: "0.75rem" }}>
                                            Upload New Picture
                                        </button>
                                        <button style={{ background: "transparent", color: "#ef4444", border: "none", padding: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                    <div>
                                        <label style={{ display: "block", color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "#64748b", outline: "none", cursor: "not-allowed" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows="4"
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "white", outline: "none", resize: "none" }}
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Social Links Group */}
                            <div style={{ marginBottom: "2rem" }}>
                                <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.5rem", borderBottom: "1px solid #334155", paddingBottom: "0.75rem" }}>Social Links</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div style={{ position: "relative" }}>
                                        <Twitter size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                        <input
                                            type="text"
                                            placeholder="Twitter URL"
                                            value={formData.social_links.twitter}
                                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem 0.75rem 0.75rem 2.5rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                        />
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <Linkedin size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                        <input
                                            type="text"
                                            placeholder="LinkedIn URL"
                                            value={formData.social_links.linkedin}
                                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem 0.75rem 0.75rem 2.5rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                        />
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <Github size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                                        <input
                                            type="text"
                                            placeholder="GitHub URL"
                                            value={formData.social_links.github}
                                            onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, github: e.target.value } })}
                                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem 0.75rem 0.75rem 2.5rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password Change Group */}
                            <div style={{ marginBottom: "2rem" }}>
                                <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.5rem", borderBottom: "1px solid #334155", paddingBottom: "0.75rem" }}>Change Password</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", padding: "0.75rem", borderRadius: "0.5rem", color: "white", outline: "none" }}
                                    />
                                    <button
                                        onClick={handlePasswordChange}
                                        style={{ alignSelf: "flex-start", padding: "0.75rem 1.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #334155" }}>
                                <button style={{ padding: "0.75rem 1.5rem", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
                                <button onClick={handleSave} style={{ padding: "0.75rem 1.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
