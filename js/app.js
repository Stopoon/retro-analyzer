// ==== YT Quant Terminal (Bloomberg Style Logic) ====

// DOM Elements
const apiModal = document.getElementById('apiModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const btnSaveKey = document.getElementById('btnSaveKey');
const modalError = document.getElementById('modalError');
const btnResetKey = document.getElementById('btnResetKey');
const btnClearCache = document.getElementById('btnClearCache');
const statusBar = document.getElementById('statusBar');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnExportCSV = document.getElementById('btnExportCSV');
const quickBtns = document.querySelectorAll('.menu-btn[data-query]');

// Mobile Menu Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Global View Data for CSV Export
let currentTableData = [];

// ==========================================
// 1. API Key Check & Modal Logic
// ==========================================
function getApiKey() { return localStorage.getItem('YT_QUANT_API_KEY'); }

function checkApiKey() {
    if (!getApiKey()) {
        apiModal.classList.add('active');
    } else {
        apiModal.classList.remove('active');
    }
}

btnSaveKey.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if(key.length < 20) {
        modalError.innerText = "유효한 API 키 형식이 아닙니다.";
        return;
    }
    localStorage.setItem('YT_QUANT_API_KEY', key);
    modalError.innerText = "";
    apiModal.classList.remove('active');
});

btnResetKey.addEventListener('click', () => {
    localStorage.removeItem('YT_QUANT_API_KEY');
    apiKeyInput.value = '';
    checkApiKey();
});

btnClearCache.addEventListener('click', () => {
    const key = getApiKey();
    localStorage.clear();
    if(key) localStorage.setItem('YT_QUANT_API_KEY', key); // 키는 보존
    updateStatus("로컬 캐시 메모리 초기화 완료.", "green");
});

// Init Check
checkApiKey();

// ==========================================
// 2. LocalStorage Caching Wrapper (TTL 1 Hour)
// ==========================================
async function fetchWithCache(cacheKey, url) {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
        const parsed = JSON.parse(cachedItem);
        // 1시간(3600000ms) 이내 데이터면 캐시 사용
        if (Date.now() - parsed.timestamp < 3600000) {
            console.log(`[CACHE HIT] ${cacheKey}`);
            return parsed.data;
        }
    }
    
    console.log(`[API CALL] ${cacheKey} fetching...`);
    const response = await fetch(url);
    const data = await response.json();
    
    if(data.error) throw new Error(data.error.message);
    
    // Save to Cache
    localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: data
    }));
    
    return data;
}

// ==========================================
// 3. UI Status & Mobile Logic
// ==========================================
function updateStatus(msg, color = "var(--neon-orange)") {
    statusBar.innerHTML = `> ${msg}`;
    statusBar.style.color = color;
}

// Mobile sidebar
mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
});
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});

// Format Numbers Tool
const fNum = (num) => new Intl.NumberFormat('ko-KR').format(num);
const fShort = (num) => num >= 10000 ? (num/10000).toFixed(1) + '만' : num;

// ==========================================
// 4. Core Feature 1: Quick Sector Research
// ==========================================
quickBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const query = btn.getAttribute('data-query');
        await renderQuickResearch(query);
        if(window.innerWidth <= 768) { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }
    });
});

async function renderQuickResearch(query) {
    const apiKey = getApiKey();
    if(!apiKey) { checkApiKey(); return; }
    
    updateStatus(`[${query}] 섹터 비디오 검색 중... [|||@@]`);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">데이터 연산 중...</td></tr>`;
    
    try {
        // 1. 영상 검색 (최대 10개)
        const cacheKeySearch = `SEARCH_${query}`;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=viewCount&key=${apiKey}`;
        const searchData = await fetchWithCache(cacheKeySearch, searchUrl);
        
        if(!searchData.items || searchData.items.length === 0) throw new Error("검색 결과 없음");
        
        const videoIds = searchData.items.map(i => i.id.videoId).join(',');
        const channelIds = [...new Set(searchData.items.map(i => i.snippet.channelId))].join(',');

        updateStatus(`[${query}] 비디오 스탯 및 채널 검증 데이터 파싱 중... [|||||@]`);
        
        // 2. 비디오 통계 추출 (조회수, 좋아요, 댓글)
        const cacheKeyVid = `VIDSTATS_${videoIds}`;
        const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
        const vidData = await fetchWithCache(cacheKeyVid, vidUrl);
        const vidMap = {};
        vidData.items.forEach(v => { vidMap[v.id] = v.statistics; });

        // 3. 채널 통계 추출 (구독자 수 대비 실질 매력도 판별을 위함)
        const cacheKeyCh = `CHSTATS_${channelIds}`;
        const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${apiKey}`;
        const chData = await fetchWithCache(cacheKeyCh, chUrl);
        const chMap = {};
        chData.items.forEach(c => { chMap[c.id] = c.statistics; });

        // 4. 활동성 지수 계산 및 떡상 연산
        let results = searchData.items.map(item => {
            const vidId = item.id.videoId;
            const chId = item.snippet.channelId;
            const vStats = vidMap[vidId] || {};
            const cStats = chMap[chId] || {};
            
            const views = parseInt(vStats.viewCount || 0);
            const likes = parseInt(vStats.likeCount || 0);
            const comments = parseInt(vStats.commentCount || 0);
            const subs = parseInt(cStats.subscriberCount || 0);
            
            // 활동성 지수 공식: ((좋아요 + 댓글) / 조회수) * 100
            const engagement = views > 0 ? (((likes + comments) / views) * 100).toFixed(2) : "0.00";
            
            return {
                thumb: item.snippet.thumbnails.high.url,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                subs: subs,
                views: views,
                likes: likes,
                comments: comments,
                engagement: parseFloat(engagement),
                videoId: vidId
            };
        });

        // 5. 활동성 지수(engagement) 내림차순 정렬
        results.sort((a, b) => b.engagement - a.engagement);
        
        // CSV 저장용 전역 데이터 매핑
        currentTableData = results;

        // 6. 렌더링
        drawTable(results);
        updateStatus(`[${query}] 스캔 완료. 총 ${results.length}개의 표본 객체 로드됨. (캐시 보호 상태)`, "var(--neon-green)");

    } catch(err) {
        console.error(err);
        updateStatus("ERROR: " + err.message, "var(--neon-red)");
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">호출 실패: ${err.message}</td></tr>`;
    }
}

// ==========================================
// 5. Core Feature 2: Channel Precise Validator
// ==========================================
btnSearch.addEventListener('click', () => runChannelValidator(searchInput.value));
searchInput.addEventListener('keypress', (e) => { if(e.key==='Enter') runChannelValidator(searchInput.value); });

async function runChannelValidator(query) {
    const val = query.trim();
    if(!val) return;
    const apiKey = getApiKey();
    if(!apiKey) { checkApiKey(); return; }

    updateStatus(`[${val}] 채널 추적 중... [||@@]`);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">분석 중...</td></tr>`;

    let handle = "";
    if (val.includes('youtube.com/') || val.includes('youtu.be/')) {
        const parts = val.split('/');
        handle = parts[parts.length-1];
        if(!handle.startsWith('@')) handle = '@' + handle;
    } else if (val.startsWith('@')) { handle = val; }

    try {
        let channel = null;

        if (handle) {
            const hData = await fetchWithCache(`CH_HANDLE_${handle}`, `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle.replace('@','')}&key=${apiKey}`);
            if(hData.items && hData.items.length > 0) channel = hData.items[0];
        }

        if (!channel) {
            const sqData = await fetchWithCache(`SCH_${val}`, `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(val)}&type=channel&maxResults=1&key=${apiKey}`);
            if(!sqData.items || sqData.items.length === 0) throw new Error("분석 대상을 찾을 수 없음");
            
            const statData = await fetchWithCache(`CH_STAT_${sqData.items[0].id.channelId}`, `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${sqData.items[0].id.channelId}&key=${apiKey}`);
            channel = statData.items[0];
        }

        const chId = channel.id;
        const subs = parseInt(channel.statistics.subscriberCount || 0);

        updateStatus(`[${channel.snippet.title}] 최근 10개 영상 통계 추출 중... [||||@]`);

        // 채널의 최신 영상 10개 검증 (가치 판독을 위함)
        const snData = await fetchWithCache(`CH_VIDS_${chId}`, `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${chId}&order=date&maxResults=10&type=video&key=${apiKey}`);
        
        if(!snData.items || snData.items.length === 0) throw new Error("업로드된 영상이 없습니다.");

        const videoIds = snData.items.map(i => i.id.videoId).join(',');
        const vStatData = await fetchWithCache(`VIDSTATS_${videoIds}`, `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`);
        
        const vidMap = {};
        vStatData.items.forEach(v => { vidMap[v.id] = v.statistics; });

        let results = snData.items.map(item => {
            const vStats = vidMap[item.id.videoId] || {};
            const views = parseInt(vStats.viewCount || 0);
            const likes = parseInt(vStats.likeCount || 0);
            const comments = parseInt(vStats.commentCount || 0);
            const engagement = views > 0 ? (((likes + comments) / views) * 100).toFixed(2) : "0.00";
            
            return {
                thumb: item.snippet.thumbnails.high.url,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                subs: subs, // 채널 1개의 구독자 고정
                views: views,
                likes: likes,
                comments: comments,
                engagement: parseFloat(engagement),
                videoId: item.id.videoId
            };
        });

        // 결과 정렬 (최신 10개이지만 우리는 철저히 활동성 및 조회수로 표기. 여기선 최신순 그대로 유지)
        currentTableData = results;
        drawTable(results);
        updateStatus(`[${channel.snippet.title}] 정밀 검증 스캔 완료.`, "var(--neon-green)");

    } catch(err) {
        console.error(err);
        updateStatus("ERROR: " + err.message, "var(--neon-red)");
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">호출 실패: ${err.message}</td></tr>`;
    }
}

// ==========================================
// 6. Table Renderer & Badges Logic
// ==========================================
function drawTable(data) {
    tableBody.innerHTML = '';
    
    // 평균 조회수 계산 (우량 채널 판별을 위함)
    const avgViews = data.length > 0 ? (data.reduce((sum, item) => sum + item.views, 0) / data.length) : 0;
    // 채널 단위 판별 (모든 영상 데이터가 같은 채널이라고 가정)
    const channelSubs = data[0].subs;
    const isBluechip = channelSubs > 0 && (avgViews / channelSubs) >= 0.05; // 평균 조회수가 구독자의 5% 이상

    data.forEach(row => {
        const engClass = row.engagement > 5 ? 'engage-high' : (row.engagement > 2 ? 'engage-mid' : 'engage-low');
        
        // 🚨 떡상 뱃지 계산 (단일 영상 조회수가 구독자 수의 100배 이상)
        // 단, 구독자가 너무 적은 아예 신생 채널 거름 (구독자 최소 1,000명 이상)
        const isViral = (channelSubs >= 100) && (row.views >= channelSubs * 100);

        let badgesHTML = '';
        if(isBluechip) badgesHTML += `<div class="badge bluechip">[우량 🟢] 상위 5% 실조회력</div>`;
        if(isViral) badgesHTML += `<div class="badge viral">[떡상 🚨] 폭발적 유입 알고리즘</div>`;
        if(!badgesHTML) badgesHTML = `<span style="color:var(--text-dim);font-size:11px;">(특이사항 없음)</span>`;

        tableBody.innerHTML += `
            <tr>
                <td class="td-thumb" data-label="썸네일">
                    <a href="https://youtube.com/watch?v=${row.videoId}" target="_blank">
                        <img src="${row.thumb}" alt="thumb">
                    </a>
                </td>
                <td class="td-title" data-label="제목 / 채널명">
                    <h4><a href="https://youtube.com/watch?v=${row.videoId}" target="_blank" style="color:#fff;text-decoration:none;">${row.title}</a></h4>
                    <p>@${row.channel}</p>
                </td>
                <td class="td-number" data-label="구독자 수">
                    ${fShort(row.subs)}명
                </td>
                <td class="td-number" data-label="조회 및 반응">
                    ${fNum(row.views)}회
                    <span class="sub-num">L: ${fShort(row.likes)} / C: ${fShort(row.comments)}</span>
                </td>
                <td class="td-number ${engClass}" data-label="활동성 지수(%)">
                    ${row.engagement}%
                </td>
                <td data-label="검증 뱃지">
                    <div class="badge-container">${badgesHTML}</div>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// 7. CSV Export Logic
// ==========================================
btnExportCSV.addEventListener('click', () => {
    if(currentTableData.length === 0) {
        alert("추출할 데이터가 없습니다. 먼저 검색을 실행하세요.");
        return;
    }
    
    // 헤더
    let csvContent = "\uFEFF썸네일,영상제목,채널명,구독자수,조회수,좋아요,댓글,활동성지수(%)\n";
    
    currentTableData.forEach(row => {
        // 따옴표 방지 이스케이핑
        let title = row.title.replace(/"/g, '""');
        csvContent += `"${row.thumb}","${title}","${row.channel}",${row.subs},${row.views},${row.likes},${row.comments},${row.engagement}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "YT_Quant_Export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
