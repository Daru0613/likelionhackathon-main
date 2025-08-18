import React, { useState, useEffect } from 'react'
import '../css/MyPage.css'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

const MyPage = () => {
  const [selectedContent, setSelectedContent] = useState('힐링 기록 보기')
  const [dummySpots, setDummySpots] = useState([
    { name: '일산 호수공원', date: '2025-07-21', emotion: '우울 → 안정' },
    { name: '고양 아람누리', date: '2025-07-17', emotion: '불안 → 편안' },
  ])
  const [dummyPosts] = useState([
    { title: '호수공원 산책 너무 좋았어요', date: '2025-07-21' },
    { title: '카페에서 감정 일기 쓰기 후기', date: '2025-07-15' },
  ])

  const [selectedDate, setSelectedDate] = useState(null)
  const [newSpot, setNewSpot] = useState({ name: '', emotion: '' })

  // 사용자 정보 상태 추가
  const [userProfile, setUserProfile] = useState({ iduser: '', email: '' })
  const navigate = useNavigate()

  // 사용자 정보 불러오기 (로컬스토리지 userId 활용)
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }
    fetch(`/api/users/${userId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('사용자 정보 불러오기 실패')
        return res.json()
      })
      .then((data) =>
        setUserProfile({ iduser: data.iduser, email: data.email })
      )
      .catch(() => {
        alert('사용자 정보 로드 실패. 다시 로그인해주세요.')
        navigate('/login')
      })
  }, [navigate])

  const handleSaveRecord = () => {
    if (!newSpot.name || !newSpot.emotion) return
    const newDate = selectedDate.toISOString().slice(0, 10)
    setDummySpots([...dummySpots, { ...newSpot, date: newDate }])
    setNewSpot({ name: '', emotion: '' })
    setSelectedDate(null)
  }

  // 회원 탈퇴 수정
  const handleWithdraw = () => {
    if (
      !window.confirm(
        '정말 회원 탈퇴를 진행하시겠습니까? 모든 데이터가 삭제됩니다.'
      )
    )
      return

    fetch('/api/users/me', {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('회원 탈퇴 실패')
        alert('성공적으로 탈퇴되었습니다.')
        localStorage.removeItem('userId')
        navigate('/login')
      })
      .catch(() => {
        alert('회원 탈퇴 중 오류가 발생했습니다.')
      })
  }

  return (
    <div className="mypage-container">
      <h2 className="mypage-subtitle">내 감정 케어</h2>

      <div className="profile-row">
        <div className="profile-icon-box">
          <FontAwesomeIcon icon={faCircleUser} className="profile-icon" />
        </div>
        <div className="profile-info-box">
          <p>
            <strong>이름:</strong> {userProfile.iduser || '사용자'}
          </p>
          <p>
            <strong>이메일:</strong> {userProfile.email || 'example@goyang.com'}
          </p>
        </div>
      </div>

      <div className="mypage-body">
        <div className="mypage-sidebar">
          <p onClick={() => setSelectedContent('힐링 기록 보기')}>
            힐링 기록 보기
          </p>
          <p onClick={() => setSelectedContent('감정 히스토리')}>
            감정 히스토리
          </p>
          <p onClick={() => setSelectedContent('추천 힐링 스팟')}>
            나에게 도움이된 힐링 스팟
          </p>
          <p onClick={() => setSelectedContent('내가 작성한 후기')}>
            내가 작성한 후기
          </p>
          <p onClick={() => setSelectedContent('회원 탈퇴')}>회원 탈퇴</p>
        </div>

        <div className="mypage-content">
          <h3 className="content-title">{selectedContent}</h3>

          {/* 힐링 기록 보기 */}
          {selectedContent === '힐링 기록 보기' && (
            <div>
              <p>나의 감정 회복을 위해 방문한 날짜와 장소입니다.</p>
              <Calendar
                onClickDay={(date) => setSelectedDate(date)}
                tileContent={({ date }) => {
                  const match = dummySpots.find(
                    (spot) => spot.date === date.toISOString().slice(0, 10)
                  )
                  return match ? (
                    <div className="calendar-emotion">
                      <p>{match.name}</p>
                      <p>{match.emotion}</p>
                    </div>
                  ) : null
                }}
              />

              {selectedDate && (
                <div className="calendar-form">
                  <h4>{selectedDate.toISOString().slice(0, 10)} 기록 추가</h4>

                  <input
                    type="text"
                    placeholder="장소명 입력"
                    value={newSpot.name}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, name: e.target.value })
                    }
                  />

                  {/* 이전 감정 Select */}
                  <select
                    value={newSpot.beforeEmotion || ''}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, beforeEmotion: e.target.value })
                    }
                  >
                    <option value="">이전 감정 선택</option>
                    <option value="우울">우울</option>
                    <option value="불안">불안</option>
                    <option value="분노">분노</option>
                    <option value="지침">지침</option>
                    <option value="슬픔">슬픔</option>
                  </select>

                  {/* 이후 감정 Select */}
                  <select
                    value={newSpot.afterEmotion || ''}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, afterEmotion: e.target.value })
                    }
                  >
                    <option value="">이후 감정 선택</option>
                    <option value="기쁨">기쁨</option>
                    <option value="안정">안정</option>
                    <option value="행복">행복</option>
                    <option value="감사">감사</option>
                    <option value="평온">평온</option>
                  </select>

                  <button onClick={handleSaveRecord}>기록 저장</button>
                </div>
              )}
            </div>
          )}

          {/* 감정 히스토리 */}
          {selectedContent === '감정 히스토리' && (
            <div>
              <p>
                최근 감정 변화 히스토리를 간단히 그래프로 확인할 수 있습니다.
                (그래프 껍데기)
              </p>
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#999',
                }}
              >
                (감정 변화 그래프 자리)
              </div>
            </div>
          )}

          {/* 내가 작성한 후기 */}
          {selectedContent === '내가 작성한 후기' && (
            <div>
              <p>내가 남긴 힐링 후기들입니다.</p>
              <div className="review-card-container">
                {dummyPosts.map((post, idx) => (
                  <div className="review-card" key={idx}>
                    <h4>{post.title}</h4>
                    <p>{post.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 회원 탈퇴 */}
          {selectedContent === '회원 탈퇴' && (
            <div className="withdraw-section">
              <p
                style={{
                  marginBottom: '20px',
                  color: '#cc0000',
                  fontWeight: 'bold',
                }}
              >
                ⚠️ 탈퇴 시 모든 감정 기록 및 힐링 히스토리가 삭제됩니다.
              </p>
              <button className="withdraw-button" onClick={handleWithdraw}>
                회원 탈퇴
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyPage
