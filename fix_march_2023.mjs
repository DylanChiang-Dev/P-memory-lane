// Node.js 腳本 - 修復 2023年3月電影日期
// 在終端運行: node fix_march_2023.mjs

const API_BASE = ''; // 本地開發用空字符串
const TOKEN = process.argv[2]; // 從命令行參數獲取 token

if (!TOKEN) {
    console.error('❌ 請提供 access_token 作為參數');
    console.error('用法: node fix_march_2023.mjs YOUR_ACCESS_TOKEN');
    console.error('');
    console.error('獲取 token: 在瀏覽器控制台運行 localStorage.getItem("access_token")');
    process.exit(1);
}

async function main() {
    console.log('🔍 開始掃描所有電影...');

    // 1. 獲取所有電影
    let allMovies = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `http://localhost:4321/api/library/movies?page=${page}&limit=100`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!res.ok) {
            console.error(`❌ API 錯誤: ${res.status} ${res.statusText}`);
            process.exit(1);
        }

        const json = await res.json();
        const items = json.data?.items || [];

        if (items.length === 0) {
            hasMore = false;
        } else {
            allMovies = [...allMovies, ...items];
            console.log(`📄 已加載 ${allMovies.length} 部電影 (第 ${page} 頁)...`);
            page++;
        }
    }

    console.log(`✅ 總共 ${allMovies.length} 部電影`);

    // 2. 篩選 2023年3月的電影
    const march2023Movies = allMovies.filter(m => {
        if (!m.completed_date) return false;
        return m.completed_date.startsWith('2023-03');
    });

    console.log(`🎯 發現 ${march2023Movies.length} 部需要修復的電影`);

    if (march2023Movies.length === 0) {
        console.log('✅ 沒有需要修復的電影！');
        return;
    }

    // 3. 批量修復
    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < march2023Movies.length; i++) {
        const movie = march2023Movies[i];

        try {
            // 生成隨機日期
            let newDate;
            if (movie.release_date) {
                const releaseDate = new Date(movie.release_date);
                const oneYearLater = new Date(releaseDate);
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                const randomTime = releaseDate.getTime() + Math.random() * (oneYearLater.getTime() - releaseDate.getTime());
                newDate = new Date(randomTime).toISOString().split('T')[0];
            } else {
                const year = 2010 + Math.floor(Math.random() * 13);
                const month = 1 + Math.floor(Math.random() * 12);
                const day = 1 + Math.floor(Math.random() * 28);
                newDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            // 發送更新請求
            const res = await fetch(`http://localhost:4321/api/library/movies/${movie.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed_date: newDate })
            });

            if (res.ok) {
                fixed++;
                if (fixed % 50 === 0 || fixed === march2023Movies.length) {
                    console.log(`⏳ 進度: ${fixed}/${march2023Movies.length} (${Math.round(fixed / march2023Movies.length * 100)}%)`);
                }
            } else {
                failed++;
                console.warn(`❌ 修復失敗: ID=${movie.id}, 狀態=${res.status}`);
            }

            // 小延遲
            await new Promise(r => setTimeout(r, 20));

        } catch (err) {
            failed++;
            console.error(`❌ 錯誤: ID=${movie.id}`, err.message);
        }
    }

    console.log('');
    console.log('===================================');
    console.log(`🎉 完成！成功修復 ${fixed} 部，失敗 ${failed} 部`);
    console.log('請刷新頁面查看結果');
    console.log('===================================');
}

main().catch(console.error);
