(() => {
  // 이미 site-header 있으면 site-nav만 제거하고 종료
  const existing = document.querySelector('.site-header');
  if (existing) {
    const nav = existing.querySelector('.site-nav');
    if (nav) nav.remove();
    return;
  }

  // 경로 깊이에 따라 루트 경로 계산
  const depth = location.pathname.replace(/\/$/, '').split('/').length - 1;
  const root = depth <= 1 ? '/' : '../'.repeat(depth - 1);

  // 스타일 주입 (서비스 페이지에는 site-header CSS가 없으므로)
  const style = document.createElement('style');
  style.textContent = `
    .__sh{
      position:sticky;top:0;z-index:9000;
      padding:8px 16px;
      background:rgba(255,249,242,0.88);
      backdrop-filter:blur(14px);
      border-bottom:1px solid rgba(70,50,31,0.10);
      font-family:"SUIT",Arial,sans-serif;
    }
    .__sh-row{
      max-width:1160px;margin:0 auto;
      display:flex;align-items:center;justify-content:space-between;gap:12px;
    }
    .__sh-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .__sh a{text-decoration:none;color:#20170f;font-weight:700;font-size:13px;}
    .__sh-ghost{
      display:inline-flex;align-items:center;justify-content:center;
      min-height:38px;padding:0 14px;border-radius:999px;
      border:1px solid rgba(70,50,31,0.15);
      background:rgba(255,255,255,0.7);white-space:nowrap;
    }
    .__sh-cta{
      display:inline-flex;align-items:center;justify-content:center;
      min-height:38px;padding:0 16px;border-radius:999px;
      background:linear-gradient(180deg,#de8454,#ed6b2f);
      color:#fff !important;white-space:nowrap;
      box-shadow:0 6px 16px rgba(237,107,47,0.28);
    }
    @media(max-width:480px){
      .__sh-ghost:not(.__sh-keep){display:none;}
    }
  `;
  document.head.appendChild(style);

  const header = document.createElement('header');
  header.className = '__sh';
  header.innerHTML = `
    <div class="__sh-row">
      <a href="${root}">
        <img src="${root}assets/img/favicon.svg" alt="당고" style="height:34px;width:auto;display:block;" />
      </a>
      <div class="__sh-actions">
        <a class="__sh-ghost" href="${root}customer/dashboard.html">내 주문</a>
        <a class="__sh-ghost" href="${root}driver/apply.html">전문가 참여하기</a>
        <a class="__sh-cta __sh-keep" href="${root}services/">지금 접수하기</a>
      </div>
    </div>
  `;
  document.body.insertBefore(header, document.body.firstChild);
})();
