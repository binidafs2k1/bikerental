import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { formatDateTime, formatRelative } from "../shared/formatDate";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editReportId, setEditReportId] = useState(null);
  const [editReportDesc, setEditReportDesc] = useState("");
  const [editPostId, setEditPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchReports();
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (profile) fetchPosts();
  }, [profile]);
  async function fetchPosts() {
    const res = await API.get("/posts");
    const posts = res.data || [];
    const my = posts.filter((p) => p.UserId === profile?.id);
    my.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : null;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : null;
      if (aTime !== null && bTime !== null) return bTime - aTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return (b?.id || 0) - (a?.id || 0);
    });
    setPosts(my);
  }
  async function deleteReport(id) {
    if (!window.confirm("Delete this report?")) return;
    await API.delete(`/reports/${id}`);
    fetchReports();
  }

  function startEditReport(r) {
    setEditReportId(r.id);
    setEditReportDesc(r.description);
  }

  async function saveEditReport(id) {
    await API.put(`/reports/${id}`, { description: editReportDesc });
    setEditReportId(null);
    setEditReportDesc("");
    fetchReports();
  }

  async function deletePost(id) {
    if (!window.confirm("Delete this post?")) return;
    if (profile?.role === "admin") {
      await API.delete(`/admin/posts/${id}`);
    } else {
      await API.delete(`/posts/${id}`);
    }
    fetchPosts();
  }

  function startEditPost(p) {
    setEditPostId(p.id);
    setEditPostTitle(p.title);
    setEditPostContent(p.content);
  }

  async function saveEditPost(id) {
    await API.put(`/posts/${id}`, {
      title: editPostTitle,
      content: editPostContent,
    });
    setEditPostId(null);
    setEditPostTitle("");
    setEditPostContent("");
    fetchPosts();
  }
  async function fetchReports() {
    try {
      const res = await API.get("/reports/me");
      setReports(res.data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      console.error("Error fetching reports:", e);
    }
  }

  async function fetchFavorites() {
    try {
      const res = await API.get("/favorites/me");
      setFavorites(res.data || []);
    } catch (e) {
      console.error("Error fetching favorites:", e);
      setFavorites([]);
    }
  }

  async function toggleFavoriteStation(stationId) {
    try {
      const res = await API.post("/favorites", { stationId });
      // on toggle, reload favorites list
      fetchFavorites();
    } catch (e) {
      console.error("Error toggling favorite:", e);
      if (e.response?.status === 401) {
        // redirect to login handled elsewhere
      }
    }
  }

  async function save(e) {
    e.preventDefault();
    await API.put("/profile", { username, password: password || undefined });
    alert("Saved");
    setPassword("");
    fetchProfile();
  }

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>Profile</h3>
      <form onSubmit={save}>
        <div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="new password (leave blank to keep)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Save</button>
      </form>

      <h4>My Reports</h4>
      {reports.length === 0 ? (
        <p>No reports submitted.</p>
      ) : (
        <ul>
          {reports.map((r) => (
            <li key={r.id}>
              <strong>{r.Station.name}</strong>:{" "}
              {editReportId === r.id ? (
                <>
                  <input
                    value={editReportDesc}
                    onChange={(e) => setEditReportDesc(e.target.value)}
                  />
                  <button onClick={() => saveEditReport(r.id)}>Save</button>
                  <button onClick={() => setEditReportId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {r.description} - Status: {r.status}
                  {r.createdAt
                    ? ` (${formatDateTime(r.createdAt)}${
                        r.updatedAt && r.updatedAt !== r.createdAt
                          ? ` • Updated: ${formatRelative(r.updatedAt)}`
                          : ""
                      })`
                    : ""}
                  <button onClick={() => startEditReport(r)}>Edit</button>
                  <button onClick={() => deleteReport(r.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <h4>My Posts</h4>

      <h4>My Favorite Stations</h4>
      {favorites.length === 0 ? (
        <p>No favorite stations yet.</p>
      ) : (
        <div className="favorites-list">
          {favorites.map((f) => (
            <div key={f.id} className="favorite-item">
              <div>
                <strong>{f.Station?.name || `Station ${f.Station?.id}`}</strong>
                <div className="favorite-meta">
                  {f.createdAt
                    ? `Favorited ${new Date(f.createdAt).toLocaleString()}`
                    : ""}
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="btn-link"
                  onClick={() => toggleFavoriteStation(f.Station?.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {posts.length === 0 ? (
        <p>No posts.</p>
      ) : (
        <ul>
          {posts.map((p) => (
            <li key={p.id}>
              {editPostId === p.id ? (
                <>
                  <input
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                  />
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                  />
                  <button onClick={() => saveEditPost(p.id)}>Save</button>
                  <button onClick={() => setEditPostId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <strong>{p.title}</strong>: {p.content}
                  {(profile.role === "admin" && p.UserId === profile.id) ||
                  p.UserId === profile.id ? (
                    <>
                      <button onClick={() => startEditPost(p)}>Edit</button>
                      <button onClick={() => deletePost(p.id)}>Delete</button>
                    </>
                  ) : (
                    <button onClick={() => deletePost(p.id)}>Delete</button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
