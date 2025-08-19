const db = require('./mysql')

// ✅ 글 작성
exports.createPost = (req, res) => {
  const { title, content } = req.body
  const userId = req.user.id

  db.query(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content],
    (err, result) => {
      if (err) return res.status(500).send('DB Error')
      res.status(201).send({ postId: result.insertId })
    }
  )
}

// ✅ 전체 글 조회 (작성자 iduser 포함)
exports.getAllPosts = (req, res) => {
  const sql = `
    SELECT posts.*, users.iduser AS author
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('DB Error')
    res.send(results)
  })
}

// ✅ 특정 글 조회 (작성자 iduser 포함)
exports.getPostById = (req, res) => {
  const postId = req.params.id

  const sql = `
    SELECT posts.*, users.iduser AS author
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `
  db.query(sql, [postId], (err, results) => {
    if (err) return res.status(500).send('DB Error')
    if (results.length === 0) return res.status(404).send('Post not found')
    res.send(results[0])
  })
}

// ✅ 글 수정
exports.updatePost = (req, res) => {
  const postId = req.params.id
  const { title, content } = req.body
  const userId = req.user.id
  const userRole = req.user.role

  const query =
    userRole === 'admin'
      ? 'UPDATE posts SET title = ?, content = ? WHERE id = ?'
      : 'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?'

  const params =
    userRole === 'admin'
      ? [title, content, postId]
      : [title, content, postId, userId]

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error')
    if (result.affectedRows === 0) return res.status(403).send('No permission')
    res.send('Post updated')
  })
}

// ✅ 글 삭제
exports.deletePost = (req, res) => {
  const postId = req.params.id
  const userId = req.user.id
  const userRole = req.user.role

  const query =
    userRole === 'admin'
      ? 'DELETE FROM posts WHERE id = ?'
      : 'DELETE FROM posts WHERE id = ? AND user_id = ?'

  const params = userRole === 'admin' ? [postId] : [postId, userId]

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).send('DB Error')
    if (result.affectedRows === 0) return res.status(403).send('No permission')
    res.send('Post deleted')
  })
}

// 내가 작성한 후기 확인하기
exports.getMyPosts = (req, res) => {
  const userId = req.user.id // 세션에서 온 로그인 사용자 id

  const sql = `
    SELECT posts.*, users.iduser AS author
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.user_id = ?
    ORDER BY posts.created_at DESC
  `
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).send('DB Error')
    res.send(results)
  })
}
