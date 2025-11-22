import React, { useEffect, useState } from "react";
import API from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [editReportId, setEditReportId] = useState(null);
  const [editReportDesc, setEditReportDesc] = useState("");
  const [editPostId, setEditPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    fetchProfile();
    fetchReports();
  }, []);

  useEffect(() => {
    if (profile) fetchPosts();
  }, [profile]);
  async function fetchPosts() {
    try {
      const res = await API.get("/posts");
      setPosts(res.data?.filter((p) => p.UserId === profile?.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || []);
    } catch (e) {
      console.error("Error fetching posts:", e);
      setPosts([]);
    }
  }

  async function deleteReport(id) {
    if (!window.confirm("Delete this report?")) return;
    try {
      await API.delete(`/reports/${id}`);
      fetchReports();
    } catch (e) {
      alert("Error deleting report: " + (e.response?.data?.error || e.message));
    }
  }

  function startEditReport(r) {
    setEditReportId(r.id);
    setEditReportDesc(r.description);
  }

  async function saveEditReport(id) {
    try {
      await API.put(`/reports/${id}`, { description: editReportDesc });
      setEditReportId(null);
      setEditReportDesc("");
      fetchReports();
    } catch (e) {
      alert("Error updating report: " + (e.response?.data?.error || e.message));
    }
  }

  async function deletePost(id) {
    if (!window.confirm("Delete this post?")) return;
    try {
      if (profile?.role === "admin") {
        await API.delete(`/admin/posts/${id}`);
      } else {
        await API.delete(`/posts/${id}`);
      }
      fetchPosts();
    } catch (e) {
      alert("Error deleting post: " + (e.response?.data?.error || e.message));
    }
  }

  function startEditPost(p) {
    setEditPostId(p.id);
    setEditPostTitle(p.title);
    setEditPostContent(p.content);
  }

  async function saveEditPost(id) {
    try {
      await API.put(`/posts/${id}`, {
        title: editPostTitle,
        content: editPostContent,
      });
      setEditPostId(null);
      setEditPostTitle("");
      setEditPostContent("");
      fetchPosts();
    } catch (e) {
      alert("Error updating post: " + (e.response?.data?.error || e.message));
    }
  }
  async function fetchProfile() {
    try {
      const res = await API.get("/profile");
      setProfile(res.data);
      setUsername(res.data.username);
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }

  async function fetchReports() {
    try {
      const res = await API.get("/reports/me");
      setReports(res.data || []);
    } catch (e) {
      console.error("Error fetching reports:", e);
      setReports([]);
    }
  }

  async function save(e) {
    e.preventDefault();
    try {
      await API.put("/profile", { username, password: password || undefined });
      alert("Saved");
      setPassword("");
      fetchProfile();
    } catch (e) {
      alert("Error saving profile: " + (e.response?.data?.error || e.message));
    }
  }

  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      {/* Tabs */}
      <div className="posts-tabs">
        <button
          className={`posts-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Account Settings
        </button>
        <button
          className={`posts-tab ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          My Reports
        </button>
        <button
          className={`posts-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          My Posts
        </button>
      </div>

      {/* Content */}
      {activeTab === "settings" && (
        <div className="profile-section">
          <form onSubmit={save} className="profile-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="profile-section">
          {reports.length === 0 ? (
            <p className="empty-message">No reports submitted.</p>
          ) : (
            <div className="reports-list">
              {reports.map((r) => (
                <div key={r.id} className="report-item">
                  <div className="report-header">
                    <span className="report-station">{r.Station?.name || "Unknown Station"}</span>
                    <span className={`status-badge status-${r.status}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                  <div className="report-content">
                    {editReportId === r.id ? (
                      <div className="edit-form">
                        <textarea
                          value={editReportDesc}
                          onChange={(e) => setEditReportDesc(e.target.value)}
                          className="form-textarea"
                          rows={3}
                        />
                        <div className="edit-actions">
                          <button onClick={() => saveEditReport(r.id)} className="btn small">Save</button>
                          <button onClick={() => setEditReportId(null)} className="btn secondary small">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{r.description}</p>
                        <div className="report-meta">
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          <div className="item-actions">
                            <button onClick={() => startEditReport(r)} className="btn-link">Edit</button>
                            <button onClick={() => deleteReport(r.id)} className="btn-link danger">Delete</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "posts" && (
        <div className="profile-section">
          {posts.length === 0 ? (
            <p className="empty-message">No posts.</p>
          ) : (
            <div className="posts-list">
              {posts.map((p) => (
                <div key={p.id} className="post-item">
                  {editPostId === p.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        className="form-input"
                        placeholder="Title"
                      />
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="form-textarea"
                        rows={4}
                        placeholder="Content"
                      />
                      <div className="edit-actions">
                        <button onClick={() => saveEditPost(p.id)} className="btn small">Save</button>
                        <button onClick={() => setEditPostId(null)} className="btn secondary small">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h5 className="post-title">{p.title}</h5>
                      <p className="post-content">{p.content}</p>
                      <div className="post-meta">
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        <div className="item-actions">
                          <button onClick={() => startEditPost(p)} className="btn-link">Edit</button>
                          <button onClick={() => deletePost(p.id)} className="btn-link danger">Delete</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
