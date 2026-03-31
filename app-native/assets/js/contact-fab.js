(function () {
  if (document.querySelector(".contact-fab")) return;

  const phone = "01075416143";
  const smsBody = encodeURIComponent("안녕하세요. 당고 문의드립니다.");
  const isHome = document.body?.dataset?.analyticsPage === "home";

  const style = document.createElement("style");
  style.textContent = `
    .contact-fab {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      align-items: flex-end;
    }
    .contact-fab__link {
      pointer-events: auto;
      min-width: 56px;
      min-height: 56px;
      padding: 9px 11px;
      border-radius: 18px;
      border: 1px solid rgba(63, 48, 32, 0.12);
      background: rgba(255, 250, 243, 0.96);
      color: #2a211b;
      box-shadow: 0 16px 34px rgba(86, 61, 35, 0.14);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-decoration: none;
      backdrop-filter: blur(10px);
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .contact-fab__link:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 36px rgba(86, 61, 35, 0.18);
      background: #fff8ef;
    }
    .contact-fab__icon {
      font-size: 16px;
      line-height: 1;
    }
    .contact-fab__label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: -0.01em;
      line-height: 1.1;
      white-space: nowrap;
    }
    .contact-fab__toggle {
      pointer-events: auto;
      min-width: 56px;
      min-height: 56px;
      padding: 9px 11px;
      border-radius: 18px;
      border: 1px solid rgba(63, 48, 32, 0.12);
      background: rgba(255, 250, 243, 0.96);
      color: #2a211b;
      box-shadow: 0 16px 34px rgba(86, 61, 35, 0.14);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-decoration: none;
      backdrop-filter: blur(10px);
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      font: inherit;
      cursor: pointer;
    }
    .contact-fab__toggle:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 36px rgba(86, 61, 35, 0.18);
      background: #fff8ef;
    }
    .contact-fab__panel {
      pointer-events: auto;
      width: min(280px, calc(100vw - 28px));
      border-radius: 22px;
      border: 1px solid rgba(63, 48, 32, 0.12);
      background: rgba(255, 252, 247, 0.97);
      box-shadow: 0 22px 48px rgba(86, 61, 35, 0.18);
      backdrop-filter: blur(12px);
      padding: 16px;
      display: grid;
      gap: 12px;
      transform-origin: bottom right;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .contact-fab__panel[hidden] {
      display: none;
    }
    .contact-fab__panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .contact-fab__panel-head strong {
      font-size: 0.98rem;
      letter-spacing: -0.02em;
    }
    .contact-fab__close {
      border: 0;
      background: transparent;
      color: #6d5b49;
      font: inherit;
      font-size: 1.2rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .contact-fab__stats {
      display: grid;
      gap: 10px;
    }
    .contact-fab__stat {
      position: relative;
      padding: 14px 14px 12px;
      border-radius: 18px;
      border: 1px solid rgba(63, 48, 32, 0.08);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 8px 18px rgba(77, 45, 13, 0.06);
    }
    .contact-fab__stat::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      border-radius: 18px 18px 0 0;
      background: linear-gradient(90deg, rgba(237, 107, 47, 0.9), rgba(255, 196, 146, 0.38));
    }
    .contact-fab__stat p,
    .contact-fab__stat span {
      margin: 0;
      color: #7f6d5e;
    }
    .contact-fab__stat strong {
      display: block;
      margin: 8px 0 4px;
      font-size: 1.45rem;
      letter-spacing: -0.04em;
    }
    @media (max-width: 640px) {
      .contact-fab {
        right: 10px;
        bottom: 10px;
        gap: 6px;
      }
      .contact-fab__link {
        min-width: 50px;
        min-height: 50px;
        padding: 8px 10px;
        border-radius: 16px;
      }
      .contact-fab__icon {
        font-size: 14px;
      }
      .contact-fab__label {
        font-size: 10px;
      }
      .contact-fab__panel {
        width: min(250px, calc(100vw - 20px));
        padding: 14px;
      }
    }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.className = "contact-fab";
  wrapper.setAttribute("aria-label", "빠른 문의");
  const statsPanel = isHome ? `
    <button class="contact-fab__toggle" type="button" aria-expanded="false" aria-controls="contactFabStats" aria-label="접수와 배차 현황 보기">
      <span class="contact-fab__icon" aria-hidden="true">📊</span>
      <span class="contact-fab__label">현황</span>
    </button>
    <section class="contact-fab__panel" id="contactFabStats" hidden>
      <div class="contact-fab__panel-head">
        <strong>접수와 배차 현황</strong>
        <button class="contact-fab__close" type="button" aria-label="현황 숨기기">×</button>
      </div>
      <div class="contact-fab__stats">
        <article class="contact-fab__stat">
          <p>오늘 예약 수</p>
          <strong id="statReservations">-</strong>
          <span>오늘 생성된 주문 기준</span>
        </article>
        <article class="contact-fab__stat">
          <p>현재 배차 수</p>
          <strong id="statDispatches">-</strong>
          <span>배차 진행 중인 작업 기준</span>
        </article>
        <article class="contact-fab__stat">
          <p>실시간 이용자</p>
          <strong id="statEta">-</strong>
          <span>GA 실시간 기준</span>
        </article>
      </div>
    </section>
  ` : "";
  wrapper.innerHTML = `
    ${statsPanel}
    <a class="contact-fab__link" href="tel:${phone}" aria-label="전화 문의">
      <span class="contact-fab__icon" aria-hidden="true">☎</span>
      <span class="contact-fab__label">전화</span>
    </a>
    <a class="contact-fab__link" href="sms:${phone}?body=${smsBody}" aria-label="문자 문의">
      <span class="contact-fab__icon" aria-hidden="true">✉</span>
      <span class="contact-fab__label">문자</span>
    </a>
  `;

  document.body.appendChild(wrapper);

  if (!isHome) return;

  const toggle = wrapper.querySelector(".contact-fab__toggle");
  const panel = wrapper.querySelector(".contact-fab__panel");
  const closeBtn = wrapper.querySelector(".contact-fab__close");
  if (!toggle || !panel || !closeBtn) return;

  function setExpanded(expanded) {
    panel.hidden = !expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
  }

  toggle.addEventListener("click", () => {
    setExpanded(panel.hidden);
  });

  closeBtn.addEventListener("click", () => {
    setExpanded(false);
  });
})();
