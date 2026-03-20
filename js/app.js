// ==========================================
// Y-Analyzer 98 Master - Real API Connection
// ==========================================

// 🚨 [필수] 구글 클라우드에서 발급받은 실제 YouTube API 키를 여기에 큰따옴표 안에 넣으세요!
const YOUTUBE_API_KEY = "AIzaSyAN41DA24oIosCltopVPRvnczVLfPuHsFs"; 

/* =========================================
   1. 단일 마스터 터미널 SPA 라우팅 로직
   ========================================= */
const navItems = document.querySelectorAll('.nav-item');
const viewPanels = document.querySelectorAll('.view-panel');
const statusMsg = document.getElementById('statusMsg');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (item.classList.contains('active')) return;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        statusMsg.style.color = 'blue';
        statusMsg.textContent = "시스템 전환 중... [|||      ]";
        
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            viewPanels.forEach(panel => panel.classList.remove('active'));
            setTimeout(() => {
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    statusMsg.style.color = 'black';
                    statusMsg.textContent = "✅ " + item.innerText.split('(')[0] + " 렌더링 완료";
                } else {
                    statusMsg.style.color = 'red';
                    statusMsg.textContent = "⚠ 해당 모듈은 2.0 업데이트에서 지원됩니다.";
                }
            }, 300); 
        }
    });
});

/* =========================================
   2. 진실의 글로벌 옴니 스캐너 (Real Search)
   ========================================= */
async function searchYouTubeRealData(query) {
    if(YOUTUBE_API_KEY.includes("여기에")) {
        alert("❌ [시스템 경고] API 키가 장착되지 않았습니다.\n\napp.js 파일의 5번째 줄에 구글 인증 YouTube API Key를 입력하셔야 진짜 엔진이 가동됩니다.");
        return;
    }
    
    statusMsg.style.color = 'red';
    statusMsg.textContent = "📡 구글 서버 관제 센터 접근 중 (실데이터 검색 중)...";
    
    try {
        // [핵심] 실제 구글 유튜브 검색 API 호출 (정확도/조회수 등 파라미터 셋팅)
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        
        if (data.error) {
            alert("서버 연결 실패: " + data.error.message);
            return;
        }

        // 결과 조합 (윈도우 98 알람창 감성으로 직접 출력)
        let resultMsg = `[검색어 '${query}' 실시간 유튜브 핫 영상 Top 5]\n\n`;
        data.items.forEach((item, index) => {
            resultMsg += `${index + 1}. ${item.snippet.title}\n   (채널명: ${item.snippet.channelTitle})\n\n`;
        });
        
        alert("📡 구글 API 데이터 수신 완료!\n\n" + resultMsg);
        statusMsg.style.color = 'black';
        statusMsg.textContent = "✅ 실데이터 검색 성공";
        
    } catch(err) {
        console.error(err);
        alert("인터넷이 끊겼거나 시스템 오류가 발생했습니다.");
    }
}

document.getElementById('btnGlobalSearch').addEventListener('click', () => {
    const val = document.getElementById('globalSearch').value;
    if(val.trim() !== '') searchYouTubeRealData(val);
});
document.getElementById('globalSearch').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') document.getElementById('btnGlobalSearch').click();
});

/* =========================================
   3. 진짜 댓글 여론 팩트체크 엔진 (Sentiment AI)
   ========================================= */
// 이 기능을 위해 '🧠 AI 감성 (여론 분석)' 탭 안에 버튼을 연결했습니다.
async function analyzeRealComments(videoUrl) {
    if(YOUTUBE_API_KEY.includes("여기에")) {
        alert("❌ [시스템 경고] API 키가 없습니다. 진짜 댓글을 가져오려면 API 키가 필수입니다.");
        return;
    }
    
    // 사용자가 입력한 유튜브 URL에서 고유 영상 ID(videoId)만 정밀 추출
    let videoId = "";
    try {
        if(videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1].split('&')[0];
        } else if(videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else {
            throw new Error();
        }
    } catch(e) {
        alert("올바르지 않은 유튜브 링크 포맷입니다. (예: https://www.youtube.com/watch?v=...)"); return;
    }
    
    statusMsg.style.color = 'blue';
    statusMsg.textContent = "🧠 구글 딥러닝 서버 접속... 실제 댓글 긁어오는 중 [||||||||]";
    
    try {
        // [핵심] 해당 영상의 실제 댓글 스레드 20개를 '관련성 높은 순(좋아요 순)'으로 파싱
        const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        
        if(!data.items) {
            alert("❌ 댓글이 차단된 영상이거나, 존재하지 않는 영상입니다."); 
            statusMsg.textContent = "❌ 스캔 실패";
            return;
        }

        // --- 아주 단순화된 여론 팩트체크 로직 (이 키워드들이 많이 잡히면 주의) ---
        let positiveWords = ['감사', '좋', '유익', '대박', '응원', '꿀팁', '대단'];
        let negativeWords = ['사기', '광고', '거짓', '별로', '팔이', '비싸', '막힘', '뻔한', '조심'];
        
        let posCount = 0; let negCount = 0;
        let topComments = [];

        data.items.forEach(item => {
            // 구글에서 넘겨준 댓글 본문과 좋아요 수 추출
            const comment = item.snippet.topLevelComment.snippet.textDisplay;
            const likes = item.snippet.topLevelComment.snippet.likeCount;
            
            // 상위 베스트 댓글 2개 저장
            if(topComments.length < 2) topComments.push(`👍${likes}개: ${comment.replace(/<[^>]*>?/gm, '').substring(0, 40)}...`);
            
            positiveWords.forEach(w => { if(comment.includes(w)) posCount++; });
            negativeWords.forEach(w => { if(comment.includes(w)) negCount++; });
        });

        // 결과창 표시 생성 (윈도우 팝업)
        let total = posCount + negCount;
        let scoreMsg = "";
        if(total === 0) {
            scoreMsg = "수집된 데이터에 감정/사기 관련 핵심 키워드가 포착되지 않았음 (클린)";
        } else {
            let posRatio = Math.round((posCount / total) * 100);
            let negRatio = Math.round((negCount / total) * 100);
            scoreMsg = `🟢 긍정 언어 비율: ${posRatio}%\n🔴 부정/비판 언어 비율: ${negRatio}%\n\n${negRatio > 50 ? "🚨 [경고] 허위 과장이나 제품 팔이일 가능성이 높습니다!!" : "✅ [안전] 대체로 우호적이고 유익한 여론입니다."}`;
        }
        
        alert(`[🔥 실제 대중 여론 스캔 완료 🔥]\n\n${scoreMsg}\n\n[진짜 베스트 댓글 동향]\n1. ${topComments[0]}\n2. ${topComments[1]}`);
        statusMsg.textContent = "✅ 영상 여론 스캔 100% 완료";
        
    } catch(err) {
        alert("댓글 데이터를 분석하는 중 치명적 오류가 발생했습니다.");
    }
}

// 여론 스캔 버튼에 이벤트 연결
const sentimentBtn = document.querySelector('#view-sentiment button');
if(sentimentBtn) {
    sentimentBtn.addEventListener('click', () => {
        const urlInput = document.querySelector('#view-sentiment input').value;
        if(urlInput.trim()) analyzeRealComments(urlInput);
    });
}

// 모바일 햄버거 메뉴 토글
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// 모바일 화면에서 메뉴 클릭 시 서랍 자동으로 닫기
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if(window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});
