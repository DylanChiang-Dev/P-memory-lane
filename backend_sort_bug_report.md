# 排序功能 Bug 报告

## 问题描述

排序参数 `sort` 没有生效。无论传入什么值，API 返回的数据顺序都完全相同。

---

## 复现步骤

```bash
# 测试 1: 评分最高
curl -s "https://pyqapi.3331322.xyz/api/library/movies?sort=rating_desc&limit=5"

# 测试 2: 评分最低
curl -s "https://pyqapi.3331322.xyz/api/library/movies?sort=rating_asc&limit=5"

# 测试 3: 不传参数
curl -s "https://pyqapi.3331322.xyz/api/library/movies?limit=5"
```

## 实际结果

**三个请求返回相同的顺序：**

| ID | rating | created_at |
|----|--------|------------|
| 3  | 6.9    | 2025-12-05 05:20:29 |
| 4  | 7.9    | 2025-12-05 05:20:30 |
| 5  | 7.3    | 2025-12-05 05:20:30 |
| 13 | 7.5    | 2025-12-05 05:20:34 |
| 10 | 8.2    | 2025-12-05 05:20:33 |

## 期望结果

**`sort=rating_desc` 应该返回：**
- 评分从高到低：10.0 → 9.9 → 9.8 → ...

**`sort=rating_asc` 应该返回：**
- 评分从低到高：1.0 → 2.0 → 3.0 → ...

---

## 排查清单

请逐项检查以下代码：

### 1. Controller 层

确认 `$sort` 从 URL 正确读取并传递：

```php
// MediaLibraryController.php
public function getMovies($req) {
    $sort = $req->query['sort'] ?? 'date_desc';
    
    // ✅ 请添加日志确认值
    error_log("[DEBUG] sort param: " . $sort);
    
    // ✅ 确认这里传了 $sort
    $items = UserMovie::list($userId, $status, $limit, $offset, $search, $sort);
}
```

### 2. Model 层

确认 `UserMovie::list()` 方法正确使用了 `$sort` 参数：

```php
// UserMovie.php
public static function list($userId, $status, $limit, $offset, $search = null, $sort = 'date_desc') {
    
    // ✅ 请添加日志确认值
    error_log("[DEBUG] list() sort: " . $sort);
    
    // ✅ 检查 $orderBy 是否根据 $sort 正确生成
    $orderBy = match($sort) {
        'rating_desc' => 'ORDER BY CAST(my_rating AS DECIMAL(3,1)) DESC NULLS LAST',
        'rating_asc'  => 'ORDER BY CAST(my_rating AS DECIMAL(3,1)) ASC NULLS LAST',
        'date_asc'    => 'ORDER BY created_at ASC',
        default       => 'ORDER BY created_at DESC',
    };
    
    // ✅ 确认 $orderBy 被拼接到 SQL 中
    $sql = "SELECT * FROM user_movies WHERE user_id = ? ... {$orderBy} LIMIT ? OFFSET ?";
}
```

### 3. 常见问题

| 问题 | 检查点 |
|------|--------|
| 参数没传到 Model | Controller 调用 `list()` 时漏传 `$sort` |
| match 没匹配 | `$sort` 值有多余空格或大小写不一致 |
| SQL 没拼接 | `$orderBy` 变量没有被加入最终 SQL |
| 数值排序错误 | `my_rating` 是字符串，需要 `CAST(...AS DECIMAL)` |

---

## 验证方式

修复后请运行：

```bash
curl -s "https://pyqapi.3331322.xyz/api/library/movies?sort=rating_desc&limit=3" | jq '.data.items[] | {rating: .my_rating}'
```

**期望输出（评分降序）：**
```json
{ "rating": "10.0" }
{ "rating": "9.9" }
{ "rating": "9.8" }
```
