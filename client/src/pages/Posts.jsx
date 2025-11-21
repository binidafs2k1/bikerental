import React, { useEffect, useState } from 'react'
import API from '../api'

export default function Posts(){
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(()=>{ fetchPosts() }, [])
  async function fetchPosts(){
    const res = await API.get('/posts');
    setPosts(res.data);
  }

  async function submit(e){
    e.preventDefault();
    await API.post('/posts', { title, content });
    setTitle(''); setContent('');
    fetchPosts();
  }

  return (
    <div>
      <h3>Posts</h3>
      <div className="card">
        <form onSubmit={submit}>
          <div><input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><textarea placeholder="content" value={content} onChange={e=>setContent(e.target.value)} /></div>
          <button type="submit">Post</button>
        </form>
      </div>
      {posts.map(p => (
        <div key={p.id} className="card">
          <strong>{p.title}</strong>
          <div>{p.content}</div>
          <div>By: {p.User && p.User.username}</div>
        </div>
      ))}
    </div>
  )
}
