import React, { useState, useRef, useEffect } from 'react'
import '../css/Mainpage.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const abortControllerRef = useRef(null)
  const chatContainerRef = useRef(null) // chat-container 참조
  const bottomRef = useRef(null)

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setMessages((prev) => [...prev, { type: 'user', text }])
    setInput('')

    try {
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch('https://ai.goaiyang.site/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = res.headers.get('content-type') || ''
      const resClone = res.clone()

      if (!contentType.includes('application/json')) {
        const rawText = await resClone.text()
        throw new Error(
          `서버에서 JSON이 아닌 응답을 받았습니다. (원문: ${rawText})`
        )
      }

      let data
      try {
        data = await res.json()
      } catch {
        const rawText = await resClone.text()
        throw new Error(`JSON 파싱 실패 (원문 응답: ${rawText})`)
      }

      const botReply =
        data.bot_reply || '⚠ 감정을 이해하지 못했습니다. 다시 알려주세요.'

      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: botReply,
          places: Array.isArray(data.places) ? data.places : [],
        },
      ])
    } catch (err) {
      let errorMessage = '⚠ 서버 연결 실패. 서버가 켜져 있는지 확인하세요.'
      if (err.name === 'AbortError') {
        errorMessage = '⚠ 요청 시간이 초과되었습니다. 다시 시도하세요.'
      } else if (err.message) {
        errorMessage = `⚠ 오류: ${err.message}`
      }
      setMessages((prev) => [...prev, { type: 'bot', text: errorMessage }])
    }
  }

  // 메시지 추가될 때 chat-container 내부 스크롤 맨 아래로
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="app-wrapper">
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.type}`}>
            <div
              className={`${msg.type}-message`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {(msg.text || '')
                .replaceAll('\\n', '\n')
                .split('\n')
                .map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}

              {msg.places && msg.places.length > 0 && (
                <div className="places-container">
                  {msg.places.map((place, i) => (
                    <div key={i} className="place-card">
                      <h4 className="place-name">{place.name}</h4>
                      <p className="place-address">{place.address}</p>
                      <p className="place-phone">{place.phone}</p>
                      <a
                        href={place.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="place-button"
                      >
                        자세히 보기
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-section">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="오늘의 감정은 어떠신가요?"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
        />
        <button onClick={sendMessage}>전송</button>
      </div>
    </div>
  )
}

export default App
