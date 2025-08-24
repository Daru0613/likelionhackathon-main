import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import '../css/Navbar.css'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 로그인 상태 확인
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [location])

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem('userId')
    setIsLoggedIn(false)
    alert('로그아웃 되었습니다.')
    navigate('/login')
    setMenuOpen(false) // 모바일에서 닫히도록
  }

  // 메뉴 토글
  const toggleMenu = () => setMenuOpen((prev) => !prev)

  // 메뉴 닫기 (링크 클릭 시)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" onClick={closeMenu}>
          GoAI양
        </Link>
      </div>

      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-expanded={menuOpen}
      >
        ☰
      </button>

      {/* 태 반영: show 클래스 토글 */}
      <ul className={`navbar-links ${menuOpen ? 'show' : ''}`}>
        <li>
          <Link to="/boardpage" onClick={closeMenu}>
            커뮤니티
          </Link>
        </li>
        {isLoggedIn ? (
          <>
            <li>
              <Link to="/mypage" onClick={closeMenu}>
                마이페이지
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                로그아웃
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" onClick={closeMenu}>
              로그인/회원가입
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default Navbar
