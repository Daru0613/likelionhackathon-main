import React, { useState, useEffect } from 'react'
import '../css/MyPage.css'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// 탭 라벨
const TABS = {
  HEALING: '힐링 기록 보기',
  HISTORY: '감정 히스토리',
  POSTS: '내가 작성한 후기',
  WITHDRAW: '회원 탈퇴',
}

// 감정 순서
const emotionList = [
  '기쁨',
  '편안',
  '안정',
  '평온',
  '당황',
  '외로움',
  '슬픔',
  '우울',
  '상처',
  '불안',
  '두려움',
  '혐오',
  '분노',
]

// 감정별 색상
const emotionColors = {
  기쁨: 'rgba(255, 206, 86, 0.7)',
  편안: 'rgba(200, 180, 255, 0.7)',
  안정: 'rgba(120, 200, 120, 0.7)',
  평온: 'rgba(75, 192, 192, 0.7)',
  당황: 'rgba(255, 159, 64, 0.7)',
  외로움: 'rgba(213, 56, 252, 0.7)',
  슬픔: 'rgba(100, 100, 200, 0.7)',
  우울: 'rgba(50, 50, 150, 0.7)',
  상처: 'rgba(250, 255, 102, 0.7)',
  불안: 'rgba(54, 162, 235, 0.7)',
  두려움: 'rgba(0, 200, 200, 0.7)',
  혐오: 'rgba(150, 75, 0, 0.7)',
  분노: 'rgba(255, 99, 132, 0.7)',
}

// API 베이스 (app.js에서 설정한 backend 도메인)
const API_BASE = process.env.REACT_APP_API_BASE || 'https://goaiyang.site/api'

// YYYY-MM-DD 변환 함수
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 날짜 예쁘게 표시
const prettyDate = (d) =>
  !d
    ? ''
    : new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

const MyPage = () => {
  const [userProfile, setUserProfile] = useState({ iduser: '', email: '' })
  const navigate = useNavigate()

  const [selectedContent, setSelectedContent] = useState(TABS.HEALING)

  // spots(힐링 기록) 상태
  const [spots, setSpots] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [newSpot, setNewSpot] = useState({
    name: '',
    beforeEmotion: '',
    afterEmotion: '',
  })

  // 후기 상태 (server)
  const [posts, setPosts] = useState([])
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false)

  // 감정 히스토리(월별) 선택 상태
  const [selectedMonth, setSelectedMonth] = useState('')

  // 사용자 정보 가져오기
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

    // 힐링 기록(healing_calendar) API 호출
    fetch(`/api/healing-calendar/${userId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        // 로컬 상태에 spots 형식 맞게 변환
        const records = data.map((rec) => ({
          name: rec.place,
          beforeEmotion: rec.emotion_prev,
          afterEmotion: rec.emotion_next,
          date: rec.record_date,
        }))
        setSpots(records)
      })
      .catch((e) => console.error('힐링 기록 로드 실패:', e))
  }, [navigate])

  // 후기: 후기 탭 선택 시 서버 호출 (my-posts API)
  useEffect(() => {
    const loadMyPosts = async () => {
      if (selectedContent !== TABS.POSTS || hasLoadedPosts) return
      try {
        const userId = localStorage.getItem('userId')
        if (!userId) return
        const res = await fetch(`${API_BASE}/my-posts/${userId}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('후기 불러오기 실패')
        const data = await res.json()
        setPosts(data)
        setHasLoadedPosts(true)
      } catch (err) {
        console.error(err)
      }
    }
    loadMyPosts()
  }, [selectedContent, hasLoadedPosts])

  // 기록 저장
  const handleSaveRecord = () => {
    if (
      !newSpot.name ||
      !newSpot.afterEmotion ||
      !newSpot.beforeEmotion ||
      !selectedDate
    )
      return
    const newDate = formatDate(selectedDate)
    setSpots([...spots, { ...newSpot, date: newDate }])
    setNewSpot({ name: '', beforeEmotion: '', afterEmotion: '' })
    setSelectedDate(null)
  }

  // 회원 탈퇴 (서버 API 호출)
  const handleWithdraw = () => {
    const userId = localStorage.getItem('userId')
    if (
      !window.confirm(
        '정말 회원 탈퇴를 진행하시겠습니까? 모든 데이터가 삭제됩니다.'
      )
    )
      return

    if (!userId) {
      alert('로그인을 다시 진행해 주세요.')
      navigate('/login')
      return
    }

    fetch(`/api/users/${userId}`, {
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

  // 날짜순 정렬
  const sortedSpots = [...spots].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  // 감정 히스토리(라인 차트 데이터)
  const lineData = {
    datasets: [
      {
        label: '이후 감정 변화',
        data: sortedSpots.map((s) => ({ x: s.date, y: s.afterEmotion })),
        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.3)',
        tension: 0.3,
        pointBackgroundColor: sortedSpots.map(
          (s) => emotionColors[s.afterEmotion] || 'rgba(0,0,0,0.4)'
        ),
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    scales: {
      x: { type: 'category', title: { display: true, text: '날짜' } },
      y: {
        type: 'category',
        labels: emotionList,
        title: { display: true, text: '감정' },
      },
    },
  }

  // 막대 차트용 월별 감정 빈도 집계
  const monthlyCounts = {}
  sortedSpots.forEach((s) => {
    const month = s.date?.slice(0, 7)
    if (!month) return
    if (!monthlyCounts[month]) monthlyCounts[month] = {}
    monthlyCounts[month][s.afterEmotion] =
      (monthlyCounts[month][s.afterEmotion] || 0) + 1
  })
  const months = Object.keys(monthlyCounts).sort()
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1])
    }
  }, [months, selectedMonth])

  const barLabels = Object.keys(monthlyCounts[selectedMonth] || {})
  const barValues = Object.values(monthlyCounts[selectedMonth] || {})
  const barColors = barLabels.map(
    (e) => emotionColors[e] || 'rgba(200,200,200,0.7)'
  )
  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: `${selectedMonth} 감정 빈도`,
        data: barValues,
        backgroundColor: barColors,
      },
    ],
  }

  return (
    <div className="mypage-container">
      <h2 className="mypage-subtitle">내 감정 케어</h2>

      {/* 상단 프로필 */}
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
        {/* 사이드바 탭 */}
        <div className="mypage-sidebar">
          <p
            className={selectedContent === TABS.HEALING ? 'active' : ''}
            onClick={() => setSelectedContent(TABS.HEALING)}
          >
            {TABS.HEALING}
          </p>
          <p
            className={selectedContent === TABS.HISTORY ? 'active' : ''}
            onClick={() => setSelectedContent(TABS.HISTORY)}
          >
            {TABS.HISTORY}
          </p>
          <p
            className={selectedContent === TABS.POSTS ? 'active' : ''}
            onClick={() => setSelectedContent(TABS.POSTS)}
          >
            {TABS.POSTS}
          </p>
          <p
            className={selectedContent === TABS.WITHDRAW ? 'active' : ''}
            onClick={() => setSelectedContent(TABS.WITHDRAW)}
          >
            {TABS.WITHDRAW}
          </p>
        </div>

        {/* 본문 */}
        <div className="mypage-content">
          <h3 className="content-title">{selectedContent}</h3>

          {/* 힐링 기록 보기 */}
          {selectedContent === TABS.HEALING && (
            <div>
              <p>나의 감정 회복을 위해 방문한 날짜와 장소입니다.</p>
              <Calendar
                onClickDay={(date) => setSelectedDate(date)}
                tileContent={({ date }) => {
                  const match = spots.find(
                    (spot) => spot.date === formatDate(date)
                  )
                  return match ? (
                    <div className="calendar-emotion">
                      <p>{match.name}</p>
                      <p>{match.afterEmotion}</p>
                    </div>
                  ) : null
                }}
              />
              {selectedDate && (
                <div className="calendar-form">
                  <h4>{formatDate(selectedDate)} 기록 추가</h4>
                  <input
                    type="text"
                    placeholder="장소명 입력"
                    value={newSpot.name}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, name: e.target.value })
                    }
                  />
                  <select
                    value={newSpot.beforeEmotion || ''}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, beforeEmotion: e.target.value })
                    }
                  >
                    <option value="" disabled hidden>
                      이전 감정 선택
                    </option>
                    {emotionList.map((emo) => (
                      <option key={emo} value={emo}>
                        {emo}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSpot.afterEmotion || ''}
                    onChange={(e) =>
                      setNewSpot({ ...newSpot, afterEmotion: e.target.value })
                    }
                  >
                    <option value="" disabled hidden>
                      이후 감정 선택
                    </option>
                    {emotionList.map((emo) => (
                      <option key={emo} value={emo}>
                        {emo}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleSaveRecord}>기록 저장</button>
                </div>
              )}
            </div>
          )}

          {/* 감정 히스토리 */}
          {selectedContent === TABS.HISTORY && (
            <div>
              <p>최근 감정 변화 히스토리</p>
              <Line data={lineData} options={lineOptions} />
              <p style={{ marginTop: '30px' }}>한 달 동안 감정 빈도</p>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ marginBottom: '15px' }}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          )}

          {/* 내가 작성한 후기 */}
          {selectedContent === TABS.POSTS && (
            <div>
              <p>내가 남긴 힐링 후기들입니다.</p>
              <div className="review-card-container">
                {posts.length === 0 ? (
                  <p>아직 작성한 후기가 없어요.</p>
                ) : (
                  posts.map((post) => (
                    <div className="review-card" key={post.id ?? post.title}>
                      <h4>{post.title}</h4>
                      <p>{prettyDate(post.createdAt)}</p>
                      <p>
                        {(post.content || '').slice(0, 100)}
                        {(post.content || '').length > 100 ? '…' : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 회원 탈퇴 */}
          {selectedContent === TABS.WITHDRAW && (
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
