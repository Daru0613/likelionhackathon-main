import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import '../css/PostPage.css'

const EditPostPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postAuthor, setPostAuthor] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const currentUserId = localStorage.getItem('userId') || ''

  useEffect(() => {
    fetch(`https://goaiyang.site/api/posts/${id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title)
        setContent(data.content)
        setPostAuthor(data.author)
      })
      .catch(() => alert('게시글 조회 실패'))
  }, [id])

  const handleEdit = () => {
    if (currentUserId === postAuthor) {
      fetch(`https://goaiyang.site/api/posts/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
        .then((res) => {
          if (res.ok) {
            setIsSuccess(true)
            setIsError(false)
            setTimeout(() => {
              navigate(`/postdetailpage/${id}`)
            }, 1000)
          } else {
            setIsSuccess(false)
            setIsError(true)
          }
        })
        .catch(() => {
          setIsSuccess(false)
          setIsError(true)
        })
    } else {
      setIsSuccess(false)
      setIsError(true)
    }
  }

  return (
    <div className="container">
      <h2>게시글 수정</h2>

      <input
        type="text"
        value={title}
        placeholder="제목"
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        value={content}
        placeholder="내용"
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleEdit}>수정 완료</button>

      {isSuccess && (
        <div className="message success">✅ 게시글이 수정되었습니다</div>
      )}
      {isError && (
        <>
          <div className="message error">❌ 수정할 권한이 없습니다</div>
          <Link to={`/postdetailpage/${id}`}>
            <button>돌아가기</button>
          </Link>
        </>
      )}
    </div>
  )
}

export default EditPostPage
