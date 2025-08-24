import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/Login.css'

const Login = () => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!userId || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    // 로컬에 저장된 회원 정보 가져오기
    const storedUsers = JSON.parse(localStorage.getItem('users')) || []

    // 입력한 정보와 일치하는 사용자 찾기
    const user = storedUsers.find(
      (u) => u['회원id'] === userId && u['비밀번호'] === password
    )

    if (user) {
      localStorage.setItem('userId', userId) // 로그인 상태 저장
      alert('로그인 성공!')
      navigate('/mainpage')
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않습니다.')
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
        </div>
      </div>
    </div>
  )
}

export default Login
