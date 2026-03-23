(function () {
  if (document.querySelector(".contact-fab")) return;

  const phone = "01075416143";
  const smsBody = encodeURIComponent("안녕하세요. 당고 문의드립니다.");

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
    }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.className = "contact-fab";
  wrapper.setAttribute("aria-label", "빠른 문의");
  wrapper.innerHTML = `
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
})();
