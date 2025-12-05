# 后端 API 需求文档：媒体库搜索与排序功能

## 概述

为所有媒体库列表接口 (`/api/library/{type}`) 添加搜索和排序功能支持。

---

## 影响的接口

| 接口 | 方法 |
|------|------|
| `/api/library/movies` | GET |
| `/api/library/tv-shows` | GET |
| `/api/library/books` | GET |
| `/api/library/games` | GET |
| `/api/library/podcasts` | GET |
| `/api/library/documentaries` | GET |
| `/api/library/anime` | GET |

---

## 新增查询参数

### 1. `search` - 搜索关键词

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `search` | string | 否 | 搜索关键词，匹配标题字段 |

**搜索逻辑：**
- 搜索应匹配 `my_review` 字段中包含的标题信息（如果有单独的 `title` 字段则也应匹配）
- 使用 **模糊匹配**（SQL `LIKE '%keyword%'`）
- 搜索应该 **不区分大小写**
- 空字符串或不传时，不进行过滤

**示例：**
```
GET /api/library/movies?search=朗读者
```

---

### 2. `sort` - 排序方式

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sort` | string | 否 | 排序方式，默认 `date_desc` |

**支持的排序值：**

| 值 | 说明 | SQL 排序 |
|----|------|----------|
| `date_desc` | 最新添加（默认） | `ORDER BY created_at DESC` |
| `date_asc` | 最早添加 | `ORDER BY created_at ASC` |
| `completed_desc` | 最近观看/完成 | `ORDER BY completed_date DESC NULLS LAST` |
| `completed_asc` | 最早观看/完成 | `ORDER BY completed_date ASC NULLS LAST` |
| `rating_desc` | 评分最高 | `ORDER BY my_rating DESC NULLS LAST` |
| `rating_asc` | 评分最低 | `ORDER BY my_rating ASC NULLS LAST` |

> **注意：** `NULLS LAST` 确保空值排在最后，避免空评分或空日期干扰排序结果。

**示例：**
```
GET /api/library/movies?sort=rating_desc
GET /api/library/movies?page=1&limit=20&sort=completed_desc&search=科幻
```

---

## 完整请求示例

### 请求
```http
GET /api/library/movies?page=1&limit=20&status=watched&sort=rating_desc&search=朗读者
Authorization: Bearer {access_token}
```

### 响应（无变化）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 10,
        "user_id": 1,
        "tmdb_id": 8055,
        "my_rating": "8.2",
        "my_review": "...",
        "status": "watched",
        "release_date": null,
        "completed_date": "2025-08-23",
        "created_at": "2025-12-05 05:20:33",
        "updated_at": "2025-12-05 05:20:33"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

---

## 实现优先级

1. **P0（必须）**: `sort` 参数 - `date_desc`, `rating_desc`, `rating_asc`
2. **P1（重要）**: `search` 参数
3. **P2（可选）**: `completed_desc`, `completed_asc`, `date_asc`

---

## 前端已准备就绪

前端代码已经实现了传递这些参数的逻辑，后端实现后前端无需任何修改即可生效。

**前端传参代码参考：**
```typescript
let url = `/api/library/${apiType}?page=${page}&limit=${limit}`;
if (sort) {
    url += `&sort=${sort}`;
}
if (search) {
    url += `&search=${encodeURIComponent(search)}`;
}
```

---

## 测试用例

| 测试场景 | 请求 | 预期结果 |
|----------|------|----------|
| 默认排序 | `GET /api/library/movies?page=1&limit=20` | 按 `created_at DESC` 排序 |
| 评分最高 | `GET /api/library/movies?sort=rating_desc` | 评分 10.0 的排在最前 |
| 评分最低 | `GET /api/library/movies?sort=rating_asc` | 评分最低的排在最前，空评分排最后 |
| 搜索 | `GET /api/library/movies?search=朗读者` | 只返回标题包含"朗读者"的电影 |
| 组合 | `GET /api/library/movies?search=科幻&sort=rating_desc` | 搜索"科幻"并按评分降序 |
