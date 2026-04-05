"use client";

import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  TrendingUp,
  Activity,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Menu,
  Trash2,
  Edit,
  MoreVertical,
} from "lucide-react";

// --- MOCK DATA FOR CHARTS --- (KPIs now real)
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const CATEGORY_DATA = [
  { name: "Tech", value: 400 },
  { name: "Lifestyle", value: 300 },
  { name: "Travel", value: 300 },
  { name: "Health", value: 200 },
];

import { useRouter } from "next/navigation";
import API_BASE_URL from "../config";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- PROTECT ROUTE ---
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "admin") {
      router.push("/login");
    }
  }, []);

  // --- SHARED DATA STATE ---
  const [stats, setStats] = useState({
    total_blogs: 0,
    total_users: 0,
    ai_requests: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [logs, setLogs] = useState([]); // Recent activity

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (!res.ok) {
        console.error("Admin stats API error:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setChartData(data.chart_data || []);
        setCategoryData(data.category_data || []);
      } else {
        console.error("Admin stats API returned success=false:", data);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);


  // --- SUB-COMPONENTS ---
  const DashboardView = () => {
    const kpiData = [
      { label: "Total Blogs", value: stats.total_blogs, change: "Live", icon: FileText, color: "#3b82f6" },
      { label: "Total Users", value: stats.total_users, change: "Live", icon: Users, color: "#8b5cf6" },
      { label: "AI Requests", value: stats.ai_requests, change: "Live", icon: Activity, color: "#10b981" },
      { label: "System Health", value: "98%", change: "Stable", icon: Activity, color: "#f59e0b" },
    ];

    return (
      <>
        {/* METRICS GRID */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          {kpiData.map((kpi, index) => (
            <div key={index} style={{
              background: "rgba(30, 41, 59, 0.4)",
              border: "1px solid rgba(148,163,184,0.1)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              backdropFilter: "blur(5px)",
            }}>
              <div>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{kpi.label}</p>
                <div style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.5rem" }}>{kpi.value}</div>
                <div style={{ fontSize: "0.85rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <TrendingUp size={14} />
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div style={{ background: `${kpi.color}20`, padding: "0.75rem", borderRadius: "0.75rem", color: kpi.color }}>
                <kpi.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "1rem", padding: "1.5rem", height: "400px", minWidth: 0 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1.5rem" }}>Platform Traffic (Last 7 Days)</h3>
            <div style={{ width: "100%", height: "90%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "1rem", padding: "1.5rem", height: "400px", display: "flex", flexDirection: "column", minWidth: 0 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem" }}>Content Categories</h3>
            <div style={{ flex: 1, width: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  };

  const ManageBlogsView = () => {
    const [blogs, setBlogs] = useState([]);

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/blog/`);
        if (!res.ok) {
          console.error("Blogs API error:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        if (data.success) {
          console.log(`Fetched ${data.blogs?.length || 0} blogs`);
          setBlogs(data.blogs || []);
        } else {
          console.error("Blogs API returned success=false:", data);
        }
      } catch (e) {
        console.error("Fetch blogs failed", e);
      }
    };

    const handleDelete = async (id) => {
      if (!confirm("Are you sure you want to delete this blog?")) return;
      try {
        await fetch(`${API_BASE_URL}/api/blog/${id}`, { method: "DELETE" });
        fetchBlogs(); // Refresh
        fetchStats(); // Update stats in background
      } catch (e) {
        alert("Failed to delete");
      }
    };

    useEffect(() => {
      fetchBlogs();
      // Auto-refresh blogs every 10 seconds
      const interval = setInterval(fetchBlogs, 10000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div style={{ background: "rgba(30, 41, 59, 0.5)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid rgba(148,163,184,0.1)" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Manage Blogs</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.2)", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>ID</th>
              <th style={{ padding: "1rem" }}>Title</th>
              <th style={{ padding: "1rem" }}>Author</th>
              <th style={{ padding: "1rem" }}>Created At</th>
              <th style={{ padding: "1rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(blog => (
              <tr key={blog.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                <td style={{ padding: "1rem" }}>#{blog.id}</td>
                <td style={{ padding: "1rem", fontWeight: "600", color: "white" }}>{blog.title}</td>
                <td style={{ padding: "1rem" }}>{blog.author}</td>
                <td style={{ padding: "1rem" }}>{new Date(blog.created_at).toLocaleDateString()}</td>
                <td style={{ padding: "1rem" }}>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    style={{ background: "#ef4444", color: "white", padding: "0.5rem", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {blogs.length === 0 && <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center" }}>No blogs found.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const ManageUsersView = () => {
    const [users, setUsers] = useState([]);
    useEffect(() => {
      fetch(`${API_BASE_URL}/api/admin/users`)
        .then(res => res.json())
        .then(data => { if (data.success) setUsers(data.users || []); })
        .catch(err => console.error(err));
    }, []);

    return (
      <div style={{ background: "rgba(30, 41, 59, 0.5)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid rgba(148,163,184,0.1)" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Users</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.2)", textAlign: "left" }}>
              <th style={{ padding: "1rem" }}>ID</th>
              <th style={{ padding: "1rem" }}>Full Name</th>
              <th style={{ padding: "1rem" }}>Email</th>
              <th style={{ padding: "1rem" }}>Joined At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                <td style={{ padding: "1rem" }}>#{user.id}</td>
                <td style={{ padding: "1rem", fontWeight: "600", color: "white" }}>{user.full_name}</td>
                <td style={{ padding: "1rem" }}>{user.email}</td>
                <td style={{ padding: "1rem" }}>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4" style={{ padding: "2rem", textAlign: "center" }}>No users found (Try registering!).</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const SettingsView = () => {
    const [settings, setSettings] = useState({
      site_name: "AI Blog Platform",
      ai_model: "Llama 3.1 (Groq)",
      image_model: "DALL-E 3 (OpenAI)",
      image_style: "Digital Art"
    });
    const [adminUser, setAdminUser] = useState(null);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch Settings & Admin User Data
    useEffect(() => {
      // 1. Fetch System Settings
      fetch(`${API_BASE_URL}/api/settings/`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.settings) {
            setSettings(data.settings);
          }
        })
        .catch(err => console.error("Failed to fetch settings:", err));

      // 2. Fetch Admin User Details
      const userId = localStorage.getItem("user_id");
      if (userId) {
        fetch(`${API_BASE_URL}/api/user/${userId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setAdminUser(data.user);
            }
          })
          .catch(err => console.error("Failed to fetch admin user:", err));
      }
    }, []);

    // Handle File Upload
    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}/avatar`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          // Update local state to show new avatar immediately
          setAdminUser(prev => ({ ...prev, avatar_url: data.avatar_url }));
          // Update local storage to persist across pages if needed
          const event = new Event("storage");
          window.dispatchEvent(event);
        } else {
          alert("Failed to upload image");
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Error uploading image");
      }
    };

    const handleSave = async () => {
      setLoading(true);
      setMessage("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const data = await res.json();
        if (data.success) {
          setMessage("Settings saved successfully!");
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage("Failed to save settings.");
        }
      } catch (err) {
        console.error("Save failed:", err);
        setMessage("Error saving settings.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ maxWidth: "600px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>Platform Settings</h2>

        {/* Admin Profile Picture Section */}
        {adminUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(45deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2rem", fontWeight: "bold", position: "relative", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)" }}>
              {adminUser.avatar_url ? (
                <img src={adminUser.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                adminUser.full_name ? adminUser.full_name.charAt(0) : "A"
              )}
              <button onClick={() => fileInputRef.current.click()} style={{ position: "absolute", bottom: "0", right: "0", background: "rgba(15, 23, 42, 0.8)", borderRadius: "50%", padding: "0.4rem", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", color: "white", backdropFilter: "blur(4px)" }}>
                <Edit size={14} />
              </button>
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.25rem" }}>Admin Profile</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.75rem" }}>Update your dashboard avatar</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept="image/*"
              />
              <button onClick={() => fileInputRef.current.click()} style={{ background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500", transition: "all 0.2s" }}>
                Change Picture
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Site Name</label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            style={{ width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "0.5rem", color: "white" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Default AI Model</label>
          <select
            value={settings.ai_model}
            onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
            style={{ width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "0.5rem", color: "white" }}
          >
            <option style={{ background: "#0f172a" }}>Llama 3.1 (Groq)</option>
            <option style={{ background: "#0f172a" }}>GPT-4o (OpenAI)</option>
            <option style={{ background: "#0f172a" }}>GPT-3.5 Turbo</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Default Image Model</label>
          <select
            value={settings.image_model}
            onChange={(e) => setSettings({ ...settings, image_model: e.target.value })}
            style={{ width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "0.5rem", color: "white" }}
          >
            <option style={{ background: "#0f172a" }}>DALL-E 3 (OpenAI)</option>
            <option style={{ background: "#0f172a" }}>Stable Diffusion XL</option>
            <option style={{ background: "#0f172a" }}>Midjourney (v6)</option>
          </select>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#94a3b8" }}>Image Style Preset</label>
          <select
            value={settings.image_style}
            onChange={(e) => setSettings({ ...settings, image_style: e.target.value })}
            style={{ width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "0.5rem", color: "white" }}
          >
            <option style={{ background: "#0f172a" }}>Photorealistic</option>
            <option style={{ background: "#0f172a" }}>Digital Art</option>
            <option style={{ background: "#0f172a" }}>Anime / Manga</option>
            <option style={{ background: "#0f172a" }}>Cinematic 4K</option>
            <option style={{ background: "#0f172a" }}>3D Render</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ background: "#3b82f6", color: "white", padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "none", fontWeight: "600", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {message && <span style={{ color: message.includes("Failed") ? "#ef4444" : "#10b981", fontSize: "0.9rem" }}>{message}</span>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 72px)", color: "#e5e7eb", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? "260px" : "80px", background: "rgba(30, 41, 59, 0.3)", borderRight: "1px solid rgba(148,163,184,0.1)", backdropFilter: "blur(10px)", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", transition: "width 0.3s ease", position: "relative", zIndex: 10 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: "absolute", right: "-12px", top: "20px", background: "#3b82f6", border: "none", borderRadius: "50%", width: "24px", height: "24px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          {sidebarOpen ? "←" : "→"}
        </button>
        <div style={{ marginBottom: "2rem", paddingLeft: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LayoutDashboard size={18} color="white" />
          </div>
          {sidebarOpen && <span style={{ fontWeight: "700", fontSize: "1.2rem", letterSpacing: "-0.025em" }}>Admin OS</span>}
        </div>
        {[
          { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { key: "blogs", label: "Manage Blogs", icon: FileText },
          { key: "users", label: "Users", icon: Users },
          { key: "settings", label: "Settings", icon: Settings },
        ].map((item) => (
          <button key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", background: activeTab === item.key ? "rgba(59, 130, 246, 0.15)" : "transparent", color: activeTab === item.key ? "#60a5fa" : "#94a3b8", cursor: "pointer", transition: "all 0.2s", justifyContent: sidebarOpen ? "flex-start" : "center" }}>
            <item.icon size={20} />
            {sidebarOpen && <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>{item.label}</span>}
          </button>
        ))}

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: "1rem" }}>
          <button
            onClick={() => {
              localStorage.removeItem("user_role");
              localStorage.removeItem("user_id");
              localStorage.removeItem("user_name");
              router.push("/login");
            }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer", transition: "all 0.2s", justifyContent: sidebarOpen ? "flex-start" : "center" }}
          >
            <Trash2 size={20} />
            {sidebarOpen && <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              {activeTab === "dashboard" ? "Welcome back, Admin 👋" :
                activeTab === "blogs" ? "Manage Content 📝" :
                  activeTab === "users" ? "User Management 👥" : "Settings ⚙️"}
            </h1>
            <p style={{ color: "#94a3b8" }}>
              {activeTab === "dashboard" ? "Here's what's happening with your platform today." : "Manage your platform efficiently."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(45deg, #ec4899, #8b5cf6)", cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)" }} />
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "blogs" && <ManageBlogsView />}
        {activeTab === "users" && <ManageUsersView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}