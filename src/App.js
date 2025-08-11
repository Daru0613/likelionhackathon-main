import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Mainpage from './pages/Mainpage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FindAccount from './pages/Findaccount'
import BoardPage from './pages/BoardPage'
import PostDetailPage from './pages/PostDetailPage'
import EditPostPage from './pages/EditPostPage'
import DeletePostPage from './pages/DeletePostPage'
import EditCommentPage from './pages/EditCommentPage'
import MyPage from './pages/Mypage'
import Introduce from './pages/Introduce'

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Introduce />} />
          <Route path="/mainpage" element={<Mainpage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find" element={<FindAccount />} />
          <Route path="/boardpage" element={<BoardPage />} />
          <Route path="/editpostpage" element={<EditPostPage />} />
          <Route path="/postdetailpage" element={<PostDetailPage />} />
          <Route path="/deletepostpage" element={<DeletePostPage />} />
          <Route path="/editcommentpage" element={<EditCommentPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
