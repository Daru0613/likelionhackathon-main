import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const DeletePostPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(null)

  const currentUserId = localStorage.getItem('userId') || ''

  const handleDelete = async () => {
    try {
      const res = await fetch(`https://goaiyang.site/api/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setSuccess(true)
        alert('✅ 삭제되었습니다.')
      } else {
        setSuccess(false)
        alert('❌ 삭제할 권한이 없습니다.')
      }
    } catch {
      setSuccess(false)
      alert('서버 오류')
    }
    navigate('/boardpage')
  }

  return (
    <div className="container">
      <h2>게시글 삭제</h2>
      <p>삭제할 게시글 ID: {id}</p>
      <button onClick={handleDelete}>삭제</button>
      {success === true && (
        <div className="message success">✅ 삭제되었습니다.</div>
      )}
      {success === false && (
        <div className="message error">❌ 삭제할 권한이 없습니다.</div>
      )}
    </div>
  )
}

export default DeletePostPage
