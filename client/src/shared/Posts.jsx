import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import API from "../api";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchUser();
  }, []);

  async function fetchPosts() {
    const res = await API.get("/posts");
    setPosts(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  async function fetchUser() {
    try {
      const res = await API.get("/profile");
      setUser(res.data);
    } catch (e) {
      // If not logged in, user is null
    }
  }

  async function submit(e) {
    e.preventDefault();
    await API.post("/posts", { title, content });
    setTitle("");
    setContent("");
    fetchPosts();
    alert("Post created successfully!");
  }

  const allPosts = posts;
  const myPosts = user ? posts.filter((p) => p.UserId === user.id) : [];

  const filterPosts = (postList) => {
    if (!searchQuery) return postList;
    return postList.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderPosts = (postList) => {
    const filteredPosts = filterPosts(postList);
    return (
      <>
        <div className="posts-search">
          <div className="input-with-icon">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        <div className="posts-list">
          {filteredPosts.map((p) => (
            <div key={p.id} className="card post-item">
              <h4 className="post-title">{p.title}</h4>
              <p className="post-content">{p.content}</p>
              <div className="post-author">By: {p.User && p.User.username}</div>
            </div>
          ))}
          {filteredPosts.length === 0 && (
            <div className="empty-state">
              {searchQuery
                ? "No posts match your search."
                : "No posts to show."}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="posts-container">
      <h3>Posts</h3>

      {/* Tabs */}
      <div className="posts-tabs">
        <button
          className={`posts-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Posts
        </button>
        <button
          className={`posts-tab ${activeTab === "my" ? "active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          My Posts
        </button>
        <button
          className={`posts-tab ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Create Post
        </button>
      </div>

      {/* Content */}
      {activeTab === "all" && renderPosts(allPosts)}
      {activeTab === "my" && renderPosts(myPosts)}
      {activeTab === "create" && (
        <div className="card posts-form">
          <form onSubmit={submit} className="create-post-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                placeholder="Write your post content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-textarea"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn">
                Create Post
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
