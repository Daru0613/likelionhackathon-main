import React, { useState, useEffect } from 'react'
import '../css/MyPage.css'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
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

// API 베이스
const API_BASE = process.env.REACT_APP_API_BASE || 'https://goaiyang.site/api'

// YYYY-MM-DD
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 날짜 표시용
const prettyDate = (d) =>
  !d
    ? ''
    : new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

const MyPage = () => {
  const [selectedContent, setSelectedContent] = useState(TABS.HEALING)

  // 힐링 스팟(로컬 저장)
  const [spots, setSpots] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [newSpot, setNewSpot] = useState({
    name: '',
    beforeEmotion: '',
    afterEmotion: '',
  })

  // 후기 (서버)
  const [posts, setPosts] = useState([])
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false)

  // 감정 히스토리(월별)
  const [selectedMonth, setSelectedMonth] = useState('')

  // 초기: spots 로컬에서 가져오기
  useEffect(() => {
    const savedSpots = JSON.parse(localStorage.getItem('spots') || '[]')
    setSpots(savedSpots)
  }, [])

  // spots 변경 시 로컬 저장
  useEffect(() => {
    localStorage.setItem('spots', JSON.stringify(spots))
  }, [spots])

  // 후기: 후기 탭을 처음 클릭했을 때만 서버 호출
  useEffect(() => {
    const loadMyPosts = async () => {
      if (selectedContent !== TABS.POSTS || hasLoadedPosts) return
      try {
        const res = await fetch(`${API_BASE}/my-posts`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch my posts')
        const data = await res.json()
        const mapped = (data || []).map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content ?? '',
          createdAt: p.created_at ?? null,
          author: p.author ?? '',
        }))
        setPosts(mapped)
        setHasLoadedPosts(true)
      } catch (err) {
        console.error(err)
      }
    }
    loadMyPosts()
  }, [selectedContent, hasLoadedPosts])

  // 힐링 기록 저장
  const handleSaveRecord = () => {
    if (
      !newSpot.name ||
      !newSpot.afterEmotion ||
      !newSpot.beforeEmotion ||
      !selectedDate
    )
      return
    const newDate = formatDate(selectedDate)
    const updated = [...spots, { ...newSpot, date: newDate }]
    setSpots(updated)
    setNewSpot({ name: '', beforeEmotion: '', afterEmotion: '' })
    setSelectedDate(null)
  }

  // 날짜순 정렬
  const sortedSpots = [...spots].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  // 감정 히스토리(라인 차트)
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
          (s) => emotionColors[s.afterEmotion]
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

  // 막대 차트용 월별 집계
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

      {/* 상단 프로필 (데모 값) */}
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
              <button
                className="withdraw-button"
                onClick={() => {
                  localStorage.clear()
                  setSpots([])
                  setPosts([])
                  setHasLoadedPosts(false)
                }}
              >
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
