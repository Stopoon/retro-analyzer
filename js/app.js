// ==== Modern YT Analyzer JS Logic ====
// UI/UX 상태 관리 및 라우팅 로직 제어

// 1. DOM Elements
const menuItems = document.querySelectorAll('.main-menu .menu-item:not(.disabled)');
const contentPanels = document.querySelectorAll('.content-panel');
const titleText = document.getElementById('current-panel-title');
const topbarFilters = document.getElementById('topbar-filters');
const btnAnalyze = document.getElementById('btnAnalyze');
const urlInput = document.getElementById('channelUrlInput');
const analyzerEmpty = document.getElementById('analyzer-empty');
const analyzerResult = document.getElementById('analyzer-result');
const btnToggleFav = document.getElementById('btnToggleFav');
const favListElem = document.getElementById('favorites-list');
const emptyFavMsg = document.getElementById('empty-fav-msg');

// 모바일 제어용
const btnMobileToggle = document.getElementById('mobileToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// 메모리(상태) 데이터
let favorites = []; // { id, name } 보관 배열
let currentAnalyzedChannel = null;

// ============================================
// 1. SPA 라우팅 네비게이션
// ============================================
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 버튼 로직 - 시각적 active 갱신 (빨간 우측 보더)
        menuItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // 제목 변경
        titleText.innerText = item.childNodes[0].nodeValue.trim();

        // 필터바 표출 통제 (트렌드 대시보드일때만 보이기)
        const targetId = item.getAttribute('data-target');
        if(targetId === 'panel-dashboard') {
            topbarFilters.classList.remove('hidden');
        } else {
            topbarFilters.classList.add('hidden');
        }

        // 화면 패널 교체
        contentPanels.forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(targetId);
        if(targetPanel) {
            targetPanel.classList.add('active');
        }

        // 모바일일 경우 전환 후 사이드바 강제 닫기
        if(window.innerWidth <= 768) {
            closeMobileSidebar();
        }
    });
});

// ============================================
// 2. 모바일 서랍메뉴 (Drawer) 컨트롤 로직
// ============================================
btnMobileToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
});

function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}
sidebarOverlay.addEventListener('click', closeMobileSidebar);


// ============================================
// 3. 트렌드 히트맵 페이크 렌더링 (7 x 6)
// ============================================
const heatmapGrid = document.getElementById('heatmapGrid');
if(heatmapGrid) {
    // 42개 네모 박스 랜덤 농도 박기
    for(let i=0; i<42; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell level-' + (Math.floor(Math.random() * 4) + 1);
        heatmapGrid.appendChild(cell);
    }
}

// ============================================
// 4. 채널 분석기 동작 로직
// ============================================
function runAnalysis() {
    const val = urlInput.value.trim();
    if(!val) return;
    
    // 분석기 버튼 로딩 UI화
    btnAnalyze.innerText = "분석 중...";
    btnAnalyze.disabled = true;

    // 가짜 딜레이 후 렌더링
    setTimeout(() => {
        btnAnalyze.innerText = "분석하기";
        btnAnalyze.disabled = false;

        // 화면 교체
        analyzerEmpty.style.display = 'none';
        analyzerResult.style.display = 'block';

        // Mock 데이터로 가짜 채널 매핑
        const channelName = val.includes('@') ? val.replace('@','') : "검색된채널명";
        document.getElementById('resName').innerText = channelName.toUpperCase();
        document.getElementById('resAvatar').innerText = channelName.charAt(0).toUpperCase();
        
        currentAnalyzedChannel = {
            id: val,
            name: channelName.toUpperCase()
        };

        // 즐겨찾기 버튼 상태 초기화(이미 등록된 채널인지 파악)
        const isFaved = favorites.some(f => f.id === currentAnalyzedChannel.id);
        updateFavBtnUI(isFaved);

    }, 800); // 0.8s 딜레이
}

btnAnalyze.addEventListener('click', runAnalysis);
urlInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') runAnalysis();
});

// ============================================
// 5. 사이드바 즐겨찾기 연동 로직
// ============================================
// 분석기 화면 내 버튼 클릭 이벤트
btnToggleFav.addEventListener('click', () => {
    if(!currentAnalyzedChannel) return;

    const existIdx = favorites.findIndex(f => f.id === currentAnalyzedChannel.id);
    
    if(existIdx >= 0) {
        // 제거 로직
        favorites.splice(existIdx, 1);
        updateFavBtnUI(false);
    } else {
        // 추가 로직 (10개 방어선)
        if(favorites.length >= 10) {
            alert("즐겨찾기는 최대 10개까지만 등록 가능합니다.");
            return;
        }
        favorites.push(currentAnalyzedChannel);
        updateFavBtnUI(true);
    }
    
    renderFavoritesSidebar();
});

function updateFavBtnUI(isFaved) {
    if(isFaved) {
        btnToggleFav.innerHTML = "★ 즐겨찾기됨";
        btnToggleFav.classList.add('faved');
    } else {
        btnToggleFav.innerHTML = "☆ 즐겨찾기";
        btnToggleFav.classList.remove('faved');
    }
}

// 즐겨찾기 배열을 루프 돌아 사이드바에 <ul><li> 렌더링
function renderFavoritesSidebar() {
    favListElem.innerHTML = '';
    
    if(favorites.length === 0) {
        emptyFavMsg.style.display = 'block';
    } else {
        emptyFavMsg.style.display = 'none';
        
        favorites.forEach(user => {
            const li = document.createElement('li');
            li.className = 'fav-item';
            li.innerHTML = `
                <span>★ ${user.name}</span>
                <button class="btn-remove" data-id="${user.id}">×</button>
            `;
            
            // 삭제(X) 버튼 클릭 누수 처리
            const removeBtn = li.querySelector('.btn-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // li 자체 클릭 방지
                removeFromFavorites(user.id);
            });
            
            // 항목 자체 클릭 -> 채널 분석기 탭 띄우기
            li.addEventListener('click', () => {
                urlInput.value = user.id; // 주소 다시치고
                // 탭 강제이동 로직 트리거
                document.querySelector('[data-target="panel-analyzer"]').click();
                runAnalysis(); // 재분석기능
            });

            favListElem.appendChild(li);
        });
    }
}

// 특정 X버튼을 눌렀을 때 배열에서 빼고 화면 지우는 헬퍼
function removeFromFavorites(targetId) {
    favorites = favorites.filter(f => f.id !== targetId);
    
    // 만약 지운 놈이 "방금 조회화면에 띄워둔" 놈이라면, 버튼 별표도 꺼줘야함.
    if(currentAnalyzedChannel && currentAnalyzedChannel.id === targetId) {
        updateFavBtnUI(false);
    }
    renderFavoritesSidebar();
}
