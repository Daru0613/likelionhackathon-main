import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import '../css/PostPage.css'

const EditCommentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const currentUserId = localStorage.getItem('userId') || ''

  useEffect(() => {
    fetch(`https://goaiyang.site/api/comments/${id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content)
        setCommentAuthor(data.author)
      })
      .catch(() => alert('댓글 조회 실패'))
  }, [id])

  const handleEdit = () => {
    if (currentUserId === commentAuthor) {
      fetch(`https://goaiyang.site/api/comments/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
        .then((res) => {
          if (res.ok) {
            setIsSuccess(true)
            setIsError(false)
            setTimeout(() => {
              navigate(-1)
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
      <h2>댓글 수정</h2>

      <textarea value={content} onChange={(e) => setContent(e.target.value)} />

      <button onClick={handleEdit}>수정 완료</button>

      {isSuccess && <div className="message success">✅ 완료되었습니다</div>}
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

export default EditCommentPage
