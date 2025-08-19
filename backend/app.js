// .env 파일에서 환경변수 로드
require('dotenv').config({ path: __dirname + '/.env' })

// 필요한 라이브러리 import
const express = require('express')
const cors = require('cors') // React 앱과 연결하기
const bcrypt = require('bcrypt') // 비밀번호 해싱
const session = require('express-session') // 세션 관리
const pool = require('./mysql') // MySQL 연결
const transporter = require('./mailer') // nodemailer 설정
const path = require('path')
const { isAuthenticated } = require('./auth') // auth.js에서 isAuthenticated 함수 임포트

const app = express()
const port = 3001

// CORS 설정 (react 앱에서 API 호출을 위해 사용)
app.use(
  cors({
    origin: 'https://goaiyang.site', // 허용할 도메인
    credentials: true, // 쿠키 허용 여부
  })
)

app.use(express.json())

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET, // 세션 암호화 키
    resave: false, // 세션 변경 없으면 저장 안 함
    saveUninitialized: true, // 초기화되지 않은 세션 저장
    cookie: { secure: false }, // HTTPS가 아니면 false
  })
)

// 인증코드 생성 함수
function generateCode(length = 6) {
  return Math.random()
    .toString()
    .slice(2, 2 + length)
}

// 인증코드 유효시간(3분) 체크 함수
function isCodeValid(sessionKey, req) {
  const now = Date.now()
  const codeTime = req.session[sessionKey + 'Time']
  return codeTime && now - codeTime < 3 * 60 * 1000
}

// [이메일 인증] 인증코드 발송 라우트
app.post('/api/send-verification', async (req, res) => {
  console.log('send-verification 진입')
  const { email } = req.body
  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' })

  const code = generateCode(6) // 인증코드 생성
  req.session.emailCode = code
  req.session.emailTarget = email
  req.session.emailCodeTime = Date.now()
  req.session.emailVerified = false

  // 메일 옵션 설정
  const mailOptions = {
    from: process.env.EMAIL_USER, // 보내는 사람
    to: email, // 받는 사람
    subject: '이메일 인증코드',
    text: `인증코드는 ${code} 입니다.`,
  }

  try {
    // nodemailer로 메일 전송
    const info = await transporter.sendMail(mailOptions)
    res.json({ message: '인증코드가 발송되었습니다.' })
  } catch (err) {
    console.error('메일 발송 에러:', err)
    res.status(500).json({ error: '메일 발송 실패: ' + err.message })
  }
})

// [이메일 인증] 인증코드 검증 라우트
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body
  // 세션에 저장된 값과 비교
  if (
    req.session.emailCode &&
    req.session.emailTarget === email &&
    req.session.emailCode === code &&
    isCodeValid('emailCode', req)
  ) {
    req.session.emailVerified = true
    res.json({ message: '이메일 인증 성공' })
  } else if (!isCodeValid('emailCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// [회원가입] 처리 라우트
app.post('/api/signup', async (req, res) => {
  const { iduser, userpw, email, name } = req.body
  if (!iduser || !userpw || !email || !name) {
    return res
      .status(400)
      .json({ error: 'ID, 비밀번호, 이메일, 이름을 입력하시오.' })
  }
  try {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(userpw, 10)
    const query =
      'INSERT INTO users (iduser, userpw, email, name) VALUES (?, ?, ?, ?)'
    pool.query(query, [iduser, hashedPassword, email, name], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'ID가 중복되었습니다.' })
        }
        return res.status(500).json({ error: 'DB 오류: ' + err.message })
      }
      // 인증 세션 삭제
      delete req.session.emailVerified
      delete req.session.emailTarget
      delete req.session.emailCode
      delete req.session.emailCodeTime
      res.status(201).json({ message: '회원가입 완료', redirect: '/login' })
    })
  } catch (err) {
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

// [로그인] 처리 라우트
app.post('/api/login', (req, res) => {
  console.log('login 진입')
  const { iduser, userpw } = req.body
  if (!iduser || !userpw) {
    return res.status(400).json({ error: 'ID와 비밀번호를 입력하시오.' })
  }
  const query = 'SELECT * FROM users WHERE iduser = ?'
  pool.query(query, [iduser], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'DB 오류: ' + err.message })
    }
    if (results.length === 0) {
      return res.status(401).json({ error: '존재하지 않는 ID입니다.' })
    }
    const user = results[0]
    // 비밀번호 비교
    const match = await bcrypt.compare(userpw, user.userpw)
    if (!match) {
      return res.status(401).json({ error: '비밀번호가 틀렸습니다.' })
    }
    // 세션에 사용자 정보 저장
    req.session.user = { iduser: user.iduser, id: user.id }
    res.status(200).json({ message: '로그인 성공', iduser: user.iduser })
  })
})

// [비밀번호 찾기] 인증코드 발송
app.post('/api/send-reset-code', async (req, res) => {
  const { iduser, email } = req.body
  if (!iduser || !email)
    return res.status(400).json({ error: 'ID와 이메일을 모두 입력하세요.' })
  pool.query(
    'SELECT * FROM users WHERE iduser = ? AND email = ?',
    [iduser, email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'DB 오류: ' + err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '일치하는 계정이 없습니다.' })
      // 인증코드 생성 및 세션 저장
      const code = generateCode(6)
      req.session.resetId = iduser
      req.session.resetEmail = email
      req.session.resetCode = code
      req.session.resetCodeTime = Date.now()
      req.session.resetVerified = false
      // 메일 발송
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '비밀번호 재설정 인증코드',
        text: `비밀번호 재설정 인증코드는 ${code} 입니다.`,
      }
      try {
        await transporter.sendMail(mailOptions)
        res.json({ message: '인증코드가 발송되었습니다.' })
      } catch (err) {
        console.error('메일 발송 에러:', err)
        res.status(500).json({ error: '메일 발송 실패: ' + err.message })
      }
    }
  )
})

// [비밀번호 찾기] 인증코드 확인
app.post('/api/verify-reset-code', (req, res) => {
  const { iduser, email, code } = req.body
  if (
    req.session.resetId === iduser &&
    req.session.resetEmail === email &&
    req.session.resetCode === code &&
    isCodeValid('resetCode', req)
  ) {
    req.session.resetVerified = true
    delete req.session.resetCode
    delete req.session.resetCodeTime
    res.json({ message: '인증 성공' })
  } else if (!isCodeValid('resetCode', req)) {
    res
      .status(400)
      .json({ error: '인증코드가 만료되었습니다. 재발송 해주세요.' })
  } else {
    res.status(400).json({ error: '인증코드가 일치하지 않습니다.' })
  }
})

// [비밀번호 찾기] 비밀번호 재설정
app.post('/api/reset-password', async (req, res) => {
  const { iduser, email, newPassword } = req.body
  if (
    !req.session.resetVerified ||
    req.session.resetId !== iduser ||
    req.session.resetEmail !== email
  ) {
    return res.status(400).json({ error: '이메일 인증이 필요합니다.' })
  }
  try {
    // 새 비밀번호 해싱
    const hashed = await bcrypt.hash(newPassword, 10)
    pool.query(
      'UPDATE users SET userpw = ? WHERE iduser = ? AND email = ?',
      [hashed, iduser, email],
      (err) => {
        if (err)
          return res.status(500).json({ error: 'DB 오류: ' + err.message })
        // 인증 관련 세션 삭제
        delete req.session.resetId
        delete req.session.resetEmail
        delete req.session.resetVerified
        res.json({
          message: '비밀번호가 성공적으로 변경되었습니다.',
          redirect: '/',
        })
      }
    )
  } catch (err) {
    res.status(500).json({ error: '서버 오류: ' + err.message })
  }
})

// 댓글 및 게시글 라우터 추가
const unifiedRouter = require('./routes.js')

app.use('/api', unifiedRouter) // 모든 라우팅을 /api 하위에서 처리

// 사용자 정보 조회 API 수정 (iduser 문자열 기준, isAuthenticated 적용)
app.get('/api/users/:iduser', isAuthenticated, (req, res) => {
  const iduser = req.params.iduser
  const query = 'SELECT iduser, email FROM users WHERE iduser = ?'
  pool.query(query, [iduser], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.status(404).json({ error: '사용자 없음' })
    res.json(results[0])
  })
})

// 힐링 기록 조회 (healing_calendar)
app.get('/api/healing-calendar/:iduser', isAuthenticated, (req, res) => {
  const iduser = req.params.iduser
  pool.query(
    'SELECT id FROM users WHERE iduser = ?',
    [iduser],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '사용자 없음' })
      const userId = results[0].id

      const query = `
        SELECT pk AS id, record_date, place, emotion_prev, emotion_next 
        FROM healing_calendar WHERE user_id = ? ORDER BY record_date ASC
      `
      pool.query(query, [userId], (err, records) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json(records)
      })
    }
  )
})

// 내가 작성한 후기 조회
app.get('/api/my-posts/:iduser', isAuthenticated, (req, res) => {
  const iduser = req.params.iduser
  pool.query(
    'SELECT id FROM users WHERE iduser = ?',
    [iduser],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '사용자 없음' })
      const userId = results[0].id

      const query = `
        SELECT id, title, content, created_at, updated_at 
        FROM posts WHERE user_id = ? ORDER BY created_at DESC
      `
      pool.query(query, [userId], (err, posts) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json(posts)
      })
    }
  )
})

// 힐링 기록 저장 API
app.post('/api/healing-calendar', isAuthenticated, (req, res) => {
  const userId = req.session.user?.id
  if (!userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }

  const { place, record_date, emotion_prev, emotion_next } = req.body
  if (!place || !record_date || !emotion_prev || !emotion_next) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
  }

  const query =
    'INSERT INTO healing_calendar (user_id, place, record_date, emotion_prev, emotion_next) VALUES (?, ?, ?, ?, ?)'
  pool.query(
    query,
    [userId, place, record_date, emotion_prev, emotion_next],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: '힐링 기록 저장 완료', id: result.insertId })
    }
  )
})

// 힐링 기록 수정 API (PUT)
app.put('/api/healing-calendar/:id', isAuthenticated, (req, res) => {
  const id = req.params.id
  const userId = req.session.user?.id
  if (!userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }

  const { place, record_date, emotion_prev, emotion_next } = req.body
  if (!place || !record_date || !emotion_prev || !emotion_next) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' })
  }

  // 자신이 생성한 기록만 수정 가능하도록 검증
  const checkQuery = 'SELECT user_id FROM healing_calendar WHERE pk = ?'
  pool.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.status(404).json({ error: '기록을 찾을 수 없습니다.' })
    if (results[0].user_id !== userId)
      return res.status(403).json({ error: '권한이 없습니다.' })

    const updateQuery = `
      UPDATE healing_calendar
      SET place = ?, record_date = ?, emotion_prev = ?, emotion_next = ?
      WHERE pk = ?
    `

    pool.query(
      updateQuery,
      [place, record_date, emotion_prev, emotion_next, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json({ message: '힐링 기록 수정 완료' })
      }
    )
  })
})

// 힐링 기록 삭제 API (DELETE)
app.delete('/api/healing-calendar/:id', isAuthenticated, (req, res) => {
  const id = req.params.id
  const userId = req.session.user?.id
  if (!userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' })
  }

  // 자신이 생성한 기록만 삭제 가능하도록 검증
  const checkQuery = 'SELECT user_id FROM healing_calendar WHERE pk = ?'
  pool.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.status(404).json({ error: '기록을 찾을 수 없습니다.' })
    if (results[0].user_id !== userId)
      return res.status(403).json({ error: '권한이 없습니다.' })

    const deleteQuery = 'DELETE FROM healing_calendar WHERE pk = ?'
    pool.query(deleteQuery, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: '힐링 기록 삭제 완료' })
    })
  })
})

// 회원 탈퇴 API (iduser 기준, 본인인증, 연관 삭제)
app.delete('/api/users/:iduser', isAuthenticated, (req, res) => {
  const iduser = req.params.iduser

  if (!req.session.user || req.session.user.iduser !== iduser) {
    return res.status(401).json({ error: '본인 계정만 탈퇴 가능합니다.' })
  }

  pool.query(
    'SELECT id FROM users WHERE iduser = ?',
    [iduser],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      if (results.length === 0)
        return res.status(404).json({ error: '사용자 없음' })
      const userId = results[0].id

      pool.query('DELETE FROM posts WHERE user_id = ?', [userId], (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: '게시글 삭제 에러: ' + err.message })

        pool.query(
          'DELETE FROM healing_calendar WHERE user_id = ?',
          [userId],
          (err) => {
            if (err)
              return res
                .status(500)
                .json({ error: '힐링 기록 삭제 에러: ' + err.message })

            pool.query('DELETE FROM users WHERE id = ?', [userId], (err) => {
              if (err)
                return res
                  .status(500)
                  .json({ error: '회원 탈퇴 에러: ' + err.message })

              req.session.destroy(() => {
                res.json({ message: '회원 탈퇴 성공' })
              })
            })
          }
        )
      })
    }
  )
})

// 정적 파일 제공 (React 빌드 파일)
app.use(express.static(path.join(__dirname, '../build')))

// 서버 시작
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
