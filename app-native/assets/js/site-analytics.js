(function () {
  const MEASUREMENT_ID = 'G-V36V8W4GMC';
  const PAGE_NAME = document.body?.dataset?.analyticsPage || document.title || location.pathname;
  const TRACKABLE_SELECTOR = [
    '[data-analytics-label]',
    '.btn',
    '.header-cta',
    '.page-link',
    '.site-nav a',
    '.topnav a',
    '.contact-fab__link'
  ].join(', ');

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.querySelector(`script[data-gtag-id="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.dataset.gtagId = MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  if (!window.__dangoGtagInitialized) {
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      page_title: document.title,
      page_path: location.pathname
    });
    window.__dangoGtagInitialized = true;
  } else {
    window.gtag('config', MEASUREMENT_ID, {
      page_title: document.title,
      page_path: location.pathname
    });
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function isTrackable(el) {
    if (!el) return false;
    if (el.matches(TRACKABLE_SELECTOR)) return true;
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      return href.startsWith('tel:') || href.startsWith('sms:');
    }
    return false;
  }

  function buildLabel(el) {
    return (
      el.getAttribute('data-analytics-label') ||
      cleanText(el.textContent) ||
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      'unlabeled'
    );
  }

  function classifyEvent(target, label, href) {
    const id = target.id || '';
    const text = cleanText(label).toLowerCase();
    const link = String(href || '').toLowerCase();

    if (id === 'btnPay' || id === 'confirmCheckoutStart' || text.includes('결제하기') || text.includes('전체 결제')) {
      return { name: 'begin_checkout', pixel: 'InitiateCheckout' };
    }

    if (id === 'sendInquiry' || id === 'smsBtn' || text.includes('문자') || link.startsWith('sms:')) {
      return { name: 'contact_sms_click', pixel: 'Contact' };
    }

    if (link.startsWith('tel:') || text.includes('전화')) {
      return { name: 'contact_phone_click', pixel: 'Contact' };
    }

    if (
      id === 'startCheckoutCta' ||
      text.includes('접수하기') ||
      text.includes('바로 접수') ||
      text.includes('상세 접수') ||
      text.includes('지금 접수')
    ) {
      return { name: 'start_application', pixel: 'Lead' };
    }

    if (text.includes('주문조회') || text.includes('조회')) {
      return { name: 'lookup_order', pixel: 'ViewContent' };
    }

    return { name: 'cta_click', pixel: null };
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a, button');
    if (!isTrackable(target)) return;

    const href = target.getAttribute('href') || '';
    const label = buildLabel(target);
    const category = target.tagName === 'A'
      ? (href.startsWith('tel:') ? 'phone' : href.startsWith('sms:') ? 'sms' : 'link')
      : 'button';
    const eventInfo = classifyEvent(target, label, href);

    window.gtag('event', 'cta_click', {
      page_name: PAGE_NAME,
      click_label: label,
      click_target: href || target.id || '',
      click_category: category
    });

    window.dataLayer.push({
      event: eventInfo.name,
      page_name: PAGE_NAME,
      click_label: label,
      click_target: href || target.id || '',
      click_category: category
    });

    if (eventInfo.pixel && typeof window.fbq === 'function') {
      window.fbq('track', eventInfo.pixel, {
        page_name: PAGE_NAME,
        click_label: label,
        click_target: href || target.id || '',
        click_category: category
      });
    }
  }, { capture: true });
})();
