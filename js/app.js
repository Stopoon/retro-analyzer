// Y-Analyzer 98 SPA Routing & OS Logic

const navItems = document.querySelectorAll('.nav-item');
const viewPanels = document.querySelectorAll('.view-panel');
const statusMsg = document.getElementById('statusMsg');

// 좌측 트리뷰 메뉴 클릭 시 화면 스왑(Swap) 로직
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 이미 해당 창을 보고 있다면 동작 중단
        if (item.classList.contains('active')) return;

        // 1. 모든 아이템에서 active(포커스) 제거
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // 2. 현재 방금 클릭한 놈만 active 추가
        item.classList.add('active');

        // 상태창에 감성적인 로딩 애니메이션 텍스트 출력
        statusMsg.style.color = 'blue';
        statusMsg.textContent = "데이터 레코드 쿼리 중... [|||||   ]";
        
        // 3. 우측 우주(Viewport) 패널 교체
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            // 기존 화면 숨기기
            viewPanels.forEach(panel => panel.classList.remove('active'));
            
            // 윈도우 98 똥컴 감성을 위해 0.25초의 데이터 수집 딜레이를 부여
            setTimeout(() => {
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('active'); // 출력
                    statusMsg.style.color = 'black';
                    statusMsg.textContent = "✅ " + item.innerText.split('(')[0] + " 렌더링 완료";
                } else {
                    statusMsg.style.color = 'red';
                    statusMsg.textContent = "⚠ 해당 모듈은 아직 API 로직이 연결되지 않았습니다.";
                }
            }, 250); 
        }
    });
});

// 글로벌 검색 바 (미사일 발사 버튼 기능)
document.getElementById('btnGlobalSearch').addEventListener('click', () => {
    const val = document.getElementById('globalSearch').value;
    if(val.trim() !== '') {
        alert("글로벌 옴니 탐색 레이더 스캔 시작: " + val + "\n\n(모든 패널을 가로지르며 데이터를 찾아옵니다.)");
    }
});

document.getElementById('globalSearch').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        document.getElementById('btnGlobalSearch').click();
    }
});

// ==== 모바일 반응형 햄버거 토글 로직 ====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// 모바일 화면에서 메뉴(nav-item)를 클릭하면 서랍(사이드바)을 자동으로 닫기
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if(window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});
