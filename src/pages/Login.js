import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/Login.css'

const Login = () => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // 이미 로그인된 사용자는 로그인 페이지에 들어올 수 없음 → 메인페이지로 리다이렉트
  useEffect(() => {
    const loginUser = localStorage.getItem('userId')
    if (loginUser) {
      navigate('/mainpage')
    }
  }, [navigate])

  const handleLogin = async () => {
    if (!userId || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include', // ← 반드시 추가!
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iduser: userId, userpw: password }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('로그인 성공!')
        localStorage.setItem('userId', userId)
        navigate('/mainpage')
      } else {
        alert(data.error || '아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (err) {
      alert('서버 연결 실패!')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="title">GoAI양</h1>
        <h2 className="subtitle">로그인</h2>
        <div className="form-group">
          <label>아이디</label>
          <input
            type="text"
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="login-btn" onClick={handleLogin}>
            로그인
          </button>
        </div>
        <hr />
        <div className="footer">
          <span>아직 회원이 아니라면?</span>
          <Link to="/signup">회원가입</Link>
          <br />
          <Link to="/find">아이디/비밀번호 찾기</Link>
          <br />
          <Link to="/users">관리자</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
