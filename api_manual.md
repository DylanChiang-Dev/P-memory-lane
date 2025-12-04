# API 使用手册

本文档包含后端所有可用 API 的详细说明。

## 基础信息

- **Base URL**: `https://pyqapi.3331322.xyz`
- **认证方式**: Bearer Token
  - Header: `Authorization: Bearer {your_access_token}`
- **响应格式**: JSON

### 通用响应结构

**成功响应**:
```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误描述信息",
  "code": 400
}
```

---

## 1. 认证 (Auth)

### 登录
获取 Access Token 和 Refresh Token。

- **URL**: `/api/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": 1, "username": "..." },
      "access_token": "eyJ...",
      "refresh_token": "def...",
      "expires_in": 3600
    }
  }
  ```

### 刷新 Token
当 Access Token 过期时使用。

- **URL**: `/api/refresh-token`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "refresh_token": "def..."
  }
  ```

---

## 2. 博客 (Blog)

### 获取文章列表
- **URL**: `/api/blog/articles`
- **Method**: `GET`
- **Query Params**:
  - `page`: 页码 (默认 1)
  - `limit`: 每页数量 (默认 20)
  - `status`: `published` (默认) / `draft` (仅管理员)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "items": [ ... ],
      "pagination": { "total": 100, "page": 1, "limit": 20 }
    }
  }
  ```

### 获取文章详情
- **URL**: `/api/blog/articles/{id_or_slug}`
- **Method**: `GET`
- **Note**: 如果通过 Slug 获取，会自动增加浏览量（非管理员）。

### 增加浏览量
显式增加文章浏览量。

- **URL**: `/api/blog/articles/{id}/view`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "success": true,
    "data": { "view_count": 123 }
  }
  ```

### 创建文章 (Admin)
- **URL**: `/api/blog/articles`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "title": "文章标题",
    "content": "Markdown内容",
    "excerpt": "摘要",
    "slug": "article-slug",
    "status": "published", // or 'draft'
    "visibility": "public", // or 'private'
    "category_ids": [1],
    "tag_names": ["Tech", "Life"]
  }
  ```

### 更新文章 (Admin)
- **URL**: `/api/blog/articles/{id}`
- **Method**: `PUT`
- **Body**: 同创建文章。

### 删除文章 (Admin)
- **URL**: `/api/blog/articles/{id}`
- **Method**: `DELETE`

---

## 3. 媒体上传 (Media Upload)

### 上传文件
支持图片和视频。

- **URL**: `/api/media`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `files[]`: 文件对象 (支持多文件)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": 1,
          "url": "https://...",
          "filename": "image.jpg",
          "mime_type": "image/jpeg"
        }
      ]
    }
  }
  ```

---

## 4. 个人媒体库 (Media Library)

所有媒体库接口都需要认证。

### 4.1 电影 (Movies)

#### 获取列表
- **URL**: `/api/library/movies`
- **Method**: `GET`
- **Query**: `status` (watched/watching/want_to_watch), `page`, `limit`

#### 添加电影
- **URL**: `/api/library/movies`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "tmdb_id": 27205,
    "my_rating": 9.5,      // 0.0 - 10.0
    "my_review": "评价内容",
    "status": "watched",
    "release_date": "2010-07-16",
    "completed_date": "2024-01-15"
  }
  ```

#### 更新电影
- **URL**: `/api/library/movies/{id}`
- **Method**: `PUT`
- **Body**: 包含需要更新的字段。

#### 删除电影
- **URL**: `/api/library/movies/{id}`
- **Method**: `DELETE`

### 4.2 电视剧 (TV Shows)

#### 获取列表
- **URL**: `/api/library/tv-shows`
- **Method**: `GET`

#### 添加电视剧
- **URL**: `/api/library/tv-shows`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "tmdb_id": 1396,
    "my_rating": 9.8,
    "status": "watching",
    "current_season": 2,
    "current_episode": 5,
    "first_air_date": "2008-01-20"
  }
  ```

#### 更新进度
- **URL**: `/api/library/tv-shows/{id}/progress`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "current_season": 2,
    "current_episode": 6
  }
  ```

### 4.3 书籍 (Books)

#### 获取列表
- **URL**: `/api/library/books`
- **Method**: `GET`

#### 添加书籍
- **URL**: `/api/library/books`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "google_books_id": "abc12345",
    "isbn": "9787536692930",
    "my_rating": 9.0,
    "status": "read",
    "publication_date": "2008-01-01"
  }
  ```

### 4.4 游戏 (Games)

#### 获取列表
- **URL**: `/api/library/games`
- **Method**: `GET`

#### 添加游戏
- **URL**: `/api/library/games`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "rawg_id": 3328,
    "my_rating": 10.0,
    "platform": "Switch", // PC, PS5, Xbox, etc.
    "playtime_hours": 120,
    "status": "played"
  }
  ```

### 4.5 播客 (Podcasts)

#### 获取列表
- **URL**: `/api/library/podcasts`
- **Method**: `GET`

#### 添加播客
- **URL**: `/api/library/podcasts`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "podcast_id": "abc123",     // Listen Notes ID or custom ID
    "title": "播客标题",
    "host": "主播名",
    "rss_feed": "https://...",
    "my_rating": 9.0,
    "episodes_listened": 10,
    "total_episodes": 100,
    "status": "listening"       // listening/completed/dropped/plan_to_listen
  }
  ```

### 4.6 纪录片 (Documentaries)

#### 获取列表
- **URL**: `/api/library/documentaries`
- **Method**: `GET`

#### 添加纪录片
- **URL**: `/api/library/documentaries`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "tmdb_id": 12345,           // 使用TMDB作为数据源
    "my_rating": 8.5,
    "my_review": "评价内容",
    "status": "watched",         // want_to_watch/watching/watched
    "release_date": "2020-01-01",
    "completed_date": "2024-01-15"
  }
  ```

### 4.7 动画 (Anime)

#### 获取列表
- **URL**: `/api/library/anime`
- **Method**: `GET`

#### 添加动画
- **URL**: `/api/library/anime`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "anime_id": 9999,           // MyAnimeList or Anilist ID
    "my_rating": 10.0,
    "episodes_watched": 12,
    "total_episodes": 24,
    "status": "watching",        // watching/completed/dropped/plan_to_watch/on_hold
    "first_air_date": "2023-04-01"
  }
  ```

#### 更新观看进度
- **URL**: `/api/library/anime/{id}/progress`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "episodes_watched": 13
  }
  ```

---

## 5. 每日打卡 (Daily Activities)

### 打卡 (Check-in)
- **URL**: `/api/activities/checkin`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "activity_type": "exercise", // exercise, reading, duolingo
    "activity_date": "2024-12-03",
    "duration_minutes": 30,      // exercise/reading
    "pages_read": 50,            // reading only
    "xp_earned": 100,            // duolingo only
    "intensity": "high",         // exercise only (low/medium/high)
    "notes": "备注信息"
  }
  ```

### 获取热力图数据
- **URL**: `/api/activities/heatmap`
- **Method**: `GET`
- **Query**:
  - `type`: `exercise` / `reading` / `duolingo`
  - `year`: `2024`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      { "date": "2024-01-01", "value": 30, "intensity": "high" },
      ...
    ]
  }
  ```

### 获取统计数据
- **URL**: `/api/activities/stats`
- **Method**: `GET`
- **Query**: `type`, `year`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total_days": 150,
      "total_minutes": 4500,
      "current_streak": 5,
      "longest_streak": 20,
      "monthly_breakdown": [...]
    }
  }
  ```

### 获取某日打卡记录
- **URL**: `/api/activities/daily`
- **Method**: `GET`
- **Query**: `date` (YYYY-MM-DD)
