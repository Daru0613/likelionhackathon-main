import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import '../css/PostPage.css'

const PostDetailPage = () => {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  // 로그인 사용자 iduser를 로컬스토리지에서 불러오는 예시
  const currentUserId = localStorage.getItem('userId') || ''
  const navigate = useNavigate()

  const fetchPost = async () => {
    try {
      const res = await fetch(`https://goaiyang.site/api/posts/${id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) setPost(data)
      else alert('게시글 조회 실패')
    } catch {
      alert('서버 오류')
    }
  }

  const fetchComments = async () => {
    try {
      const res = await fetch('https://goaiyang.site/api/comments', {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) setComments(data.filter((c) => c.post_id === Number(id)))
      else alert('댓글 조회 실패')
    } catch {
      alert('서버 오류')
    }
  }

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  const handleAddComment = async () => {
    if (!comment.trim()) {
      alert('댓글을 입력해주세요.')
      return
    }
    try {
      const res = await fetch('https://goaiyang.site/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: Number(id), content: comment }),
      })
      const data = await res.json()
      if (res.ok) {
        setComment('')
        fetchComments()
      } else alert(data.error || '댓글 작성 실패')
    } catch {
      alert('서버 오류')
    }
  }

  const handleDeleteComment = async (commentId, author) => {
    if (currentUserId !== author) {
      alert('❌ 삭제할 권한이 없습니다.')
      return
    }
    const confirmed = window.confirm('정말 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const res = await fetch(
        `https://goaiyang.site/api/comments/${commentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )
      if (res.ok) {
        alert('✅ 삭제되었습니다.')
        fetchComments()
      } else {
        alert('삭제 실패')
      }
    } catch {
      alert('서버 오류')
    }
  }

  if (!post) return <div>로딩 중...</div>

  return (
    <div className="container">
      <h2>게시글 상세</h2>

      <div className="post-box">
        <h3>{post.title}</h3>
        <p>{post.content}</p>
        <p>작성자: {post.author}</p>

        {currentUserId === post.author && (
          <Link to={`/editpostpage/${id}`}>
            <button>수정</button>
          </Link>
        )}
        {currentUserId === post.author && (
          <Link to={`/deletepostpage/${id}`}>
            <button>삭제</button>
          </Link>
        )}
      </div>

      <hr />

      <div className="comment-write">
        <h4>댓글 작성</h4>
        <textarea
          placeholder="댓글을 입력하세요"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleAddComment}>댓글 작성</button>
      </div>

      <div className="comment-list">
        <h4>댓글 목록</h4>
        {comments.length === 0 ? (
          <p>작성된 댓글이 없습니다.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment-item">
              <p>
                {c.author}: {c.content}
              </p>
              {currentUserId === c.author && (
                <>
                  <Link to={`/editcommentpage/${c.id}`}>
                    <button>수정</button>
                  </Link>
                  <button onClick={() => handleDeleteComment(c.id, c.author)}>
                    삭제
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PostDetailPage
