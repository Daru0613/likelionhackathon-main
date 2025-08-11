import React, { useState, useEffect, useRef } from 'react'
import '../css/Mainpage.css' // 스타일 따로 관리

const Mainpage = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const chatEndRef = useRef(null)

  const dummyEmotions = ['행복', '슬픔', '분노', '불안', '기쁨', '평온']
  const dummyPlaces = [
    {
      name: '한강공원',
      category: '자연',
      address: '서울시 강남구',
    },
    {
      name: '감성 카페 휴',
      category: '카페',
      address: '서울시 마포구',
    },
    {
      name: '마음챙김 명상센터',
      category: '힐링',
      address: '서울시 서초구',
    },
    {
      name: '책과 음악',
      category: '북카페',
      address: '서울시 종로구',
    },
  ]

  const getRandomItem = (array) =>
    array[Math.floor(Math.random() * array.length)]

  const sendMessage = () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])

    // 더미 응답 생성
    setTimeout(() => {
      const botMessage = {
        role: 'bot',
        content: `"${input}" 에 대한 감정을 분석했어요!`,
        emotion: getRandomItem(dummyEmotions),
        places: [getRandomItem(dummyPlaces), getRandomItem(dummyPlaces)],
      }
      setMessages((prev) => [...prev, botMessage])
    }, 500)

    setInput('')
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="app-wrapper">
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-wrapper ${
              msg.role === 'user' ? 'user' : 'bot'
            }`}
          >
            <div
              className={`${
                msg.role === 'user' ? 'user-message' : 'bot-message'
              }`}
            >
              {msg.content}
              {msg.emotion && (
                <div className="meta-info">
                  <p className="emotion">감정: {msg.emotion}</p>
                  {msg.places && msg.places.length > 0 && (
                    <ul className="place-list">
                      {msg.places.map((place, i) => (
                        <li key={i}>
                          {place.name} ({place.category}) - {place.address}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="input-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="기분을 말하거나 '감정 체크'라고 입력해보세요!"
        />
        <button onClick={sendMessage}>보내기</button>
      </div>
    </div>
  )
}

export default Mainpage
