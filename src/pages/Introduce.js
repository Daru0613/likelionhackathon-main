import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/Introduce.css' // 스타일 따로 관리

function IntroducePage() {
  const navigate = useNavigate()

  // 페이지 로드 시 로그인 여부 확인
  useEffect(() => {
    const token = localStorage.getItem('token') // 로그인 시 저장한 토큰
    if (token) {
      navigate('/mainpage') // 로그인 상태면 홈 화면으로 이동
    }
  }, [navigate])

  const handleStart = () => {
    navigate('/login') // 로그인 페이지로 이동
  }

  return (
    <div className="introduce-container">
      <h1 className="title">감정 분석 AI</h1>
      <p className="subtitle">
        당신의 감정을 이해하고, 기록하며, 더 나은 하루를 위한 공간을
        추천해드려요.
      </p>

      <div className="feature-cards">
        <div className="card">
          <h2>감정 분석 + 장소 추천</h2>
          <p>
            당신의 말을 분석해 지금의 감정을 파악하고,
            <br />그 감정에 맞는 장소를 추천해드려요.
          </p>
        </div>
        <div className="card">
          <h2>감정 변화 기록</h2>
          <p>
            방문한 장소에서 느꼈던 감정을 <br />
            기록해보세요. 감정의 변화를 통해 나를
            <br />더 잘 이해할 수 있어요.
          </p>
        </div>
        <div className="card">
          <h2>감정 시각화</h2>
          <p>
            내가 기록한 감정들을 그래프와 차트로
            <br /> 확인할 수 있어요.
            <br />
            감정의 흐름을 한눈에 볼 수 있어요.
          </p>
        </div>
      </div>

      <button className="start-button" onClick={handleStart}>
        시작하기 →
      </button>
    </div>
  )
}

export default IntroducePage
