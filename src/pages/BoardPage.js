import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../css/PostPage.css'

const BoardPage = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState([])

  const fetchPosts = async () => {
    try {
      const res = await fetch('https://goaiyang.site/api/posts', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) setPosts(data)
      else alert('게시글 조회 실패')
    } catch {
      alert('서버 연결 오류')
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력하세요.')
      return
    }
    try {
      const res = await fetch('https://goaiyang.site/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json()
      if (res.ok) {
        setTitle('')
        setContent('')
        fetchPosts()
      } else alert(data.error || '글 작성 실패')
    } catch {
      alert('서버 오류')
    }
  }

  return (
    <div className="container">
      <h2>게시판</h2>
      <div className="write-box">
        <h3>게시글 작성</h3>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleSave}>저장</button>
      </div>
      <hr />
      <div className="post-list">
        <h3>게시글 목록</h3>
        {posts.length === 0 ? (
          <p>작성된 게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-item">
              <h4>{post.title}</h4>
              <p>작성자: {post.author}</p>
              <Link to={`/postdetailpage/${post.id}`}>
                <button>자세히 보기</button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BoardPage
