// /assets/js/app.js
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    /* 날짜 입력칸 전체 클릭 시 달력 열기 */
    const wrap = document.querySelector(".date-wrap");
    const input = document.querySelector("#moveDate");

    function triggerDatePicker(inp) {
      if (!inp) return;
      inp.focus();
      if (inp.showPicker) { try { inp.showPicker(); } catch (_) { inp.click(); } }
      else inp.click();
    }

    if (wrap && input) {
      wrap.addEventListener("click", () => triggerDatePicker(input));
      const dateCard = wrap.closest('.card');
      if (dateCard) {
        dateCard.addEventListener("click", (e) => {
          if (e.target.closest('.time-grid, .time-chip, input, label, button, a, select, [data-open-modal]')) return;
          triggerDatePicker(input);
        });
      }
    }

    /* =========================================================
       Global knobs
    ========================================================= */
    let PRICE_MULTIPLIER = 0.714;
    let DISPLAY_MULTIPLIER = 1;
    const MOVE_DEPOSIT_RATE = 0.2;
    const HELPER_FEE_PER_PERSON = 60000;
    const HELPER_DRIVER_SETTLEMENT_PER_PERSON = 40000;
    const LADDER_FEE_PER_SPOT = 120000;
    const LADDER_DRIVER_SETTLEMENT_PER_SPOT = 100000;
    const HELPER_DEPOSIT_ADDON_PER_PERSON = 20000;
    const SERVICE = { MOVE: "move", CLEAN: "clean" };
    const ATTR_KEY = "dango:attribution";

    /* =========================================================
       DOM helpers
    ========================================================= */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const safeText = (v) => (v == null ? "" : String(v));
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));


    const DEFAULT_SERVICE = document.body?.dataset.defaultService || "move";
    const SITE_BRAND = document.body?.dataset.siteBrand || (DEFAULT_SERVICE === "clean" ? "디디클린" : "디디운송");
    const CROSS_LINK = document.body?.dataset.crossLink || "";
    const CROSS_LABEL = document.body?.dataset.crossLabel || (DEFAULT_SERVICE === "clean" ? "이사도 필요하면 눌러주세요." : "청소도 필요하면 눌러주세요.");

    function showToast(message, type) {
      let stack = document.getElementById('toastStack');
      if (!stack) {
        const style = document.createElement('style');
        style.textContent = '#toastStack{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;z-index:9999;pointer-events:none}.toast-item{padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;color:#fff;background:#215a45;box-shadow:0 8px 24px rgba(0,0,0,.18);animation:toastIn .2s ease;white-space:pre-wrap;max-width:340px;text-align:center}.toast-item.error{background:#b91c1c}.toast-item.info{background:#1e3a5f}@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(style);
        stack = document.createElement('div');
        stack.id = 'toastStack';
        document.body.appendChild(stack);
      }
      const el = document.createElement('div');
      el.className = 'toast-item' + (type === 'error' ? ' error' : type === 'info' ? ' info' : '');
      el.textContent = message;
      stack.appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }

    function captureAttributionFromQuery() {
      const qs = new URLSearchParams(window.location.search);
      const source = qs.get("utm_source") || qs.get("source") || qs.get("channel");
      const medium = qs.get("utm_medium") || null;
      const campaign = qs.get("utm_campaign") || null;
      if (!source && !medium && !campaign) return;
      localStorage.setItem(ATTR_KEY, JSON.stringify({
        source: source || "direct",
        medium,
        campaign,
        capturedAt: new Date().toISOString()
      }));
    }

    function getAttribution() {
      try {
        const raw = localStorage.getItem(ATTR_KEY);
        if (!raw) return { source: "direct", medium: null, campaign: null };
        const parsed = JSON.parse(raw);
        const capturedAt = parsed?.capturedAt ? new Date(parsed.capturedAt).getTime() : null;
        if (capturedAt && Date.now() - capturedAt > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(ATTR_KEY);
          return { source: "direct", medium: null, campaign: null };
        }
        return {
          source: parsed?.source || "direct",
          medium: parsed?.medium || null,
          campaign: parsed?.campaign || null
        };
      } catch {
        return { source: "direct", medium: null, campaign: null };
      }
    }

    async function loadRuntimePricingConfig() {
      try {
        const cfg = await fetch("/.netlify/functions/config").then((res) => res.json());
        if (cfg?.pricing?.multiplier) PRICE_MULTIPLIER = Number(cfg.pricing.multiplier || PRICE_MULTIPLIER);
        if (cfg?.pricing?.displayMultiplier) DISPLAY_MULTIPLIER = Number(cfg.pricing.displayMultiplier || DISPLAY_MULTIPLIER);
      } catch {}
    }


    function createGaFloatingBadge() {
  if (document.getElementById('gaFloatingBadge')) return null;

  const lang = (document.body?.dataset.lang || 'ko').toLowerCase();
  const dict = {
    ko: {
      badge: '실시간 이용 현황',
      liveLabel: '지금',
      liveSuffix: '명이 견적 확인 중',
      desc: '방문자가 있는 순간을 보여줍니다',
      viewsLabel: '최근 30분 조회',
      updated: '업데이트',
      fallbackTitle: '연결 확인 중',
      fallbackDesc: 'GA 실시간 데이터를 불러오는 중입니다',
      emptyDesc: '지금 첫 방문자를 기다리고 있어요',
    },
    en: {
      badge: 'Live activity',
      liveLabel: 'Now',
      liveSuffix: 'visitors checking quotes',
      desc: 'Showing real-time visitor activity',
      viewsLabel: 'Views in last 30m',
      updated: 'Updated',
      fallbackTitle: 'Connecting…',
      fallbackDesc: 'Loading GA realtime data',
      emptyDesc: 'Waiting for the next visitor',
    },
  };

  const t = dict[lang] || dict.ko;
  const slot = document.getElementById('stickyGaSlot');

  const badge = document.createElement('section');
  badge.id = 'gaFloatingBadge';
  badge.className = 'ga-floating-badge ga-floating-badge--inline is-loading';
  badge.setAttribute('aria-live', 'polite');

  badge.innerHTML = `
    <div class="ga-floating-badge__header">
      <div class="ga-floating-badge__eyebrow">
        <span class="ga-floating-badge__dot" aria-hidden="true"></span>
        <span>${t.badge}</span>
      </div>
    </div>

    <div class="ga-floating-badge__hero">
      <div class="ga-floating-badge__hero-main">
        <strong class="ga-floating-badge__value" data-ga-active>0</strong>
        <span class="ga-floating-badge__unit">${lang === 'ko' ? '명' : ''}</span>
      </div>
      <div class="ga-floating-badge__hero-copy" data-ga-copy>
        ${t.liveLabel} 0${lang === 'ko' ? '명' : ''} ${t.liveSuffix}
      </div>
    </div>

    <div class="ga-floating-badge__desc" data-ga-desc>${t.desc}</div>

    <div class="ga-floating-badge__stats">
      <div class="ga-floating-badge__stat">
        <span class="ga-floating-badge__stat-label">${t.viewsLabel}</span>
        <strong class="ga-floating-badge__stat-value" data-ga-secondary>0</strong>
      </div>
      <div class="ga-floating-badge__stat">
        <span class="ga-floating-badge__stat-label">${t.updated}</span>
        <strong class="ga-floating-badge__stat-value" data-ga-time>-</strong>
      </div>
    </div>
  `;

  (slot || document.body).appendChild(badge);

  return { badge, dict: t, lang };
}

const gaBadge = createGaFloatingBadge();

function setupStickyBarToggle() {
  const stickyBar = document.getElementById("stickyPriceBar");
  const toggleBtn = document.getElementById("stickyToggleBtn");
  if (!stickyBar || !toggleBtn) return;

  const setExpanded = (expanded) => {
    stickyBar.classList.toggle("is-expanded", expanded);
    stickyBar.classList.toggle("is-collapsed", !expanded);
    toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggleBtn.textContent = expanded ? "접기" : "상세";
  };

  setExpanded(false);
  toggleBtn.addEventListener("click", () => {
    const expanded = !stickyBar.classList.contains("is-expanded");
    setExpanded(expanded);
  });
}

setupStickyBarToggle();

async function loadGaRealtimeBadge() {
  if (!gaBadge?.badge) return;

  const { badge, dict, lang } = gaBadge;

  try {
    badge.classList.add('is-loading');

    const res = await fetch('/.netlify/functions/gaRealtime', {
      cache: 'no-store',
    });
    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'GA realtime request failed');
    }

    const activeUsers = Number(data.activeUsers || 0);
    const pageViews = Number(data.screenPageViews || 0);
    const fetchedAt = data.fetchedAtKst || '-';

    const activeEl = badge.querySelector('[data-ga-active]');
    const copyEl = badge.querySelector('[data-ga-copy]');
    const descEl = badge.querySelector('[data-ga-desc]');
    const secondaryEl = badge.querySelector('[data-ga-secondary]');
    const timeEl = badge.querySelector('[data-ga-time]');

    if (activeEl) activeEl.textContent = activeUsers.toLocaleString();
    if (secondaryEl) secondaryEl.textContent = pageViews.toLocaleString();
    if (timeEl) timeEl.textContent = fetchedAt;

    if (copyEl) {
      if (lang === 'ko') {
        copyEl.textContent = `지금 ${activeUsers.toLocaleString()}명이 견적 확인 중`;
      } else {
        copyEl.textContent = `${activeUsers.toLocaleString()} visitors checking quotes now`;
      }
    }

    if (descEl) {
      if (activeUsers > 0) {
        descEl.textContent =
          lang === 'ko'
            ? '실시간 방문 흐름이 반영되고 있어요'
            : 'Realtime visitor flow is being reflected';
      } else {
        descEl.textContent = dict.emptyDesc;
      }
    }
  } catch (err) {
    const activeEl = badge.querySelector('[data-ga-active]');
    const copyEl = badge.querySelector('[data-ga-copy]');
    const descEl = badge.querySelector('[data-ga-desc]');
    const secondaryEl = badge.querySelector('[data-ga-secondary]');
    const timeEl = badge.querySelector('[data-ga-time]');

    if (activeEl) activeEl.textContent = '0';
    if (copyEl) copyEl.textContent = dict.fallbackTitle;
    if (descEl) descEl.textContent = dict.fallbackDesc;
    if (secondaryEl) secondaryEl.textContent = '-';
    if (timeEl) timeEl.textContent = '-';

    console.error('GA realtime badge load failed:', err);
  } finally {
    badge.classList.remove('is-loading');
  }
}

    loadGaRealtimeBadge();
    window.setInterval(loadGaRealtimeBadge, 30000);

    function formatWon(n) {
      const x = Math.trunc(Number(n) || 0); // ✅ 반올림 X (원단위 버림)
      return "₩" + x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function toInt(v, d = 0) {
      const n = parseInt(String(v ?? ""), 10);
      return Number.isFinite(n) ? n : d;
    }

    function toNum(v, d = 0) {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    }

    function setHidden(el, hidden) {
      if (!el) return;
      el.hidden = !!hidden;
      el.style.display = hidden ? "none" : "";
    }
function normalizeItemKey(k) {
  // 항목 키의 공백을 없애서 가격표에서 일치하도록 보정
  return String(k || "").replace(/\s+/g, "");
}
    /* =========================================================
       Config / Supabase
    ========================================================= */
    const CFG = window.DDLOGI_CONFIG || {};
    const supabase = window.supabase?.createClient?.(CFG.supabaseUrl, CFG.supabaseKey);

    if (window.Kakao && CFG.kakaoJavaScriptKey) {
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(CFG.kakaoJavaScriptKey);
        }
      } catch (error) {
        console.error("Kakao SDK init failed:", error);
      }
    }

    async function fetchConfirmedSlots(dateStr) {
      if (!supabase || !dateStr) return new Set();
      try {
        const { data, error } = await supabase
          .from("confirmed_slots")
          .select("time_slot")
          .eq("date", dateStr)
          .eq("status", "confirmed");
        if (error) {
          console.error("fetchConfirmedSlots error:", error);
          return new Set();
        }
        return new Set((data || []).map((x) => String(x.time_slot)));
      } catch (e) {
        console.error("fetchConfirmedSlots exception:", e);
        return new Set();
      }
    }

    function setTimeSlotDisabled(slotValue, disabled) {
      const v = String(slotValue);
      const r = document.querySelector('input[name="timeSlot"][value="' + v + '"]');
      if (!r) return;
      r.disabled = !!disabled;

      const chip = r.closest(".time-chip");
      if (chip) {
        chip.classList.toggle("disabled", !!disabled);
        chip.setAttribute("aria-disabled", disabled ? "true" : "false");
      }

      // ✅ disable되면 체크 해제 + state 반영
      if (disabled && r.checked) {
        r.checked = false;
        state.timeSlot = null;
      }
    }

    async function refreshTimeSlotAvailability() {
      const dateStr = state.moveDate;
      const all = $$('input[name="timeSlot"]');
      all.forEach((r) => setTimeSlotDisabled(r.value, false));

      if (!dateStr) return;

      const confirmed = await fetchConfirmedSlots(dateStr);
      confirmed.forEach((slot) => setTimeSlotDisabled(slot, true));
    }

    /* =========================================================
       State
    ========================================================= */
    const state = {
      activeService: (document.body?.dataset.defaultService || "move"),
      stepIndex: 0,
      moveDate: "",
      timeSlot: null,

      vehicle: "",
      startAddress: "",
      waypointAddress: "",
      waypointLoadLevel: null,
      waypointNoElevator: false,
      waypointFloor: 1,
      waypointLadderEnabled: false,
      waypointLadderFloor: 6,
      waypointItems: {},
      waypointItemsNote: "",
      waypointThrow: {},
      waypointThrowNote: "",
      endAddress: "",
      hasWaypoint: false,
      distanceKm: 0,
      lastDistanceRouteKey: "",

      moveType: "general",
      storageBase: "general",
      storageDays: 1,

      noFrom: false,
      fromFloor: 1,
      noTo: false,
      toFloor: 1,

      loadLevel: null,

      cantCarryFrom: false,
      cantCarryTo: false,
      helperFrom: false,
      helperTo: false,

      ladderFromEnabled: false,
      ladderFromFloor: 6,
      ladderToEnabled: false,
      ladderToFloor: 6,

      night: false,
      ride: 0,

      cleaningToggle: false,
      cleaningFrom: false,
      cleaningTo: false,
      cleaningType: "light",

      throwToggle: false,
      workFrom: false,
      workTo: false,

      items: {},
      itemsNote: "",
      mattressSizes: { S: 0, SS: 0, D: 0, Q: 0, K: 0 },

      throwFrom: {},
      throwTo: {},
      throwNote: "",

      cleanType: "movein",
      cleanSoil: "light",
      cleanPyeong: 9,
      cleanRooms: 1,
      cleanBaths: 1,
      cleanBalconies: 1,
      cleanWardrobes: 0,
      cleanAddress: "",
      cleanAddressNote: "",
      cleanParkingHard: false,
      cleanNoElevator: false,
      cleanFloor: 1,
      cleanOuterWindowEnabled: false,
      cleanOuterWindowPyeong: 0,
      cleanPhytoncideEnabled: false,
      cleanDisinfectEnabled: false,
      cleanTrashBags: 0,
      cleanBasic: {},
      cleanAppliance: {},
      cleanNote: "",
    };

    /* =========================================================
       Wizard step model (DOM-driven)
    ========================================================= */
    const sections = $$(".step-card");
    const MOVE_STAGE_GROUPS = [
      { label: "기본 정보", title: "차량과 이동 정보를 먼저 정해요.", hint: "차량, 주소, 날짜를 순서대로 보면 돼요.", tokens: [1, 2, 3] },
      { label: "이사 준비", title: "이사 방식과 짐 구성을 정해요.", hint: "이사 방식, 계단, 가구·가전을 순서대로 보면 돼요.", tokens: [4, 5, 6] },
      { label: "작업 도움", title: "작업 도움 조건을 정리해요.", hint: "직접 나르기, 인부, 사다리차를 확인해요.", tokens: [7, 8, 9] },
      { label: "추가 요청", title: "추가 요청을 정리해요.", hint: "야간, 동승, 버릴 물건을 필요한 만큼 넣어요.", tokens: [10, 11] },
      { label: "결과 확인", title: "마지막으로 금액을 확인해요.", hint: "결과를 보고 바로 결제나 상담으로 이어가요.", tokens: [12] }
    ];

    const CLEAN_STAGE_GROUPS = [
      { label: "청소 정보", title: "청소 유형과 기본 구성을 먼저 넣어요.", hint: "평수와 방 구조만 먼저 맞추면 돼요.", tokens: [1] },
      { label: "주소·방문", title: "방문 주소와 날짜를 정해요.", hint: "주소와 방문 시간을 먼저 확인해요.", tokens: [2, 3] },
      { label: "청소 범위", title: "청소 범위와 세부 구성을 정리해요.", hint: "청소 범위와 현장 조건을 확인해요.", tokens: [4, 5, 6, 7, 8, 9] },
      { label: "추가 요청", title: "특수 청소와 추가 요청을 넣어요.", hint: "특수 청소, 가전 청소, 메모를 정리해요.", tokens: [10, 11] },
      { label: "결과 확인", title: "마지막으로 금액을 확인해요.", hint: "결과를 보고 바로 접수나 결제로 이어가요.", tokens: [12] }
    ];
    const STAGE_CHEERS = [
      "좋아요. 이제 하나씩 넣으면 돼요.",
      "흐름이 잘 맞고 있어요.",
      "중간까지 왔어요. 조금만 더 보면 돼요.",
      "거의 다 왔어요. 마지막 요청만 정리하면 돼요.",
      "이제 금액만 확인하면 끝이에요."
    ];
    const MOVE_STEP_COPY = {
      1: { title: "차량을 먼저 골라요.", hint: "실제 짐 규모에 맞는 차량부터 정하면 돼요." },
      2: { title: "출발지와 도착지를 넣어요.", hint: "경유지가 있으면 같이 넣고 거리 계산을 하면 돼요." },
      3: { title: "날짜와 시간을 정해요.", hint: "가능한 날짜와 희망 시간을 먼저 맞추면 돼요." },
      4: { title: "이사 방식을 골라요.", hint: "일반, 반포장, 보관 중에서 맞는 방식으로 고르면 돼요." },
      5: { title: "엘리베이터와 계단을 확인해요.", hint: "출발지와 도착지 작업 환경을 같이 보면 돼요." },
      6: { title: "가구와 짐 구성을 넣어요.", hint: "가구·가전과 짐양을 실제에 가깝게 넣으면 돼요." },
      7: { title: "직접 나르기 어려운지 확인해요.", hint: "기사 1명이 가능한 수준인지 먼저 확인하면 돼요." },
      8: { title: "추가 인부가 필요한지 정해요.", hint: "혼자 어려우면 필요한 인원만 추가하면 돼요." },
      9: { title: "사다리차 필요 여부를 확인해요.", hint: "건물 구조에 따라 필요한 경우만 체크하면 돼요." },
      10: { title: "추가 옵션을 정리해요.", hint: "야간, 주말, 동승 요청만 필요한 만큼 넣으면 돼요." },
      11: { title: "버릴 물건이 있으면 넣어요.", hint: "함께 버릴 물건이 있으면 마지막에 정리하면 돼요." },
      12: { title: "마지막으로 금액을 확인해요.", hint: "결과를 보고 바로 결제나 상담으로 이어가요." }
    };
    const CLEAN_STEP_COPY = {
      1: { title: "청소 기본 정보를 먼저 넣어요.", hint: "청소 유형, 오염도, 평수부터 맞추면 돼요." },
      2: { title: "청소 주소를 넣어요.", hint: "방문 주소와 현장 메모를 먼저 정리하면 돼요." },
      3: { title: "날짜와 시간을 정해요.", hint: "방문 날짜와 희망 시간을 먼저 맞추면 돼요." },
      4: { title: "청소 옵션을 정리해요.", hint: "외창, 새집증후군, 곰팡이 같은 옵션을 고르면 돼요." },
      12: { title: "마지막으로 금액을 확인해요.", hint: "결과를 보고 바로 결제나 상담으로 이어가요." }
    };

    function getStageGroups() {
      const service = state.activeService || DEFAULT_SERVICE;
      return service === SERVICE.CLEAN ? CLEAN_STAGE_GROUPS : MOVE_STAGE_GROUPS;
    }

    function getCurrentStageInfo(stepToken) {
      const groups = getStageGroups();
      const index = groups.findIndex((group) => group.tokens.includes(stepToken));
      return {
        groups,
        index: index >= 0 ? index : 0,
        group: groups[index >= 0 ? index : 0]
      };
    }

    function getCurrentStepCopy(stepToken) {
      const service = state.activeService || DEFAULT_SERVICE;
      const map = service === SERVICE.CLEAN ? CLEAN_STEP_COPY : MOVE_STEP_COPY;
      return map[stepToken] || null;
    }

    function gotoStage(stageIndex) {
      const groups = getStageGroups();
      const targetGroup = groups[stageIndex];
      if (!targetGroup) return;
      const visible = computeVisibleSteps();
      const nextIndex = visible.findIndex((sec) => targetGroup.tokens.includes(getStepToken(sec)));
      if (nextIndex >= 0) gotoStep(nextIndex);
    }

    function getStepToken(sectionEl) {
      const raw = sectionEl.getAttribute("data-step");
      if (raw == null) return null;
      if (/^\d+$/.test(raw.trim())) return Number(raw.trim());
      return raw.trim();
    }

    function computeVisibleSteps() {
      const svc = state.activeService;
      const visible = [];

      for (const sec of sections) {
        const token = getStepToken(sec);
        if (token == null) continue;

        const secOnly = sec.getAttribute("data-only");
        if (!svc) {
          if (token === 0 || token === "service") visible.push(sec);
        } else {
          if (secOnly && secOnly !== svc) continue;
          visible.push(sec);
        }
      }
      return visible;
    }

    function showOnlySection(activeSec) {
      const visibleSet = new Set(computeVisibleSteps());
      for (const sec of sections) {
        const shouldShow = visibleSet.has(sec);
        sec.style.display = shouldShow ? "" : "none";
        sec.setAttribute("aria-hidden", shouldShow ? "false" : "true");
        sec.classList.toggle("is-active", shouldShow && sec === activeSec);

        const svc = state.activeService;
        const innerOnly = $$("[data-only]", sec);
        innerOnly.forEach((node) => {
          const only = node.getAttribute("data-only");
          if (!only) return;
          if (!svc) node.style.display = "none";
          else node.style.display = only === svc ? "" : "none";
        });
      }
    }

    function gotoStep(index, opts = {}) {
      const visible = computeVisibleSteps();
      const maxIdx = Math.max(0, visible.length - 1);
      const nextIdx = clamp(index, 0, maxIdx);
      state.stepIndex = nextIdx;

      const sec = visible[nextIdx];
      showOnlySection(sec);
      updateWizardUI(visible);

      const token = getStepToken(sec);
      if (token === 3) refreshTimeSlotAvailability();
      if (token === 12) {
        renderAll();
        queueCompareChartResize();
        setTimeout(queueCompareChartResize, 120);
      }

      if (!opts.noScroll && sec) {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function updateWizardUI(visibleSteps) {
      const nav = $("#wizardNav");
      if (nav) nav.style.display = visibleSteps.length ? "flex" : "none";

      const activeSection = visibleSteps[state.stepIndex];
      const activeToken = getStepToken(activeSection);
      const stageInfo = getCurrentStageInfo(activeToken);
      const stageBarEl = $("#wizardStageBar");
      const stageCheerEl = $("#wizardCheer");
      const nextBtns = $$('[data-wizard-next]');
      const prevBtns = $$('[data-wizard-prev]');

      const stepCopy = getCurrentStepCopy(activeToken);
      if (stageBarEl) stageBarEl.style.width = `${((stageInfo.index + 1) / stageInfo.groups.length) * 100}%`;
      if (stageCheerEl) {
        const cheer = STAGE_CHEERS[stageInfo.index] || "좋아요. 이대로 진행하면 돼요.";
        const hint = stepCopy?.hint || stageInfo.group?.hint || "현재 단계만 차례대로 보면 됩니다.";
        stageCheerEl.textContent = `${cheer} ${hint}`;
      }

      prevBtns.forEach((prevBtn) => {
        prevBtn.disabled = state.stepIndex <= 0;
        prevBtn.textContent = stageInfo.index <= 0 ? "처음 단계" : "이전 단계";
      });
      nextBtns.forEach((nextBtn) => {
        nextBtn.disabled = false;
        nextBtn.textContent = activeToken === 12 ? "다시 처음부터" : "다음 단계";
      });

      $$("#wizardStagePills .stage-pill").forEach((pill, index) => {
        const group = stageInfo.groups[index];
        if (group) {
          pill.textContent = `${index + 1}. ${group.label}`;
        }
        pill.classList.toggle("is-active", index === stageInfo.index);
        pill.classList.toggle("is-done", index < stageInfo.index);
        pill.classList.toggle("is-upcoming", index > stageInfo.index);
      });

      document.body.classList.toggle("wizard-active", state.stepIndex > 0 || activeToken >= 1);
    }

    function canGoNext() {
      const visible = computeVisibleSteps();
      const sec = visible[state.stepIndex];
      const token = getStepToken(sec);

      if (token === 0) return true;
      if (token === "service") return !!state.activeService;

      if (state.activeService === SERVICE.MOVE) {
        if (token === 1) return !!state.vehicle;
        if (token === 2) return state.distanceKm > 0 && state.lastDistanceRouteKey === currentRouteKey() && !!state.startAddress && !!state.endAddress;
        if (token === 3) return !!state.moveDate && !!state.timeSlot;
        if (token === 4) return !!state.moveType;
        if (token === 6) return state.loadLevel !== null;
      }

      if (state.activeService === SERVICE.CLEAN) {
        if (token === 1) return true;
        if (token === 2) return !!state.cleanAddress;
        if (token === 3) return !!state.moveDate && !!state.timeSlot;
        if (token === 4) return true;
      }

      return true;
    }

    function markFieldError(selector, msg) {
      const el = $(selector);
      if (!el) return;
      el.classList.add('is-invalid');
      if (!el.nextElementSibling?.classList.contains('field-error-msg')) {
        const span = document.createElement('span');
        span.className = 'field-error-msg';
        span.textContent = msg;
        el.parentNode.insertBefore(span, el.nextSibling);
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearFieldErrors() {
      $$('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
      $$('.field-error-msg').forEach((el) => el.remove());
    }

    document.addEventListener("input", (e) => {
      if (e.target.classList?.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
        e.target.nextElementSibling?.classList.contains('field-error-msg') && e.target.nextElementSibling.remove();
      }
    });

    function flashRequiredHint(sec) {
      if (!sec) return;
      sec.classList.add("shake");
      setTimeout(() => sec.classList.remove("shake"), 350);
      clearFieldErrors();

      const token = getStepToken(sec);
      if (token === "service" && !state.activeService) {
        showToast("서비스를 먼저 선택해주세요.", "error");
        return;
      }
      if (state.activeService === SERVICE.MOVE) {
        if (token === 1 && !state.vehicle) showToast("차량을 선택해주세요.", "error");
        if (token === 2 && (state.distanceKm <= 0 || state.lastDistanceRouteKey !== currentRouteKey())) {
          showToast("주소를 바꿨다면 거리 계산을 다시 눌러주세요.", "error");
          markFieldError('#startAddress', '출발지 주소 확인 후 거리 계산을 눌러주세요.');
        }
        if (token === 3 && (!state.moveDate || !state.timeSlot)) {
          showToast("날짜와 시간을 선택해주세요.", "error");
          if (!state.moveDate) markFieldError('#moveDate', '날짜를 선택해주세요.');
          if (!state.timeSlot) {
            const tg = $('.time-grid');
            if (tg) {
              tg.classList.add('is-invalid');
              if (!tg.nextElementSibling?.classList.contains('field-error-msg')) {
                const s = document.createElement('span'); s.className = 'field-error-msg'; s.textContent = '시간을 선택해주세요.';
                tg.parentNode.insertBefore(s, tg.nextSibling);
              }
            }
          }
        }
        if (token === 6 && state.loadLevel === null) showToast("짐양(박스 기준)을 선택해주세요.", "error");
      }
      if (state.activeService === SERVICE.CLEAN) {
        if (token === 2 && !state.cleanAddress) {
          showToast("청소 주소를 입력해주세요.", "error");
          markFieldError('#cleanAddress', '청소 주소를 입력해주세요.');
        }
        if (token === 3 && (!state.moveDate || !state.timeSlot)) {
          showToast("날짜와 시간을 선택해주세요.", "error");
          if (!state.moveDate) markFieldError('#moveDate', '날짜를 선택해주세요.');
          if (!state.timeSlot) {
            const tg = $('.time-grid');
            if (tg) {
              tg.classList.add('is-invalid');
              if (!tg.nextElementSibling?.classList.contains('field-error-msg')) {
                const s = document.createElement('span'); s.className = 'field-error-msg'; s.textContent = '시간을 선택해주세요.';
                tg.parentNode.insertBefore(s, tg.nextSibling);
              }
            }
          }
        }
      }
    }

    function goNext() {
      const visible = computeVisibleSteps();
      const sec = visible[state.stepIndex];
      const token = getStepToken(sec);

      if (token === 12) {
        state.activeService = null;
        gotoStep(0);
        return;
      }

      if (!canGoNext()) {
        flashRequiredHint(sec);
        return;
      }
      gotoStep(state.stepIndex + 1);
    }

    function goPrev() {
      gotoStep(state.stepIndex - 1);
    }

    /* =========================================================
       Bind wizard nav
    ========================================================= */
    $$('[data-wizard-prev]').forEach((btn) => btn.addEventListener("click", goPrev));
    $$('[data-wizard-next]').forEach((btn) => btn.addEventListener("click", goNext));
    $$("#wizardStagePills .stage-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const index = Number(pill.dataset.stageIndex || 0);
        gotoStage(index);
      });
    });
    $("#heroStartBtn")?.addEventListener("click", () => {
      const firstSection = document.querySelector('[data-step="1"]');
      firstSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* =========================================================
       Service selection
    ========================================================= */
    $$(".service-card").forEach((card) => {
      card.addEventListener("click", () => {
        const svc = card.getAttribute("data-service");
        if (svc !== SERVICE.MOVE && svc !== SERVICE.CLEAN) return;
        state.activeService = svc;

        $$(".service-card").forEach((c) => c.classList.remove("is-active"));
        card.classList.add("is-active");

        const visible = computeVisibleSteps();
        const first = visible.findIndex((s) => {
          const t = getStepToken(s);
          return t !== 0 && t !== "service";
        });

        gotoStep(first >= 0 ? first : 0);
        renderAll();
      });
    });

    /* =========================================================
       Modal system (v3 hardened)
    ========================================================= */
    function syncModalBodyLock() {
      const opened = document.querySelectorAll('.modal.open').length;
      document.body.classList.toggle('modal-open', opened > 0);
    }

    function getWaypointNestedHost() {
      return document.getElementById('waypointNestedHost');
    }

    function mountNestedModalInWaypoint(id) {
      const m = document.getElementById(id);
      const host = getWaypointNestedHost();
      const waypointModal = document.getElementById('waypointSetupModal');
      if (!m || !host || !waypointModal || !waypointModal.classList.contains('open')) return false;
      if (!m.dataset.originalParentId && m.parentElement && m.parentElement.id) {
        m.dataset.originalParentId = m.parentElement.id;
      }
      if (!m.dataset.originalNextSiblingId) {
        const sib = m.nextElementSibling;
        if (sib && sib.id) m.dataset.originalNextSiblingId = sib.id;
      }
      host.appendChild(m);
      m.classList.add('nested-in-waypoint');
      waypointModal.classList.add('has-nested-modal');
      return true;
    }

    function unmountNestedModalFromWaypoint(id) {
      const m = document.getElementById(id);
      const waypointModal = document.getElementById('waypointSetupModal');
      if (!m || !m.classList.contains('nested-in-waypoint')) return false;

      const parentId = m.dataset.originalParentId || '';
      const nextId = m.dataset.originalNextSiblingId || '';
      const originalParent = parentId ? document.getElementById(parentId) : null;
      const nextSibling = nextId ? document.getElementById(nextId) : null;

      if (originalParent) {
        if (nextSibling && nextSibling.parentElement === originalParent) originalParent.insertBefore(m, nextSibling);
        else originalParent.appendChild(m);
      } else {
        document.body.appendChild(m);
      }

      m.classList.remove('nested-in-waypoint');
      if (waypointModal) {
        const stillNestedOpen = waypointModal.querySelector('.modal.nested-in-waypoint.open');
        if (!stillNestedOpen) waypointModal.classList.remove('has-nested-modal');
      }
      return true;
    }

    function openModal(id) {
      const m = document.getElementById(id);
      if (!m) return false;
      if (id === "mattressSizeModal") syncMattressModalFromState();
      if (id === "checkoutStartModal") {
        const summaryEl = document.getElementById("checkoutOrderSummary");
        if (summaryEl) {
          const pricing = buildCurrentPricingBreakdown({ channel: document.body?.dataset.siteBrand === "당고" ? "dango" : "direct" });
          const summaryText = document.getElementById("summary")?.textContent || '';
          summaryEl.textContent = `${summaryText}  /  예상 금액 ${formatWon(pricing.total || 0)}`;
          summaryEl.style.display = 'block';
        }
      }
      m.setAttribute("aria-hidden", "false");
      m.classList.add("open");
      syncModalBodyLock();
      return true;
    }

    function closeModal(id) {
      const m = document.getElementById(id);
      if (!m) return false;
      m.setAttribute("aria-hidden", "true");
      m.classList.remove("open");
      if (id === 'caseImageModal' && caseImageModalImg) {
        caseImageModalImg.removeAttribute('src');
        caseImageModalImg.removeAttribute('alt');
      }
      if (m.classList.contains('nested-in-waypoint')) unmountNestedModalFromWaypoint(id);
      syncModalBodyLock();
      return true;
    }

    function closeAllModals() {
      document.querySelectorAll('.modal.open').forEach((m) => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
        if (m.classList.contains('nested-in-waypoint')) unmountNestedModalFromWaypoint(m.id);
      });
      syncModalBodyLock();
    }

    let itemsModalContext = "main";
    let throwModalContext = "main";

    function getItemsStateTarget() {
      return itemsModalContext === "waypoint" ? state.waypointItems : state.items;
    }

    function getItemsNoteTarget() {
      return itemsModalContext === "waypoint" ? "waypointItemsNote" : "itemsNote";
    }

    function getThrowStateTarget() {
      return throwModalContext === "waypoint" ? state.waypointThrow : null;
    }

    function resetItemsModalToMainContext() {
      itemsModalContext = "main";
      unmountNestedModalFromWaypoint("itemsModal");
      const waypointModal = document.getElementById('waypointSetupModal');
      if (waypointModal && !waypointModal.querySelector('.modal.nested-in-waypoint.open')) {
        waypointModal.classList.remove('has-nested-modal');
      }
      syncItemsModalFromState();
    }

    function resetThrowModalToMainContext() {
      throwModalContext = "main";
      unmountNestedModalFromWaypoint("throwModal");
      const waypointModal = document.getElementById('waypointSetupModal');
      if (waypointModal && !waypointModal.querySelector('.modal.nested-in-waypoint.open')) {
        waypointModal.classList.remove('has-nested-modal');
      }
      syncThrowModalFromState();
    }

    function syncItemsModalFromState() {
      const target = getItemsStateTarget();
      const noteKey = getItemsNoteTarget();
      const title = document.querySelector("#itemsModal .modal-title");
      if (title) title.textContent = itemsModalContext === "waypoint" ? "경유지 짐 선택" : "가구·가전 선택";

      document.querySelectorAll("#itemsModal .itemQty").forEach((inp) => {
        const item = inp.getAttribute("data-item");
        inp.value = String(toInt(target[item], 0));
      });

      const note = document.getElementById("itemsNote");
      if (note) {
        note.value = state[noteKey] || "";
        note.placeholder = itemsModalContext === "waypoint"
          ? "예) 경유지에서만 싣는 짐 / 잠깐 상차 후 다시 이동할 짐 / 현장 메모"
          : "예) TV 벽걸이 분리 필요 / 냉장고 문 분리 가능 / 엘베 예약 필요 / 주차 위치 등";
      }
    }

    function syncThrowModalFromState() {
      const title = document.querySelector("#throwModal .modal-title");
      const fromHeading = document.querySelector("#throwModal .throw-from-heading");
      const toBlock = document.getElementById("throwToBlock");
      const note = document.getElementById("throwNote");

      if (throwModalContext === "waypoint") {
        if (title) title.textContent = "경유지 버릴 물건 선택";
        if (fromHeading) fromHeading.textContent = "경유지 짐(수량)";
        if (toBlock) toBlock.hidden = true;
        document.querySelectorAll('#throwModal .throwQty[data-loc="from"]').forEach((inp) => {
          const item = inp.getAttribute("data-item");
          inp.value = String(toInt(state.waypointThrow[item], 0));
        });
        document.querySelectorAll('#throwModal .throwQty[data-loc="to"]').forEach((inp) => { inp.value = "0"; });
        if (note) {
          note.value = state.waypointThrowNote || "";
          note.placeholder = "예) 경유지에서 폐기할 짐 / 지정 위치 / 기사님 도착 전 연락 요청";
        }
      } else {
        if (title) title.textContent = "버릴 물건 선택";
        if (fromHeading) fromHeading.textContent = "출발지 짐(수량)";
        if (toBlock) toBlock.hidden = false;
        document.querySelectorAll('#throwModal .throwQty[data-loc="from"]').forEach((inp) => {
          const item = inp.getAttribute("data-item");
          inp.value = String(toInt(state.throwFrom[item], 0));
        });
        document.querySelectorAll('#throwModal .throwQty[data-loc="to"]').forEach((inp) => {
          const item = inp.getAttribute("data-item");
          inp.value = String(toInt(state.throwTo[item], 0));
        });
        if (note) {
          note.value = state.throwNote || "";
          note.placeholder = "예) 1층 분리수거장 위치 / 엘베 사용 불가 시간 / 폐기물 봉투 필요 여부 / 기사님 도착 전 연락 요청";
        }
      }
    }

    $$('[data-close]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close");
        if (id) closeModal(id);
      });
    });

    $$(".modal-backdrop").forEach((bd) => {
      bd.addEventListener("click", (e) => {
        if (e.target !== bd) return;
        e.preventDefault();
        e.stopPropagation();
        const id = bd.getAttribute("data-close");
        if (id) closeModal(id);
      });
    });

    // NOTE:
    // .modal-backdrop 는 .modal-panel 의 형제 요소라서,
    // panel 내부 클릭이 backdrop 으로 전파될 일이 없음.
    // 여기서 stopPropagation()을 걸면 modal 내부 버튼(data-open-modal, 동적 data-close,
    // 이미지 확대 등)이 document 위임 리스너까지 도달하지 못해서 기능이 끊길 수 있다.
    // 그래서 panel 클릭은 막지 않고 그대로 두고, 실제 닫힘 제어는 backdrop/data-close 만 사용한다.

    function bindDirectModalOpeners() {
      $$('[data-open-modal]').forEach((btn) => {
        if (btn.dataset.modalOpenBound === '1') return;
        btn.dataset.modalOpenBound = '1';
        btn.addEventListener('click', (e) => {
          const targetId = btn.getAttribute('data-open-modal');
          if (!targetId) return;
          // direct opener + delegated document click 가 동시에 타면
          // 모달 컨텍스트가 두 번 바뀌거나 nested mount 상태가 꼬일 수 있음
          e.stopPropagation();

          const isWaypointItems = btn.id === 'openWaypointItemsModalBtn';
          const isWaypointThrow = btn.id === 'openWaypointThrowModalBtn';

          if (targetId === 'itemsModal') {
            if (isWaypointItems) {
              itemsModalContext = 'waypoint';
              syncItemsModalFromState();
              mountNestedModalInWaypoint(targetId);
            } else {
              resetItemsModalToMainContext();
            }
          }

          if (targetId === 'throwModal') {
            if (isWaypointThrow) {
              throwModalContext = 'waypoint';
              syncThrowModalFromState();
              mountNestedModalInWaypoint(targetId);
            } else {
              resetThrowModalToMainContext();
            }
          }

          if (targetId === 'waypointSetupModal') {
            syncWaypointSetupModal();
          }

          openModal(targetId);
          e.preventDefault();
        });
      });
    }

    bindDirectModalOpeners();

    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest('[data-open-modal]');
      if (openBtn) {
        const targetId = openBtn.getAttribute('data-open-modal');
        const isWaypointItems = openBtn.id === 'openWaypointItemsModalBtn';
        const isWaypointThrow = openBtn.id === 'openWaypointThrowModalBtn';

        if (targetId === 'itemsModal') {
          itemsModalContext = isWaypointItems ? 'waypoint' : 'main';
          syncItemsModalFromState();
          if (isWaypointItems) mountNestedModalInWaypoint(targetId);
          else unmountNestedModalFromWaypoint(targetId);
        }
        if (targetId === 'throwModal') {
          throwModalContext = isWaypointThrow ? 'waypoint' : 'main';
          syncThrowModalFromState();
          if (isWaypointThrow) mountNestedModalInWaypoint(targetId);
          else unmountNestedModalFromWaypoint(targetId);
        }
        if (targetId === 'waypointSetupModal') {
          syncWaypointSetupModal();
        }
        openModal(targetId);
      }

      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        const id = closeBtn.getAttribute('data-close');
        if (id) closeModal(id);
      }

      const zoomImg = e.target.closest('.case-image');
      if (zoomImg && caseImageModal && caseImageModalImg) {
        e.preventDefault();
        e.stopPropagation();
        caseImageModalImg.src = zoomImg.currentSrc || zoomImg.src || '';
        caseImageModalImg.alt = zoomImg.alt || '피해사례 이미지 확대';
        openModal('caseImageModal');
        return;
      }

      const optionRow = e.target.closest('.option');
      if (optionRow) {
        const tappedInteractive = e.target.closest(
          'input, button, a, label, textarea, select, .stepper, [data-open-modal], [data-close]'
        );
        if (!tappedInteractive) {
          const control = optionRow.querySelector('input[type="checkbox"], input[type="radio"]');
          if (control) {
            e.preventDefault();
            if (control.type === 'checkbox') {
              control.checked = !control.checked;
            } else {
              control.checked = true;
            }
            control.dispatchEvent(new Event('change', { bubbles: true }));
            control.focus({ preventScroll: true });
            return;
          }
        }
      }
    });

    document.addEventListener('click', (e) => {
      const itemStepperBtn = e.target.closest('.stepper-btn[data-stepper-item]:not([data-stepper-loc]):not([data-clean-group])');
      if (itemStepperBtn) {
        e.preventDefault();
        handleItemStepperButton(itemStepperBtn);
        return;
      }

      const throwStepperBtn = e.target.closest('.stepper-btn[data-stepper-loc][data-stepper-item]');
      if (throwStepperBtn) {
        e.preventDefault();
        handleThrowStepperButton(throwStepperBtn);
        return;
      }

      const mattressStepperBtn = e.target.closest('.stepper-btn[data-stepper-size]');
      if (mattressStepperBtn) {
        e.preventDefault();
        handleMattressStepperButton(mattressStepperBtn);
        return;
      }

      const cleanStepperBtn = e.target.closest('.stepper-btn[data-clean-group][data-clean-item]');
      if (cleanStepperBtn) {
        e.preventDefault();
        handleCleanStepperButton(cleanStepperBtn);
      }
    });

    document.addEventListener('input', (e) => {
      const itemQtyInput = e.target.closest('.itemQty');
      if (itemQtyInput) {
        handleItemQtyInput(itemQtyInput);
        return;
      }

      const throwQtyInput = e.target.closest('.throwQty');
      if (throwQtyInput) {
        handleThrowQtyInput(throwQtyInput);
        return;
      }

      const mattressSizeInput = e.target.closest('#mattressSizeModal input[data-size]');
      if (mattressSizeInput) {
        handleMattressSizeInput(mattressSizeInput);
        return;
      }

      const cleanQtyInput = e.target.closest('.cleanQty');
      if (cleanQtyInput) {
        handleCleanQtyInput(cleanQtyInput);
      }
    });

    document.addEventListener('change', (e) => {
      const itemQtyInput = e.target.closest('.itemQty');
      if (itemQtyInput) {
        handleItemQtyInput(itemQtyInput);
        return;
      }

      const throwQtyInput = e.target.closest('.throwQty');
      if (throwQtyInput) {
        handleThrowQtyInput(throwQtyInput);
        return;
      }

      const mattressSizeInput = e.target.closest('#mattressSizeModal input[data-size]');
      if (mattressSizeInput) {
        handleMattressSizeInput(mattressSizeInput);
        return;
      }

      const cleanQtyInput = e.target.closest('.cleanQty');
      if (cleanQtyInput) {
        handleCleanQtyInput(cleanQtyInput);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    // nested waypoint modals sometimes need direct close bindings on mobile Safari/Chrome
    document.querySelectorAll('#itemsModal [data-close="itemsModal"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal('itemsModal');
      });
    });
    document.querySelectorAll('#throwModal [data-close="throwModal"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal('throwModal');
      });
    });

    // main modal steppers can lose delegated clicks after waypoint modal nesting,
    // so bind them directly as a fallback as well.
    document.querySelectorAll('#itemsModal .stepper-btn[data-stepper-item]:not([data-stepper-loc]):not([data-clean-group])').forEach((btn) => {
      if (btn.dataset.directStepperBound === '1') return;
      btn.dataset.directStepperBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // 직접 바인딩 fallback 과 document 위임이 동시에 실행되면
        // + / - 가 1번 클릭에 2씩 증감되는 문제가 생김
        e.stopPropagation();
        handleItemStepperButton(btn);
      });
    });

    const caseImageModal = $("#caseImageModal");
    const caseImageModalImg = $("#caseImageModalImg");

    $$(".case-image").forEach((img) => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!caseImageModal || !caseImageModalImg) return;
        caseImageModalImg.src = img.currentSrc || img.src || '';
        caseImageModalImg.alt = img.alt || '이미지 확대 보기';
        openModal('caseImageModal');
      });
    });

    /* =========================================================
       Waypoint setup modal
    ========================================================= */
    const waypointModal = $("#waypointSetupModal");
    const waypointStepLabel = $("#waypointModalStepLabel");
    const waypointPanels = $$(".waypoint-step-panel", waypointModal || document);
    const waypointPrevBtn = $("#waypointModalPrev");
    const waypointNextBtn = $("#waypointModalNext");
    const waypointFloorBody = $("#waypointFloorBody");
    const waypointLadderBody = $("#waypointLadderBody");
    const waypointFloorInput = $("#waypointFloor");
    const waypointLadderFloorInput = $("#waypointLadderFloor");
    let waypointModalStep = 0;
    const waypointStepTitles = [
      "1 / 4 · 경유지 짐양",
      "2 / 4 · 경유지 짐/버림 선택",
      "3 / 4 · 경유지 계단",
      "4 / 4 · 경유지 사다리차",
    ];

    function renderWaypointModalStep() {
      waypointPanels.forEach((panel, idx) => {
        panel.hidden = idx !== waypointModalStep;
      });
      if (waypointStepLabel) waypointStepLabel.textContent = waypointStepTitles[waypointModalStep] || "경유지 상세 설정";
      if (waypointPrevBtn) {
        waypointPrevBtn.textContent = waypointModalStep === 0 ? "닫기" : "이전";
      }
      if (waypointNextBtn) {
        waypointNextBtn.textContent = waypointModalStep >= waypointPanels.length - 1 ? "저장" : "다음";
      }
    }

    function syncWaypointSetupModal() {
      const loadValue = state.waypointLoadLevel == null ? null : String(state.waypointLoadLevel);
      $$('input[name="waypointLoad"]').forEach((input) => {
        input.checked = loadValue !== null && input.value === loadValue;
      });

      $$('input[name="waypointNoElevator"]').forEach((input) => {
        input.checked = input.value === (state.waypointNoElevator ? "1" : "0");
      });
      if (waypointFloorBody) waypointFloorBody.hidden = !state.waypointNoElevator;
      if (waypointFloorInput) waypointFloorInput.value = String(toInt(state.waypointFloor, 1));

      $$('input[name="waypointLadderEnabled"]').forEach((input) => {
        input.checked = input.value === (state.waypointLadderEnabled ? "1" : "0");
      });
      if (waypointLadderBody) waypointLadderBody.hidden = !state.waypointLadderEnabled;
      if (waypointLadderFloorInput) waypointLadderFloorInput.value = String(toInt(state.waypointLadderFloor, 6));

      waypointModalStep = 0;
      renderWaypointModalStep();
      renderAll();
    }

    function openWaypointSetupModal() {
      syncWaypointSetupModal();
      openModal("waypointSetupModal");
    }

    $("#openWaypointSetupModalBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openWaypointSetupModal();
    });

    waypointPrevBtn?.addEventListener("click", () => {
      if (waypointModalStep <= 0) {
        closeModal("waypointSetupModal");
        return;
      }
      waypointModalStep -= 1;
      renderWaypointModalStep();
    });

    waypointNextBtn?.addEventListener("click", () => {
      if (waypointModalStep >= waypointPanels.length - 1) {
        renderAll();
        closeModal("waypointSetupModal");
        return;
      }
      waypointModalStep += 1;
      renderWaypointModalStep();
    });

    $$('input[name="waypointLoad"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        if (!e.target.checked) return;
        state.waypointLoadLevel = toInt(e.target.value, 0);
        renderAll();
      });
    });

    $$('input[name="waypointNoElevator"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        if (!e.target.checked) return;
        state.waypointNoElevator = e.target.value === "1";
        if (waypointFloorBody) waypointFloorBody.hidden = !state.waypointNoElevator;
        renderAll();
      });
    });

    $$('input[name="waypointLadderEnabled"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        if (!e.target.checked) return;
        state.waypointLadderEnabled = e.target.value === "1";
        if (waypointLadderBody) waypointLadderBody.hidden = !state.waypointLadderEnabled;
        renderAll();
      });
    });

    waypointModal?.querySelectorAll('.minus[data-target], .plus[data-target]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = targetId ? document.getElementById(targetId) : null;
        if (!input) return;
        const delta = btn.classList.contains("minus") ? -1 : 1;
        const current = toInt(input.value, toInt(input.getAttribute("min"), 0));
        setStepperValue(input, current + delta);
      });
    });


    /* =========================================================
       Popup (season -> exit intent)
    ========================================================= */
    const seasonPopup = $("#seasonPopup");
    const popupToday = $("#popupToday");
    const popupGoQuote = $("#popupGoQuote");
    let popupArmed = false;
    let popupShown = false;
    let backGuardArmed = false;

    function popupKey() {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `ddlogi_popup_hide_${yyyy}${mm}${dd}`;
    }

    function shouldBlockToday() {
      try {
        return !!localStorage.getItem(popupKey());
      } catch (_) {
        return false;
      }
    }

    function isMobileViewport() {
      return window.matchMedia('(max-width: 900px)').matches || 'ontouchstart' in window;
    }

    function openSeasonPopup() {
      if (!seasonPopup || popupShown || !popupArmed || shouldBlockToday()) return;
      popupShown = true;
      seasonPopup.setAttribute("aria-hidden", "false");
      seasonPopup.classList.add("open");
    }

    function closeSeasonPopup() {
      if (!seasonPopup) return;
      seasonPopup.setAttribute("aria-hidden", "true");
      seasonPopup.classList.remove("open");
    }

    if (seasonPopup) {
      setTimeout(() => {
        popupArmed = true;

        if (!isMobileViewport()) {
          document.addEventListener('mouseout', (e) => {
            if (!popupArmed || popupShown || shouldBlockToday()) return;
            const to = e.relatedTarget || e.toElement;
            if (to) return;
            if (typeof e.clientY === 'number' && e.clientY <= 0) openSeasonPopup();
          });
        } else if (!backGuardArmed) {
          backGuardArmed = true;
          try {
            history.pushState({ ddlogiExitGuard: true }, '', location.href);
          } catch (_) {}

          window.addEventListener('popstate', () => {
            if (!popupArmed || popupShown || shouldBlockToday()) return;
            try {
              history.pushState({ ddlogiExitGuard: true }, '', location.href);
            } catch (_) {}
            openSeasonPopup();
          });
        }
      }, 5000);

      $$('[data-popup-close]').forEach((x) => x.addEventListener('click', closeSeasonPopup));

      popupGoQuote?.addEventListener('click', () => {
        closeSeasonPopup();
        const smsBtn = $("#smsShareBtn");
        if (smsBtn) {
          smsBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          $("#heroStartBtn")?.click();
        }
      });

      popupToday?.addEventListener('change', (e) => {
        if (e.target.checked) {
          try {
            localStorage.setItem(popupKey(), '1');
          } catch (_) {}
        } else {
          try {
            localStorage.removeItem(popupKey());
          } catch (_) {}
        }
      });
    }

    /* =========================================================
       Inputs binding (MOVE)
    ========================================================= */
    $$(".vehicle").forEach((v) => {
      v.addEventListener("click", () => {
        state.vehicle = v.getAttribute("data-vehicle") || "";
        $$(".vehicle").forEach((x) => x.classList.remove("selected"));
        v.classList.add("selected");
        renderAll();
      });
    });

    $("#startAddress")?.addEventListener("input", (e) => { state.startAddress = e.target.value.trim(); invalidateDistanceIfRouteChanged(); });
    $("#waypointAddress")?.addEventListener("input", (e) => { state.waypointAddress = e.target.value.trim(); invalidateDistanceIfRouteChanged(); });
    $("#endAddress")?.addEventListener("input", (e) => { state.endAddress = e.target.value.trim(); invalidateDistanceIfRouteChanged(); });

    $("#hasWaypoint")?.addEventListener("change", (e) => {
      state.hasWaypoint = !!e.target.checked;
      const wrap = $("#waypointWrap");
      if (wrap) wrap.style.display = state.hasWaypoint ? "" : "none";

      // waypoint on/off 전환 시 nested modal 상태가 남아 있으면
      // 메인 가구/가전 모달 클릭이 죽는 케이스가 있어서 항상 초기화
      closeModal("itemsModal");
      closeModal("throwModal");
      resetItemsModalToMainContext();
      resetThrowModalToMainContext();

      if (!state.hasWaypoint) {
        state.waypointAddress = "";
        state.waypointLoadLevel = null;
        state.waypointNoElevator = false;
        state.waypointFloor = 1;
        state.waypointLadderEnabled = false;
        state.waypointLadderFloor = 6;
        state.waypointItems = {};
        state.waypointItemsNote = "";
        state.waypointThrow = {};
        state.waypointThrowNote = "";
        closeModal("waypointSetupModal");
      }
      invalidateDistanceIfRouteChanged();
      renderAll();
    });

    let kakaoReady = false;
    function ensureKakaoReady(cb) {
      if (kakaoReady) return cb();
      if (!window.kakao || !window.kakao.maps) {
        showToast("카카오맵 SDK 로딩에 실패했어. 잠깐 뒤 새로고침 해줘.", "error");
        return;
      }
      window.kakao.maps.load(() => {
        kakaoReady = true;
        cb();
      });
    }

    function haversineKm(a, b) {
      const R = 6371;
      const toRad = (x) => (x * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
      return R * c;
    }


    function currentRouteKey() {
      return JSON.stringify({
        start: (state.startAddress || "").trim(),
        waypoint: state.hasWaypoint ? (state.waypointAddress || "").trim() : "",
        end: (state.endAddress || "").trim(),
        hasWaypoint: !!state.hasWaypoint,
      });
    }

    function invalidateDistanceIfRouteChanged() {
      const nextKey = currentRouteKey();
      if (state.lastDistanceRouteKey && state.lastDistanceRouteKey !== nextKey) {
        state.distanceKm = 0;
      }
      if (!state.startAddress || !state.endAddress || (state.hasWaypoint && !state.waypointAddress)) {
        state.distanceKm = 0;
      }
      renderAll();
    }

    function geocode(geocoder, addr) {
      return new Promise((resolve, reject) => {
        if (!addr) return reject(new Error("empty address"));
        geocoder.addressSearch(addr, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result && result[0]) {
            resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
          } else {
            reject(new Error("geocode failed"));
          }
        });
      });
    }

    async function calcDistanceKm() {
      const start = state.startAddress;
      const end = state.endAddress;
      const wp = state.hasWaypoint ? state.waypointAddress : "";

      if (!start || !end) {
        showToast("출발지/도착지 주소를 입력해줘.", "error");
        return;
      }
      if (state.hasWaypoint && !wp) {
        showToast("경유지 체크했으면 경유지 주소도 입력해줘.", "error");
        return;
      }

      const distanceText = $("#distanceText");
      const calcBtn = $("#calcDistance");
      const originalBtnText = calcBtn?.textContent || "거리 계산하기";
      if (calcBtn) { calcBtn.disabled = true; calcBtn.innerHTML = '계산 중 <span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>'; }
      if (distanceText) distanceText.textContent = "계산 중...";

      ensureKakaoReady(async () => {
        try {
          const geocoder = new window.kakao.maps.services.Geocoder();

          const a = await geocode(geocoder, start);
          const b = state.hasWaypoint ? await geocode(geocoder, wp) : null;
          const c = await geocode(geocoder, end);

          let base = 0;
          if (b) base = haversineKm(a, b) + haversineKm(b, c);
          else base = haversineKm(a, c);

          const roadish = base * 1.25;
          state.distanceKm = Math.max(0, Math.round(roadish * 10) / 10);
          state.lastDistanceRouteKey = currentRouteKey();

          if (distanceText) distanceText.textContent = `${state.distanceKm} km`;
          renderAll();
        } catch (e) {
          console.error(e);
          state.distanceKm = 0;
          state.lastDistanceRouteKey = "";
          if (distanceText) distanceText.textContent = "주소를 다시 확인해주세요.";
          const hasDetail = isLikelyDetailedAddress(start) || isLikelyDetailedAddress(end) || (state.hasWaypoint && isLikelyDetailedAddress(wp));
          if (hasDetail) showAddressGuidePopup();
          else showToast("거리 계산에 실패했어요. 도로명이나 건물명 기준으로 다시 넣어주세요.", "error");
        } finally {
          if (calcBtn) { calcBtn.disabled = false; calcBtn.textContent = originalBtnText; }
        }
      });
    }

    $("#calcDistance")?.addEventListener("click", calcDistanceKm);

    /* =========================================================
       Reservation bindings (common)
    ========================================================= */
    $("#moveDate")?.addEventListener("change", async (e) => {
      state.moveDate = e.target.value || "";
      await refreshTimeSlotAvailability();
      renderAll();
    });

    $$('input[name="timeSlot"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.timeSlot = String(e.target.value);
        renderAll();
      });
    });

    /* =========================================================
       Move type + storage
    ========================================================= */
    $$('input[name="moveType"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (!e.target.checked) return;
        state.moveType = e.target.value;
        setHidden($("#storageBody"), state.moveType !== "storage");
        renderAll();
      });
    });

    $$('input[name="storageBase"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.storageBase = e.target.value;
        renderAll();
      });
    });

    /* =========================================================
       Steppers (generic)
    ========================================================= */
    function setStepperValue(inputEl, nextVal) {
      if (!inputEl) return;
      const min = toInt(inputEl.getAttribute("min"), 0);
      const max = toInt(inputEl.getAttribute("max"), 999999);
      const v = clamp(toInt(nextVal, min), min, max);
      inputEl.value = String(v);
      const id = inputEl.id;

      if (id === "storageDays") state.storageDays = v;
      if (id === "fromFloor") state.fromFloor = v;
      if (id === "toFloor") state.toFloor = v;
      if (id === "ladderFromFloor") state.ladderFromFloor = v;
      if (id === "ladderToFloor") state.ladderToFloor = v;
      if (id === "ride") state.ride = v;
      if (id === "waypointFloor") state.waypointFloor = v;
      if (id === "waypointLadderFloor") state.waypointLadderFloor = v;

      if (id === "cleanPyeong" || id === "moveCleanPyeong") state.cleanPyeong = v;
      if (id === "cleanRooms" || id === "moveCleanRooms") state.cleanRooms = v;
      if (id === "cleanBaths" || id === "moveCleanBaths") state.cleanBaths = v;
      if (id === "cleanBalconies" || id === "moveCleanBalconies") state.cleanBalconies = v;
      if (id === "cleanWardrobes" || id === "moveCleanWardrobes") state.cleanWardrobes = v;
      if (id === "cleanFloor" || id === "moveCleanFloor") state.cleanFloor = v;
      if (id === "cleanOuterWindowPyeong" || id === "moveCleanOuterWindowPyeong") state.cleanOuterWindowPyeong = v;
      if (id === "cleanTrashBags" || id === "moveCleanTrashBags") state.cleanTrashBags = v;

      renderAll();
    }

    $$(".stepper-btn[data-stepper]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-stepper");
        const dir = toInt(btn.getAttribute("data-dir"), 0);
        const input = document.getElementById(id);
        if (!input) return;
        const cur = toInt(input.value, toInt(input.getAttribute("min"), 0));
        setStepperValue(input, cur + dir);
      });
    });

    [
      "storageDays",
      "fromFloor",
      "toFloor",
      "ladderFromFloor",
      "ladderToFloor",
      "ride",
      "waypointFloor",
      "waypointLadderFloor",
      "cleanPyeong",
      "cleanRooms",
      "cleanBaths",
      "cleanBalconies",
      "cleanWardrobes",
      "cleanFloor",
      "cleanOuterWindowPyeong",
      "cleanTrashBags",
      "moveCleanPyeong",
      "moveCleanRooms",
      "moveCleanBaths",
      "moveCleanBalconies",
      "moveCleanWardrobes",
      "moveCleanFloor",
      "moveCleanOuterWindowPyeong",
      "moveCleanTrashBags",
    ].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener("input", (e) => setStepperValue(el, e.target.value));
    });

    /* =========================================================
       Elevator toggles (move)
    ========================================================= */
    $("#noFrom")?.addEventListener("change", (e) => {
      state.noFrom = !!e.target.checked;
      renderAll();
    });
    $("#noTo")?.addEventListener("change", (e) => {
      state.noTo = !!e.target.checked;
      renderAll();
    });

    /* =========================================================
       Load radio (move)
    ========================================================= */
    $$('input[name="load"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.loadLevel = toInt(e.target.value, 0);
        renderAll();
      });
    });

    /* =========================================================
       Cant carry / helpers (move)
    ========================================================= */
    $("#cantCarryFrom")?.addEventListener("change", (e) => {
      state.cantCarryFrom = !!e.target.checked;
      renderAll();
    });
    $("#cantCarryTo")?.addEventListener("change", (e) => {
      state.cantCarryTo = !!e.target.checked;
      renderAll();
    });

    $("#helperFrom")?.addEventListener("change", (e) => {
      state.helperFrom = !!e.target.checked;
      renderAll();
    });
    $("#helperTo")?.addEventListener("change", (e) => {
      state.helperTo = !!e.target.checked;
      renderAll();
    });

    /* =========================================================
       Ladder toggles (move)
    ========================================================= */
    $("#ladderFromEnabled")?.addEventListener("change", (e) => {
      state.ladderFromEnabled = !!e.target.checked;
      setHidden($("#ladderFromBody"), !state.ladderFromEnabled);
      renderAll();
    });
    $("#ladderToEnabled")?.addEventListener("change", (e) => {
      state.ladderToEnabled = !!e.target.checked;
      setHidden($("#ladderToBody"), !state.ladderToEnabled);
      renderAll();
    });

    /* =========================================================
       Extra options (move)
    ========================================================= */
    $("#night")?.addEventListener("change", (e) => {
      state.night = !!e.target.checked;
      renderAll();
    });

    const cleaningToggleEl = $("#cleaningToggle");
    if (cleaningToggleEl) {
      cleaningToggleEl.checked = false;
      cleaningToggleEl.disabled = false;
      cleaningToggleEl.addEventListener("change", (e) => {
        state.cleaningToggle = !!e.target.checked;
        setHidden($("#cleaningBody"), !state.cleaningToggle);
        renderAll();
      });
    }
    state.cleaningToggle = false;
    state.cleaningFrom = false;
    state.cleaningTo = false;
    state.cleaningType = "light";

    /* =========================================================
       Throw toggle (move)
    ========================================================= */
    $("#throwToggle")?.addEventListener("change", (e) => {
      state.throwToggle = !!e.target.checked;
      const wrap = $("#throwMiniWrap");
      if (wrap) wrap.style.display = state.throwToggle ? "" : "none";
      renderAll();
    });

    $("#workFrom")?.addEventListener("change", (e) => {
      state.workFrom = !!e.target.checked;
      renderAll();
    });
    $("#workTo")?.addEventListener("change", (e) => {
      state.workTo = !!e.target.checked;
      renderAll();
    });

    /* =========================================================
       Items modal steppers (move items)
    ========================================================= */
    function setItemQty(itemKey, qty) {
      const k = safeText(itemKey);
      const q = Math.max(0, toInt(qty, 0));
      if (!k) return;
      const target = getItemsStateTarget();
      if (q <= 0) delete target[k];
      else target[k] = q;

      if (itemsModalContext === "main" && k === "침대매트리스(킹제외)") {
        const total = q;
        const sumSizes = Object.values(state.mattressSizes).reduce((a, b) => a + toInt(b, 0), 0);
        if (total > 0 && sumSizes === 0) openModal("mattressSizeModal");

        if (sumSizes > total) {
          state.mattressSizes.S = 0;
          state.mattressSizes.SS = 0;
          state.mattressSizes.D = 0;
          state.mattressSizes.Q = 0;
          state.mattressSizes.K = 0;
        }

        if (total <= 0) {
          state.mattressSizes.S = 0;
          state.mattressSizes.SS = 0;
          state.mattressSizes.D = 0;
          state.mattressSizes.Q = 0;
          state.mattressSizes.K = 0;
        }
      }
    }

    function handleItemStepperButton(btn) {
      const item = btn?.getAttribute("data-stepper-item");
      const dir = toInt(btn?.getAttribute("data-dir"), 0);
      if (!item || !dir) return false;
      const modal = btn.closest(".modal") || document;
      const inp = modal.querySelector('.itemQty[data-item="' + item + '"]');
      if (!inp) return false;
      const cur = toInt(inp.value, 0);
      const next = Math.min(20, Math.max(0, cur + dir));
      inp.value = String(next);
      setItemQty(item, next);
      renderAll();
      return true;
    }

    function handleItemQtyInput(inp) {
      const item = inp?.getAttribute("data-item");
      if (!item) return false;
      const next = Math.min(20, Math.max(0, toInt(inp.value, 0)));
      inp.value = String(next);
      setItemQty(item, next);
      renderAll();
      return true;
    }

    // item modal controls are handled by delegated listeners below

    $("#itemsNote")?.addEventListener("input", (e) => {
      state[getItemsNoteTarget()] = e.target.value || "";
      renderAll();
    });

    /* =========================================================
       Mattress size modal (optional)
    ========================================================= */
    function totalMattressQty() {
      return toInt(state.items["침대매트리스(킹제외)"], 0);
    }

    function totalMattressSizeQty() {
      return Object.values(state.mattressSizes || {}).reduce((a, b) => a + toInt(b, 0), 0);
    }

    function syncMattressModalFromState() {
      document.querySelectorAll('#mattressSizeModal input[data-size]').forEach((inp) => {
        const size = inp.getAttribute("data-size");
        inp.value = String(toInt(state.mattressSizes?.[size], 0));
      });
    }

    function commitMattressSizesToItems() {
      const sumSizes = totalMattressSizeQty();
      const target = getItemsStateTarget();
      if (itemsModalContext === "main") {
        if (sumSizes <= 0) {
          delete target["침대매트리스(킹제외)"];
        } else {
          target["침대매트리스(킹제외)"] = sumSizes;
        }
      } else {
        if (sumSizes <= 0) {
          delete target["침대매트리스(킹제외)"];
        } else {
          target["침대매트리스(킹제외)"] = sumSizes;
        }
      }

      const mainMattressInput = document.querySelector('#itemsModal .itemQty[data-item="침대매트리스(킹제외)"]');
      if (mainMattressInput && itemsModalContext === "main") {
        mainMattressInput.value = String(sumSizes);
      }
    }

    function setMattressSize(sizeKey, qty) {
      const key = String(sizeKey);
      const v = Math.max(0, toInt(qty, 0));
      state.mattressSizes[key] = v;

      const total = totalMattressQty();
      const sum = Object.values(state.mattressSizes).reduce((a, b) => a + toInt(b, 0), 0);
      if (sum > total) {
        state.mattressSizes[key] = Math.max(0, v - (sum - total));
      }
    }

    function handleMattressStepperButton(btn) {
      const size = btn?.getAttribute("data-stepper-size");
      const dir = toInt(btn?.getAttribute("data-dir"), 0);
      if (!size || !dir) return false;
      const inp = document.querySelector('#mattressSizeModal input[data-size="' + size + '"]');
      if (!inp) return false;
      const cur = toInt(inp.value, 0);
      const next = Math.max(0, cur + dir);
      inp.value = String(next);
      setMattressSize(size, next);
      renderAll();
      return true;
    }

    function handleMattressSizeInput(inp) {
      const size = inp?.getAttribute("data-size");
      if (!size) return false;
      const next = Math.max(0, toInt(inp.value, 0));
      inp.value = String(next);
      setMattressSize(size, next);
      renderAll();
      return true;
    }

    document.getElementById("saveMattressSizeModal")?.addEventListener("click", () => {
      commitMattressSizesToItems();
      syncItemsModalFromState();
      renderAll();
    });

    // mattress modal controls are handled by delegated listeners below

    /* =========================================================
       Throw modal steppers
    ========================================================= */
    function setThrowQty(loc, itemKey, qty) {
      const where = loc === "to" ? "to" : "from";
      const k = safeText(itemKey);
      const q = Math.max(0, toInt(qty, 0));
      if (!k) return;

      let target;
      if (throwModalContext === "waypoint") {
        target = state.waypointThrow;
      } else {
        target = where === "to" ? state.throwTo : state.throwFrom;
      }
      if (q <= 0) delete target[k];
      else target[k] = q;
    }

    function handleThrowStepperButton(btn) {
      const loc = btn?.getAttribute("data-stepper-loc");
      const item = btn?.getAttribute("data-stepper-item");
      const dir = toInt(btn?.getAttribute("data-dir"), 0);
      if (!loc || !item || !dir) return false;
      const modal = btn.closest(".modal") || document;
      const inp = modal.querySelector(
        '.throwQty[data-loc="' + loc + '"][data-item="' + item + '"]'
      );
      if (!inp) return false;
      const cur = toInt(inp.value, 0);
      const next = Math.max(0, cur + dir);
      inp.value = String(next);
      setThrowQty(loc, item, next);
      renderAll();
      return true;
    }

    function handleThrowQtyInput(inp) {
      const loc = inp?.getAttribute("data-loc");
      const item = inp?.getAttribute("data-item");
      if (!loc || !item) return false;
      const next = Math.max(0, toInt(inp.value, 0));
      inp.value = String(next);
      setThrowQty(loc, item, next);
      renderAll();
      return true;
    }

    // throw modal controls are handled by delegated listeners below

    $("#throwNote")?.addEventListener("input", (e) => {
      if (throwModalContext === "waypoint") state.waypointThrowNote = e.target.value || "";
      else state.throwNote = e.target.value || "";
      renderAll();
    });

    /* =========================================================
       CLEAN bindings
    ========================================================= */
    $$('input[name="cleanType"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.cleanType = e.target.value;
        renderAll();
      });
    });

    $$('input[name="cleanSoil"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.cleanSoil = e.target.value;
        renderAll();
      });
    });

    $$('input[name="moveCleanType"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.cleanType = e.target.value;
        renderAll();
      });
    });

    $$('input[name="moveCleanSoil"]').forEach((r) => {
      r.addEventListener("change", (e) => {
        if (e.target.checked) state.cleanSoil = e.target.value;
        renderAll();
      });
    });

    $("#moveCleanAddress")?.addEventListener("input", (e) => {
      state.cleanAddress = (e.target.value || "").trim();
      renderAll();
    });
    $("#moveCleanAddressNote")?.addEventListener("input", (e) => {
      state.cleanAddressNote = e.target.value || "";
      renderAll();
    });
    $("#moveCleanParkingHard")?.addEventListener("change", (e) => {
      state.cleanParkingHard = !!e.target.checked;
      renderAll();
    });
    $("#moveCleanNoElevator")?.addEventListener("change", (e) => {
      state.cleanNoElevator = !!e.target.checked;
      renderAll();
    });
    $("#moveCleanOuterWindowEnabled")?.addEventListener("change", (e) => {
      state.cleanOuterWindowEnabled = !!e.target.checked;
      setHidden($("#moveCleanOuterWindowBody"), !state.cleanOuterWindowEnabled);
      renderAll();
    });
    $("#moveCleanPhytoncideEnabled")?.addEventListener("change", (e) => {
      state.cleanPhytoncideEnabled = !!e.target.checked;
      renderAll();
    });
    $("#moveCleanDisinfectEnabled")?.addEventListener("change", (e) => {
      state.cleanDisinfectEnabled = !!e.target.checked;
      renderAll();
    });
    $("#moveCleanNote")?.addEventListener("input", (e) => {
      state.cleanNote = e.target.value || "";
      const prev = $("#moveCleanNotePreview");
      if (prev) prev.textContent = `기타사항: ${state.cleanNote.trim() ? state.cleanNote.trim() : "없음"}`;
      renderAll();
    });

    $("#cleanAddress")?.addEventListener("input", (e) => {
      state.cleanAddress = (e.target.value || "").trim();
      renderAll();
    });
    $("#cleanAddressNote")?.addEventListener("input", (e) => {
      state.cleanAddressNote = e.target.value || "";
      renderAll();
    });

    $("#cleanParkingHard")?.addEventListener("change", (e) => {
      state.cleanParkingHard = !!e.target.checked;
      renderAll();
    });
    $("#cleanNoElevator")?.addEventListener("change", (e) => {
      state.cleanNoElevator = !!e.target.checked;
      renderAll();
    });

    $("#cleanOuterWindowEnabled")?.addEventListener("change", (e) => {
      state.cleanOuterWindowEnabled = !!e.target.checked;
      setHidden($("#cleanOuterWindowBody"), !state.cleanOuterWindowEnabled);
      renderAll();
    });

    $("#cleanPhytoncideEnabled")?.addEventListener("change", (e) => {
      state.cleanPhytoncideEnabled = !!e.target.checked;
      renderAll();
    });
    $("#cleanDisinfectEnabled")?.addEventListener("change", (e) => {
      state.cleanDisinfectEnabled = !!e.target.checked;
      renderAll();
    });

    $("#cleanNote")?.addEventListener("input", (e) => {
      state.cleanNote = e.target.value || "";
      const prev = $("#cleanNotePreview");
      if (prev) prev.textContent = `기타사항: ${state.cleanNote.trim() ? state.cleanNote.trim() : "없음"}`;
      renderAll();
    });

    function setCleanQty(group, item, qty) {
      const g = group === "appliance" ? "appliance" : "basic";
      const k = safeText(item);
      const q = Math.max(0, toInt(qty, 0));
      const target = g === "appliance" ? state.cleanAppliance : state.cleanBasic;
      if (!k) return;
      if (q <= 0) delete target[k];
      else target[k] = q;
    }

    function handleCleanStepperButton(btn) {
      const group = btn?.getAttribute("data-clean-group");
      const item = btn?.getAttribute("data-clean-item");
      const dir = toInt(btn?.getAttribute("data-dir"), 0);
      if (!group || !item || !dir) return false;
      const modal = btn.closest(".modal") || document;
      const inp = modal.querySelector(
        '.cleanQty[data-clean-group="' + group + '"][data-clean-item="' + item + '"]'
      );
      if (!inp) return false;
      const cur = toInt(inp.value, 0);
      const next = Math.max(0, cur + dir);
      inp.value = String(next);
      setCleanQty(group, item, next);
      renderAll();
      return true;
    }

    function handleCleanQtyInput(inp) {
      const group = inp?.getAttribute("data-clean-group");
      const item = inp?.getAttribute("data-clean-item");
      if (!group || !item) return false;
      const next = Math.max(0, toInt(inp.value, 0));
      inp.value = String(next);
      setCleanQty(group, item, next);
      renderAll();
      return true;
    }

    // cleaning modal controls are handled by delegated listeners below

    /* =========================================================
       Storage fee model
    ========================================================= */
    function calcStorageFee(days) {
      const d = Math.max(1, toInt(days, 1));
      const day1 = 20000;
      const day2to30 = 12000;
      let fee = day1 + Math.max(0, Math.min(d, 30) - 1) * day2to30;
      if (d >= 30) fee = 370000; // ✅ 상한
      return fee;
    }

    /* =========================================================
       Pricing model
    ========================================================= */
    function moveBaseByVehicle(vehicle) {
      if (vehicle.includes("저상탑") && vehicle.includes("카고")) return 95000;
      if (vehicle.includes("저상탑")) return 50000;
      if (vehicle.includes("카고")) return 50000;
      return 0;
    }

    function moveDistanceFee(km) {
      const d = Math.max(0, toNum(km, 0));
      const a = Math.min(d, 10) * 2000;
      const b = Math.max(0, d - 10) * 1550;
      return a + b;
    }

    function moveLoadFee(level) {
      const map = { 1: 10000, 2: 23000, 3: 40000, 4: 66000 };
      return map[level] ?? 0;
    }

    function stairsFee(noElevator, floor) {
      if (!noElevator) return 0;
      const f = Math.max(1, toInt(floor, 1));
      return Math.max(0, f - 1) * 10000;
    }

    function helperFee(helper) {
      return helper ? HELPER_FEE_PER_PERSON : 0;
    }

    function cantCarryFee(flag) {
      return flag ? 30000 : 0;
    }

    function ladderFee(enabled, floor) {
      if (!enabled) return 0;
      return LADDER_FEE_PER_SPOT;
    }

    function rideFee(n) {
      const x = Math.max(0, toInt(n, 0));
      return x * 20000;
    }

    function moveCleaningFee() {
      if (!state.cleaningToggle) return 0;
      const unit = state.cleaningType === "deep" ? 60000 : 30000;
      let fee = 0;
      if (state.cleaningFrom) fee += unit;
      if (state.cleaningTo) fee += unit;
      return fee;
    }

   function itemsFee(items) {
  let fee = 0;
  const obj = items || {};

  // ✅ 가전·가구 가격표 (필요시 단가 조정 가능)
  const PRICE = {
    // 가전
    "전자레인지": 2500,
    "공기청정기": 5000,
    "청소기": 5000,
    "에어프라이기": 5000,
    "오븐": 15000,
    "로봇청소기": 7000,
    "TV(55이하)": 15000,
    "TV(65이상)": 30000,
    "모니터": 5000,
    "데스크탑": 5000,
    "프린터": 5000,
    "정수기(이동만)": 10000,

    "세탁기(12kg이하)": 30000,
    "세탁기(12kg초과)": 70000,
    "건조기(12kg이하)": 30000,
    "건조기(12kg초과)": 70000,

    "냉장고(380L이하)": 30000,
    "냉장고(600L이하)": 70000,
    "냉장고(600L초과)": 120000,

    "김치냉장고": 50000,
    "스타일러": 120000,
    "안마의자": 120000,
    "가습기(소형)": 3000,
    "가습기(중형)": 5000,
    "제습기(소형)": 7000,
    "제습기(중형)": 10000,

    // 가구
    "의자": 2500,
    "행거": 5000,
    "협탁/사이드테이블(소형)": 10000,
    "화장대(소형)": 10000,
    "책상/테이블(일반)": 10000,
    "전신거울": 10000,
    "식탁(소형)": 20000,
    "식탁(대형)": 40000,
    "서랍장(3~5단)": 10000,
    "책장(일반)": 20000,
    "수납장/TV장(일반)": 20000,

    "소파(2~3인)": 30000,
    "소파(4인이상)": 50000,

    // 침대
    "침대매트리스(킹제외)": 20000,
    "침대프레임(분해/조립)": 40000,
    "기타가전가구(분해/조립)": 20000,

    // 기타 품목
    "자전거": 20000,
    "전기자전거": 35000
  };

  // 항목별 합산
  for (const [rawKey, qtyRaw] of Object.entries(obj)) {
    const k = normalizeItemKey(rawKey);
    const q = toInt(qtyRaw, 0);
    if (q <= 0) continue;
    const unit = PRICE[k] ?? 0;
    fee += unit * q;
  }

  // 매트리스 사이즈별 추가요금(퀸, 킹)
  const m = toInt(obj["침대매트리스(킹제외)"], 0) || toInt(obj[normalizeItemKey("침대 매트리스 (킹 제외)")], 0);
  if (m > 0) {
    const sizes = state.mattressSizes || {};
    fee += toInt(sizes.Q, 0) * 5000;
    fee += toInt(sizes.K, 0) * 10000;
  }

  return fee;
}

    function waypointItemsFeeTotal() {
      if (!state.hasWaypoint) return 0;
      return itemsFee(state.waypointItems);
    }

    function waypointLoadFeeTotal() {
      if (!state.hasWaypoint || state.waypointLoadLevel == null) return 0;
      return moveLoadFee(state.waypointLoadLevel);
    }

    function waypointCarryFeeTotal() {
      if (!state.hasWaypoint) return 0;
      return stairsFee(state.waypointNoElevator, state.waypointFloor);
    }

    function waypointLadderFeeTotal() {
      if (!state.hasWaypoint) return 0;
      return ladderFee(state.waypointLadderEnabled, state.waypointLadderFloor);
    }

    function throwFeeTotal() {
      let total = 0;
      if (state.throwToggle) {
        const base = (state.workFrom ? 20000 : 0) + (state.workTo ? 20000 : 0);
        const sumFrom = Object.values(state.throwFrom).reduce((a, b) => a + toInt(b, 0), 0);
        const sumTo = Object.values(state.throwTo).reduce((a, b) => a + toInt(b, 0), 0);
        total += base + (sumFrom + sumTo) * 5000;
      }
      if (state.hasWaypoint) {
        const wpSum = Object.values(state.waypointThrow).reduce((a, b) => a + toInt(b, 0), 0);
        total += wpSum * 5000;
      }
      return total;
    }

    function calcMovePrice() {
  if (!state.vehicle) return 0;

  const base = moveBaseByVehicle(state.vehicle);
  const load = moveLoadFee(state.loadLevel) + waypointLoadFeeTotal();

  const stairs =
    stairsFee(state.noFrom, state.fromFloor) +
    stairsFee(state.noTo, state.toFloor) +
    waypointCarryFeeTotal();

  const cantCarry =
    cantCarryFee(state.cantCarryFrom) +
    cantCarryFee(state.cantCarryTo);

  const helpers =
    helperFee(state.helperFrom) +
    helperFee(state.helperTo);

  // ✅ 작업비 덩어리(배율 대상)
  let workSubtotal = base + load + stairs + cantCarry;

  // ✅ 배율 제외(인부/사다리차 포함)
  const distance = moveDistanceFee(state.distanceKm);

  const ladders =
    ladderFee(state.ladderFromEnabled, state.ladderFromFloor) +
    ladderFee(state.ladderToEnabled, state.ladderToFloor) +
    waypointLadderFeeTotal();

  const ride = rideFee(state.ride);
  const cleanOpt = moveCleaningFee();
  const items = itemsFee(state.items) + waypointItemsFeeTotal();
  // ensure item cost applied
  const itemsCost = items;

  const throwFee = throwFeeTotal();

  let storageFee = 0;
  if (state.moveType === "storage") {
    storageFee = calcStorageFee(state.storageDays);
  }

  // ✅ 반포장 배율(작업비에만)
  const HALF_MULT = 1.36;
  const isHalf =
    (state.moveType === "half") ||
    (state.moveType === "storage" && state.storageBase === "half");

  if (isHalf) workSubtotal *= HALF_MULT;

  // 보관이사는 "출발지 → 보관창고" + "보관창고 → 도착지" 2회 이동으로 계산
  // 따라서 이동 견적 덩어리를 2배 적용하고, 보관 일수 비용은 별도로 더한다.
  let moveOnlyPrice =
    workSubtotal +
    distance +
    ride +
    cleanOpt +
    items +
    throwFee;

  if (state.moveType === "storage") {
    moveOnlyPrice *= 2;
  }

  let price = (moveOnlyPrice + storageFee) * PRICE_MULTIPLIER;

  price += helpers + ladders;
  return price;
}

    function cleanBasePrice() {
      const p = Math.max(1, toInt(state.cleanPyeong, 9));
      const typeMul =
        state.cleanType === "moveout" ? 1.05 : state.cleanType === "occupied" ? 1.15 : 1.0;
      const soilMul =
        state.cleanSoil === "heavy" ? 1.2 : state.cleanSoil === "normal" ? 1.1 : 1.0;
      const per = 11000;
      const rawBase = p * per * typeMul * soilMul;
      return Math.max(rawBase, getCleanMinimumBasePrice());
    }

    function getCleanMinimumBasePrice() {
      const p = Math.max(1, toInt(state.cleanPyeong, 9));
      const floorByType = {
        movein: [
          { max: 4, amount: 110000 },
          { max: 9, amount: 140000 },
          { max: 18, amount: 180000 },
        ],
        moveout: [
          { max: 4, amount: 120000 },
          { max: 9, amount: 150000 },
          { max: 18, amount: 190000 },
        ],
        occupied: [
          { max: 4, amount: 130000 },
          { max: 9, amount: 160000 },
          { max: 18, amount: 200000 },
        ],
      };
      const rows = floorByType[state.cleanType] || floorByType.movein;
      const matched = rows.find((row) => p <= row.max);
      return matched?.amount || 0;
    }

    function getCleanMinimumGuideText() {
      const p = Math.max(1, toInt(state.cleanPyeong, 9));
      if (p <= 4) return "4평 이하 최소금액 11만원부터 반영돼요.";
      if (p <= 9) return "9평 이하 원룸 기준 최소금액이 반영돼요.";
      if (p <= 18) return "10~18평 구간 최소금액이 반영돼요.";
      return "평수와 옵션에 맞춰 바로 계산돼요.";
    }

    function cleanOptionPrice() {
      let fee = 0;
      if (state.cleanParkingHard) fee += 10000;
      if (state.cleanNoElevator) fee += Math.max(0, toInt(state.cleanFloor, 1) - 1) * 7000;
      if (state.cleanOuterWindowEnabled) fee += Math.max(0, toInt(state.cleanOuterWindowPyeong, 0)) * 8000;
      if (state.cleanPhytoncideEnabled) fee += 30000;
      if (state.cleanDisinfectEnabled) fee += 30000;
      fee += Math.max(0, toInt(state.cleanTrashBags, 0)) * 2000;
      fee += Math.max(0, toInt(state.cleanWardrobes, 0)) * 8000;
      fee += Math.max(0, toInt(state.cleanRooms, 1) - 1) * 7000;
      fee += Math.max(0, toInt(state.cleanBaths, 1) - 1) * 12000;
      fee += Math.max(0, toInt(state.cleanBalconies, 0)) * 5000;

      const basic = state.cleanBasic || {};
      const appliance = state.cleanAppliance || {};

      fee += toInt(basic["곰팡이제거"], 0) * 15000;
      fee += toInt(basic["스티커제거"], 0) * 10000;
      fee += toInt(basic["페인트잔여"], 0) * 15000;
      fee += toInt(basic["니코틴케어"], 0) * 25000;
      fee += toInt(basic["반려동물케어"], 0) * 25000;
      fee += toInt(basic["피톤치드(평)"], 0) * 3000;

      fee += toInt(appliance["에어컨(벽걸이)"], 0) * 70000;
      fee += toInt(appliance["에어컨(스탠드)"], 0) * 90000;
      fee += toInt(appliance["에어컨(천장1way)"], 0) * 120000;
      fee += toInt(appliance["에어컨(천장4way)"], 0) * 150000;
      fee += toInt(appliance["세탁기청소"], 0) * 60000;
      fee += toInt(appliance["건조기청소"], 0) * 60000;
      fee += toInt(appliance["냉장고청소"], 0) * 70000;
      fee += toInt(appliance["후드청소"], 0) * 50000;
      fee += toInt(appliance["매트리스청소"], 0) * 40000;
      fee += toInt(appliance["소파청소"], 0) * 50000;
      fee += toInt(appliance["비데청소"], 0) * 30000;

      return fee;
    }

    function calcCleanDisplayPrice() {
      return calcCleanPrice() * DISPLAY_MULTIPLIER;
    }

    function moveHelperCount() {
      return Number(!!state.helperFrom) + Number(!!state.helperTo);
    }

    function moveLadderCount() {
      return Number(!!state.ladderFromEnabled) + Number(!!state.ladderToEnabled) + Number(!!state.waypointLadderEnabled);
    }

    function buildMovePricingBreakdown(totalPrice, options = {}) {
      const safeTotal = Math.max(0, Math.round(Number(totalPrice) || 0));
      const helperCount = moveHelperCount();
      const ladderCount = moveLadderCount();
      const baseDeposit = Math.round(safeTotal * MOVE_DEPOSIT_RATE);
      const helperDepositAddon = helperCount * HELPER_DEPOSIT_ADDON_PER_PERSON;
      const deposit = Math.min(safeTotal, baseDeposit + helperDepositAddon);
      const balance = Math.max(0, safeTotal - deposit);
      const helperCustomerAmount = helperCount * HELPER_FEE_PER_PERSON;
      const helperDriverAmount = helperCount * HELPER_DRIVER_SETTLEMENT_PER_PERSON;
      const ladderCustomerAmount = ladderCount * LADDER_FEE_PER_SPOT;
      const ladderDriverAmount = ladderCount * LADDER_DRIVER_SETTLEMENT_PER_SPOT;
      const specialCustomerAmount = helperCustomerAmount + ladderCustomerAmount;
      const specialDriverAmount = helperDriverAmount + ladderDriverAmount;
      const specialCompanyAmount = Math.max(0, specialCustomerAmount - specialDriverAmount);
      const coreTotal = Math.max(0, safeTotal - specialCustomerAmount);
      const coreCompanyAmount = Math.round(coreTotal * 0.2);
      const coreDriverAmount = Math.max(0, coreTotal - coreCompanyAmount);
      const companyAmount = coreCompanyAmount + specialCompanyAmount;
      const driverAmount = coreDriverAmount + specialDriverAmount;

      return {
        total: safeTotal,
        deposit,
        balance,
        companyAmount,
        driverAmount,
        helperCount,
        ladderCount,
        helperCustomerAmount,
        ladderCustomerAmount,
        pricingPolicy: {
          depositRate: MOVE_DEPOSIT_RATE,
          helperDepositAddonPerPerson: HELPER_DEPOSIT_ADDON_PER_PERSON,
        },
        settlement: {
          helperDepositAddon,
          helperDriverBalancePortion: helperCount * HELPER_DRIVER_SETTLEMENT_PER_PERSON,
          ladderCustomerAmount,
          ladderDriverAmount,
          specialCompanyAmount,
          channel: options.channel || "direct",
        },
      };
    }

    function buildCurrentPricingBreakdown(options = {}) {
      if (state.activeService === SERVICE.MOVE) {
        const displayTotal = calcCurrentPrice() * DISPLAY_MULTIPLIER;
        return buildMovePricingBreakdown(displayTotal, options);
      }

      if (state.activeService === SERVICE.CLEAN) {
        const total = Math.max(0, Math.round(calcCleanDisplayPrice()));
        const deposit = Math.round(total * MOVE_DEPOSIT_RATE);
        return {
          total,
          deposit,
          balance: Math.max(0, total - deposit),
          helperCount: 0,
          pricingPolicy: {
            depositRate: MOVE_DEPOSIT_RATE,
            helperDepositAddonPerPerson: 0,
          },
          settlement: {
            helperDepositAddon: 0,
            helperDriverBalancePortion: 0,
            channel: options.channel || "direct",
          },
        };
      }

      return {
        total: 0,
        deposit: 0,
        balance: 0,
        helperCount: 0,
        pricingPolicy: {
          depositRate: MOVE_DEPOSIT_RATE,
          helperDepositAddonPerPerson: 0,
        },
        settlement: {
          helperDepositAddon: 0,
          helperDriverBalancePortion: 0,
          channel: options.channel || "direct",
        },
      };
    }

    window.DDLOGI_PRICING = {
      buildCurrentPricingBreakdown,
      buildMovePricingBreakdown,
      constants: {
        depositRate: MOVE_DEPOSIT_RATE,
        helperFeePerPerson: HELPER_FEE_PER_PERSON,
        helperDriverSettlementPerPerson: HELPER_DRIVER_SETTLEMENT_PER_PERSON,
        helperDepositAddonPerPerson: HELPER_DEPOSIT_ADDON_PER_PERSON,
      },
    };

    function calcCleanDeposit() {
      return buildCurrentPricingBreakdown().deposit;
    }

    function calcCleanBalance() {
      return buildCurrentPricingBreakdown().balance;
    }

    function calcCleanPrice() {
      let price = 0;
      price += cleanBasePrice();
      price += cleanOptionPrice();
      price *= PRICE_MULTIPLIER;
      return price;
    }

    function calcCurrentPrice() {
      if (state.activeService === SERVICE.MOVE) return calcMovePrice();
      if (state.activeService === SERVICE.CLEAN) return calcCleanPrice();
      return 0;
    }

    /* =========================================================
       Summaries helpers  (✅ 여기로 빼서 문법 깨짐 방지)
    ========================================================= */
    function summarizeDict(obj) {
      const entries = Object.entries(obj || {}).filter(([, v]) => toInt(v, 0) > 0);
      if (!entries.length) return "선택 없음";
      // ✅ 요약에서 "외 N개"로 잘라내지 않고, 선택한 항목을 전부 보여줍니다.
      return entries.map(([k, v]) => `${k}×${toInt(v, 0)}`).join(", ");
    }

    function summarizeMattressSizes() {
      const sizes = state.mattressSizes || {};
      const order = ["S", "SS", "D", "Q", "K"];
      const parts = order
        .map((k) => (toInt(sizes[k], 0) > 0 ? `${k}×${toInt(sizes[k], 0)}` : null))
        .filter(Boolean);
      return parts.length ? `(${parts.join(", ")})` : "";
    }

    function summarizeItemsWithMattress(itemsObj) {
      const obj = itemsObj || {};
      const entries = Object.entries(obj).filter(([, v]) => toInt(v, 0) > 0);
      if (!entries.length) return "선택 없음";

      // ✅ "외 N개"로 잘라내지 않고, 선택한 항목을 전부 보여줍니다.
      const all = entries
        .map(([k, v]) => {
          const qty = toInt(v, 0);
          if (k === "침대매트리스(킹제외)") {
            const sizesText = summarizeMattressSizes();
            const displayKey = "침대매트리스";
            return sizesText ? `${displayKey}×${qty} ${sizesText}` : `${displayKey}×${qty}`;
          }
          return `${k}×${qty}`;
        })
        .join(", ");

      return all;
    }

    /* =========================================================
       Mini summaries + main summary
    ========================================================= */
    function renderMiniSummaries() {
      const itemsMini = $("#itemsMiniSummary");
      if (itemsMini) itemsMini.textContent = summarizeItemsWithMattress(state.items);

      const mattressQtyHint = $("#mattressQtyHint");
      if (mattressQtyHint) {
        const total = totalMattressQty();
        const sizes = totalMattressSizeQty();
        if (total <= 0) {
          mattressQtyHint.textContent = "※ 매트리스 수량을 늘리면 사이즈 선택도 같이 맞춰주세요.";
        } else if (sizes !== total) {
          mattressQtyHint.textContent = `※ 매트리스 ${total}개 중 사이즈 선택은 ${sizes}개예요. 수량을 추가하면 사이즈도 다시 맞춰주세요.`;
        } else {
          mattressQtyHint.textContent = `※ 매트리스 ${total}개 사이즈 선택이 맞춰졌어요. 수량을 바꾸면 다시 확인해주세요.`;
        }
      }

      const itemsNotePrev = $("#itemsNotePreview");
      if (itemsNotePrev) itemsNotePrev.textContent = `기타사항: ${state.itemsNote.trim() ? state.itemsNote.trim() : "없음"}`;

      const loadMap = { 0: "없음", 1: "1~5개", 2: "6~10개", 3: "11~15개", 4: "16~20개" };
      const waypointLoadText = state.waypointLoadLevel === null ? "선택 없음" : (loadMap[state.waypointLoadLevel] || "선택 없음");
      const waypointItemsText = summarizeItemsWithMattress(state.waypointItems);
      const waypointItemsNoteText = `경유지 짐 기타사항: ${state.waypointItemsNote.trim() ? state.waypointItemsNote.trim() : "없음"}`;
      const waypointThrowText = `경유지 버려주세요: ${summarizeDict(state.waypointThrow)}`;
      const waypointThrowNoteText = `경유지 버려주세요 기타사항: ${state.waypointThrowNote.trim() ? state.waypointThrowNote.trim() : "없음"}`;

      [$("#waypointLoadMiniSummary")].filter(Boolean).forEach((el) => el.textContent = `경유지 짐양: ${waypointLoadText}`);
      [$("#waypointItemsMiniSummary"), $("#waypointItemsMiniSummaryModal")].filter(Boolean).forEach((el) => el.textContent = `경유지 가구·가전: ${waypointItemsText}`);
      [$("#waypointItemsNotePreview"), $("#waypointItemsNotePreviewModal")].filter(Boolean).forEach((el) => el.textContent = waypointItemsNoteText);
      [$("#waypointThrowMiniSummary"), $("#waypointThrowMiniSummaryModal")].filter(Boolean).forEach((el) => el.textContent = waypointThrowText);
      [$("#waypointThrowNotePreview"), $("#waypointThrowNotePreviewModal")].filter(Boolean).forEach((el) => el.textContent = waypointThrowNoteText);

      const waypointCarryMini = $("#waypointCarryMiniSummary");
      if (waypointCarryMini) waypointCarryMini.textContent = `경유지 계단: ${state.waypointNoElevator ? `엘리베이터 없음 (${state.waypointFloor}층)` : "엘리베이터 있음"}`;

      const waypointLadderMini = $("#waypointLadderMiniSummary");
      if (waypointLadderMini) waypointLadderMini.textContent = `경유지 사다리차: ${state.waypointLadderEnabled ? `${state.waypointLadderFloor}층` : "불필요"}`;

      const throwMini = $("#throwMiniSummary");
      if (throwMini) {
        const from = summarizeDict(state.throwFrom);
        const to = summarizeDict(state.throwTo);
        if (from === "선택 없음" && to === "선택 없음") throwMini.textContent = "선택 없음";
        else throwMini.textContent = `출발: ${from} / 도착: ${to}`;
      }

      const throwNotePrev = $("#throwNotePreview");
      if (throwNotePrev) throwNotePrev.textContent = `기타사항: ${state.throwNote.trim() ? state.throwNote.trim() : "없음"}`;

      const cleanBasicMini = $("#cleanBasicMiniSummary");
      if (cleanBasicMini) cleanBasicMini.textContent = summarizeDict(state.cleanBasic);
      const moveCleanBasicMini = $("#moveCleanBasicMiniSummary");
      if (moveCleanBasicMini) moveCleanBasicMini.textContent = summarizeDict(state.cleanBasic);

      const cleanApplianceMini = $("#cleanApplianceMiniSummary");
      if (cleanApplianceMini) cleanApplianceMini.textContent = summarizeDict(state.cleanAppliance);
      const moveCleanApplianceMini = $("#moveCleanApplianceMiniSummary");
      if (moveCleanApplianceMini) moveCleanApplianceMini.textContent = summarizeDict(state.cleanAppliance);

      const cleanNotePrev = $("#cleanNotePreview");
      if (cleanNotePrev) cleanNotePrev.textContent = `기타사항: ${state.cleanNote.trim() ? state.cleanNote.trim() : "없음"}`;
      const moveCleanNotePrev = $("#moveCleanNotePreview");
      if (moveCleanNotePrev) moveCleanNotePrev.textContent = `기타사항: ${state.cleanNote.trim() ? state.cleanNote.trim() : "없음"}`;
    }

    function buildSummaryText() {
      const svc = state.activeService;
      if (!svc) return "조건을 선택해보세요.";

      if (svc === SERVICE.MOVE) {
        const lines = [];
        lines.push(`서비스: 이사·용달`);
        if (state.vehicle) lines.push(`차량: ${state.vehicle}`);

        if (state.moveType) {
          const mt =
            state.moveType === "general" ? "일반이사" :
            state.moveType === "half" ? "반포장이사" :
            "보관이사";
          lines.push(`이사 방식: ${mt}`);

          if (state.moveType === "storage") {
            const sb = state.storageBase === "half" ? "보관-반포장" : "보관-일반";
            lines.push(`보관 타입: ${sb}`);
            lines.push(`보관 일수: ${state.storageDays}일 (상한 37만원)`);
          }
        }

        if (state.moveDate) lines.push(`일정: ${state.moveDate} / ${state.timeSlot ? state.timeSlot + "시" : "시간 미선택"}`);
        if (state.distanceKm > 0) lines.push(`거리: ${state.distanceKm} km`);
        if (state.hasWaypoint) lines.push(`경유지: ${state.waypointAddress || "-"}`);

        if (state.noFrom) lines.push(`출발: 엘베없음 ${state.fromFloor}층`);
        else lines.push(`출발: 엘베있음`);

        if (state.noTo) lines.push(`도착: 엘베없음 ${state.toFloor}층`);
        else lines.push(`도착: 엘베있음`);

        if (state.loadLevel > 0) {
          const map = { 0: "없음", 1: "1~5개", 2: "6~10개", 3: "11~15개", 4: "16~20개" };
          lines.push(`짐양: ${map[state.loadLevel] || "-"}`);
        }

        // 가구/가전 항목 요약
        const items = summarizeItemsWithMattress(state.items);
  // ensure item cost applied
  const itemsCost = items;

        if (items !== "선택 없음") {
          lines.push(`가구·가전: ${items}`);
        }

        // 선택한 가구/가전 관련 메모를 요약에 포함합니다. 사용자가 입력한 메모가 있을 경우만 추가합니다.
        if (state.itemsNote && state.itemsNote.trim()) {
          lines.push(`가구·가전 기타사항: ${state.itemsNote.trim()}`);
        }

        if (state.hasWaypoint) {
          const map = { 0: "없음", 1: "1~5개", 2: "6~10개", 3: "11~15개", 4: "16~20개" };
          if (state.waypointLoadLevel !== null) lines.push(`경유지 짐양: ${map[state.waypointLoadLevel] || "-"}`);
          const waypointItems = summarizeItemsWithMattress(state.waypointItems);
          if (waypointItems !== "선택 없음") lines.push(`경유지 가구·가전: ${waypointItems}`);
          if (state.waypointItemsNote && state.waypointItemsNote.trim()) {
            lines.push(`경유지 짐 기타사항: ${state.waypointItemsNote.trim()}`);
          }
          lines.push(`경유지 계단: ${state.waypointNoElevator ? `엘베없음 ${state.waypointFloor}층` : "엘베있음"}`);
          if (state.waypointLadderEnabled) lines.push(`경유지 사다리차: ${state.waypointLadderFloor}층`);
        }

        if (state.cantCarryFrom || state.cantCarryTo) {
          lines.push(`직접 나르기 어려움: ${state.cantCarryFrom ? "출발 " : ""}${state.cantCarryTo ? "도착" : ""}`.trim());
        }

        if (state.helperFrom || state.helperTo) {
          lines.push(`인부: ${state.helperFrom ? "출발 " : ""}${state.helperTo ? "도착" : ""}`.trim());
          lines.push(`인부 예약금 추가: ${formatWon(moveHelperCount() * HELPER_DEPOSIT_ADDON_PER_PERSON)}`);
        }

        if (state.ladderFromEnabled || state.ladderToEnabled) {
          const a = state.ladderFromEnabled ? `출발(${state.ladderFromFloor}층)` : "";
          const b = state.ladderToEnabled ? `도착(${state.ladderToFloor}층)` : "";
          lines.push(`사다리차: ${[a, b].filter(Boolean).join(" / ")}`);
        }

        if (state.cleaningToggle) {
          const cleanTypeLabel =
            state.cleanType === "movein" ? "입주청소" :
            state.cleanType === "moveout" ? "이사청소" : "거주청소";
          const soilLabel =
            state.cleanSoil === "light" ? "가벼움" :
            state.cleanSoil === "normal" ? "보통" : "심함";
          const cleanOpts = [
            state.cleanParkingHard ? "주차 어려움" : null,
            state.cleanNoElevator ? `엘베없음(${state.cleanFloor}층)` : null,
            state.cleanOuterWindowEnabled ? `외창(${state.cleanOuterWindowPyeong}평)` : null,
            state.cleanPhytoncideEnabled ? "피톤치드/탈취" : null,
            state.cleanDisinfectEnabled ? "살균/소독" : null,
            state.cleanTrashBags > 0 ? `폐기/정리 봉투(${state.cleanTrashBags}개)` : null,
          ].filter(Boolean).join(", ") || "없음";
          lines.push(`[입주청소] ${state.cleanPyeong}평 · ${cleanTypeLabel} · ${soilLabel}`);
          lines.push(`입주청소 구성: 방${state.cleanRooms} · 화장실${state.cleanBaths} · 베란다${state.cleanBalconies} · 붙박이장${state.cleanWardrobes}`);
          if (state.cleanAddress) lines.push(`입주청소 주소: ${state.cleanAddress}`);
          if (state.cleanAddressNote && state.cleanAddressNote.trim()) lines.push(`입주청소 주소 메모: ${state.cleanAddressNote.trim()}`);
          lines.push(`입주청소 옵션: ${cleanOpts}`);
          const special = summarizeDict(state.cleanBasic);
          const appliance = summarizeDict(state.cleanAppliance);
          if (special !== "선택 없음") lines.push(`특수 청소: ${special}`);
          if (appliance !== "선택 없음") lines.push(`가전·가구 클리닝: ${appliance}`);
          if (state.cleanNote && state.cleanNote.trim()) lines.push(`입주청소 기타사항: ${state.cleanNote.trim()}`);
          lines.push(`예상 입주청소비: ${formatWon(calcCleanDisplayPrice())}`);
        }

        if (state.throwToggle) {
          lines.push(`버려주세요: ${summarizeDict(state.throwFrom)} / ${summarizeDict(state.throwTo)}`);
          // 버려주세요 모드에서도 메모를 포함합니다. 입력한 메모가 있을 경우에만 추가합니다.
          if (state.throwNote && state.throwNote.trim()) {
            lines.push(`버려주세요 기타사항: ${state.throwNote.trim()}`);
          }
        }

        if (state.hasWaypoint) {
          const waypointThrow = summarizeDict(state.waypointThrow);
          if (waypointThrow !== "선택 없음") lines.push(`경유지 버려주세요: ${waypointThrow}`);
          if (state.waypointThrowNote && state.waypointThrowNote.trim()) {
            lines.push(`경유지 버려주세요 기타사항: ${state.waypointThrowNote.trim()}`);
          }
        }

        if (state.ride > 0) lines.push(`동승: ${state.ride}명`);

        return lines.join("<br>");
      }

      if (svc === SERVICE.CLEAN) {
        const lines = [];
        lines.push(`서비스: 입주청소`);
        lines.push(
          `유형: ${
            state.cleanType === "movein"
              ? "입주청소(공실)"
              : state.cleanType === "moveout"
              ? "이사청소(퇴거)"
              : "거주청소(짐있음)"
          }`
        );
        lines.push(
          `오염도: ${
            state.cleanSoil === "light" ? "가벼움" : state.cleanSoil === "normal" ? "보통" : "심함"
          }`
        );
        lines.push(`평수/구성: ${state.cleanPyeong}평 · 방${state.cleanRooms} · 화장실${state.cleanBaths} · 베란다${state.cleanBalconies}`);
        if (state.cleanAddress) lines.push(`주소: ${state.cleanAddress}`);
        if (state.moveDate) lines.push(`희망 일정: ${state.moveDate} / ${state.timeSlot ? state.timeSlot + "시" : "시간 미선택"}`);

        const opts = [];
        if (state.cleanParkingHard) opts.push("주차 어려움");
        if (state.cleanNoElevator) opts.push(`엘베없음(${state.cleanFloor}층)`);
        if (state.cleanOuterWindowEnabled) opts.push(`외창(${state.cleanOuterWindowPyeong}평)`);
        if (state.cleanPhytoncideEnabled) opts.push("피톤치드/탈취");
        if (state.cleanDisinfectEnabled) opts.push("살균/소독");
        if (state.cleanTrashBags > 0) opts.push(`폐기봉투(${state.cleanTrashBags}개)`);
        if (state.cleanWardrobes > 0) opts.push(`붙박이장(${state.cleanWardrobes}세트)`);
        if (opts.length) lines.push(`옵션: ${opts.join(", ")}`);

        const basic = summarizeDict(state.cleanBasic);
        if (basic !== "선택 없음") lines.push(`특수청소: ${basic}`);

        const appl = summarizeDict(state.cleanAppliance);
        if (appl !== "선택 없음") lines.push(`가전/가구 클리닝: ${appl}`);

        if (state.cleanNote.trim()) lines.push(`기타: ${state.cleanNote.trim()}`);

        return lines.join("<br>");
      }

      return "조건을 선택해보세요.";
    }

    let compareChart = null;
    let compareChartResizeRaf = null;

    function isMobileViewport() {
      return window.matchMedia && window.matchMedia("(max-width: 520px)").matches;
    }

    function queueCompareChartResize() {
      if (compareChartResizeRaf) cancelAnimationFrame(compareChartResizeRaf);
      compareChartResizeRaf = requestAnimationFrame(() => {
        compareChartResizeRaf = null;
        if (!compareChart) return;
        applyCompareChartResponsiveOptions(compareChart);
        compareChart.resize();
        compareChart.update("none");
      });
    }

    function applyCompareChartResponsiveOptions(chart) {
      if (!chart?.options) return;
      const mobile = isMobileViewport();
      const dataset = chart.data?.datasets?.[0];
      if (dataset) {
        dataset.barThickness = mobile ? 12 : 18;
        dataset.maxBarThickness = mobile ? 16 : 22;
      }
      if (chart.options.scales?.x?.ticks) {
        chart.options.scales.x.ticks.font = { size: mobile ? 9 : 11, weight: "700" };
        chart.options.scales.x.ticks.maxRotation = 0;
        chart.options.scales.x.ticks.minRotation = 0;
        chart.options.scales.x.ticks.autoSkip = false;
      }
      if (chart.options.scales?.y?.ticks) {
        chart.options.scales.y.ticks.font = { size: mobile ? 10 : 11 };
      }
    }

    function buildCompetitorComparison(displayPrice) {
      const safeDisplay = Math.max(0, Number(displayPrice) || 0);
      const average = safeDisplay > 0 ? safeDisplay / 0.862 : 0;
      const multipliers = [0.94, 0.97, 0.99, 1.00, 1.02, 1.04, 1.04];
      const labels = ["업체1", "업체2", "업체3", "업체4", "업체5", "업체6", "업체7", "DANG-O"];
      const vendors = multipliers.map((m) => Math.round(average * m));
      const mean = vendors.length ? vendors.reduce((a, b) => a + b, 0) / vendors.length : 0;
      return {
        labels,
        values: [...vendors, Math.round(safeDisplay)],
        average: Math.round(mean),
      };
    }

    function renderCompareChart(displayPrice) {
      const canvas = $("#priceCompareChart");
      const averageLabel = $("#compareAverageLabel");
      if (!canvas || !window.Chart) return;

      const parentWidth = canvas.parentElement?.clientWidth || 0;
      if (parentWidth <= 0) {
        requestAnimationFrame(() => renderCompareChart(displayPrice));
        return;
      }

      const comparison = buildCompetitorComparison(displayPrice);
      if (averageLabel) averageLabel.textContent = `7개 업체 평균 ${formatWon(comparison.average)}`;

      const vendorColors = comparison.labels.map((label) =>
  label === "DANG-O"
    ? "#ed6b2f"
    : "#CBD5E1"          // 다른 업체 (연회색)
);

const borderColors = comparison.labels.map((label) =>
  label === "DANG-O"
    ? "#1D4ED8"
    : "#94A3B8"
);

      if (!compareChart) {
        compareChart = new window.Chart(canvas, {
          type: "bar",
          data: {
            labels: comparison.labels,
            datasets: [{
              label: "가격 비교",
              data: comparison.values,
              backgroundColor: vendorColors,
              borderColor: borderColors,
              borderWidth: 1,
              borderRadius: 10,
              borderSkipped: false,
              barThickness: isMobileViewport() ? 12 : 18,
              maxBarThickness: isMobileViewport() ? 16 : 22,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label(context) {
                    return `${context.label}: ${formatWon(context.raw || 0)}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: "rgba(140, 171, 211, 0.72)",
                  font: { size: isMobileViewport() ? 9 : 11, weight: "700" },
                  maxRotation: 0,
                  minRotation: 0,
                  autoSkip: false,
                },
                border: { display: false },
              },
              y: {
                beginAtZero: false,
                suggestedMin: Math.max(0, Math.min(...comparison.values) * 0.9),
                suggestedMax: Math.max(...comparison.values) * 1.08,
                grid: { color: "rgba(255,255,255,0.08)" },
                border: { display: false },
                ticks: {
                  color: "rgba(230,237,246,0.58)",
                  font: { size: isMobileViewport() ? 10 : 11 },
                  callback(value) {
                    return `${Math.round(Number(value) / 1000)}k`;
                  },
                },
              },
            },
          },
        });
        applyCompareChartResponsiveOptions(compareChart);
        queueCompareChartResize();
        return;
      }

      compareChart.data.labels = comparison.labels;
      compareChart.data.datasets[0].data = comparison.values;
      compareChart.data.datasets[0].backgroundColor = vendorColors;
      compareChart.data.datasets[0].borderColor = borderColors;
      compareChart.options.scales.y.suggestedMin = Math.max(0, Math.min(...comparison.values) * 0.9);
      compareChart.options.scales.y.suggestedMax = Math.max(...comparison.values) * 1.08;
      applyCompareChartResponsiveOptions(compareChart);
      compareChart.update();
      queueCompareChartResize();
    }

    function renderPrice() {
      const raw = calcCurrentPrice();
      const display = raw * DISPLAY_MULTIPLIER;
      const pricing = buildCurrentPricingBreakdown({
        channel: document.body?.dataset.siteBrand === "당고" ? "dango" : "direct",
      });

      const priceEl = $("#price");
      const stickyPriceEl = $("#stickyPrice");

      if (priceEl) priceEl.textContent = formatWon(pricing.total || display);
      if (stickyPriceEl) stickyPriceEl.textContent = formatWon(pricing.total || display);

      const priceUnder = $("#priceUnder");
      const stickyPriceDetail = $("#stickyPriceDetail");
      if (state.activeService === SERVICE.CLEAN) {
        const guide = getCleanMinimumGuideText();
        if (priceUnder) priceUnder.innerHTML = `${guide} <b>옵션은 별도로 더해져요.</b>`;
        if (stickyPriceDetail) stickyPriceDetail.textContent = guide;
      }

      $("#deposit") && ($("#deposit").textContent = formatWon(pricing.deposit));
      $("#balance") && ($("#balance").textContent = formatWon(pricing.balance));
      $("#stickyDeposit") && ($("#stickyDeposit").textContent = formatWon(pricing.deposit));
      $("#stickyBalance") && ($("#stickyBalance").textContent = formatWon(pricing.balance));

      renderCompareChart(pricing.total || display);

      const breakdownEl = $("#priceBreakdown");
      if (breakdownEl && state.activeService === SERVICE.MOVE && (pricing.helperCount || pricing.ladderCount)) {
        const baseAmount = (pricing.total || 0) - (pricing.helperCustomerAmount || 0) - (pricing.ladderCustomerAmount || 0);
        const rows = [];
        rows.push(`<div class="breakdown-row"><span>기본 이사비</span><span>${formatWon(Math.max(0, baseAmount))}</span></div>`);
        if (pricing.helperCount) rows.push(`<div class="breakdown-row"><span>인부 추가 (${pricing.helperCount}명)</span><span>+${formatWon(pricing.helperCustomerAmount)}</span></div>`);
        if (pricing.ladderCount) rows.push(`<div class="breakdown-row"><span>사다리차 (${pricing.ladderCount}건)</span><span>+${formatWon(pricing.ladderCustomerAmount)}</span></div>`);
        rows.push(`<div class="breakdown-row total-row"><span>합계</span><span>${formatWon(pricing.total || 0)}</span></div>`);
        breakdownEl.innerHTML = rows.join('');
        breakdownEl.hidden = false;
      } else if (breakdownEl) {
        breakdownEl.hidden = true;
      }
    }

    function renderSummary() {
      const sum = $("#summary");
      if (sum) sum.innerHTML = buildSummaryText();
    }

    function isLikelyDetailedAddress(addr) {
      const value = String(addr || "").trim();
      if (!value) return false;
      return /(\d+\s*동)|(\d+\s*호)|(\d+\s*층)|(b\d+\s*층)|([A-Za-z]\d+\s*동)|([A-Za-z]\d+\s*호)/i.test(value);
    }

    function ensureAddressGuideModal() {
      let modal = document.getElementById("addressGuideModal");
      if (modal) return modal;

      modal = document.createElement("div");
      modal.className = "modal";
      modal.id = "addressGuideModal";
      modal.setAttribute("aria-hidden", "true");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "주소 입력 안내");
      modal.innerHTML = `
        <div class="modal-backdrop" data-close="addressGuideModal"></div>
        <div class="modal-panel">
          <div class="modal-head">
            <div class="modal-title">주소를 다시 넣어주세요.</div>
            <button class="modal-x" type="button" data-close="addressGuideModal" aria-label="닫기">×</button>
          </div>
          <div class="modal-body">
            <p style="margin:0; line-height:1.7; color:var(--text,#111);">세부 주소(몇 동, 몇 호, 몇 층)까지 넣으면 주소를 찾지 못해 거리가 0으로 계산될 수 있어요.</p>
            <p style="margin:12px 0 0; line-height:1.7; color:var(--muted,#666);">동·호수는 빼고 <b>도로명주소나 건물명까지만</b> 넣은 뒤 다시 거리 계산을 해주세요.</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="wizard-btn" data-close="addressGuideModal">확인</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function showAddressGuidePopup() {
      ensureAddressGuideModal();
      if (typeof openModal === "function") {
        openModal("addressGuideModal");
        return;
      }
      showToast("주소는 동·호수를 빼고 도로명주소/건물명까지만 입력해줘.", "error");
    }

    function isMoveInquiryReady() {
      return !!state.startAddress && !!state.endAddress && state.distanceKm > 0 && state.lastDistanceRouteKey === currentRouteKey();
    }

    function validateMoveInquiryBeforeSend() {
      if (state.activeService !== SERVICE.MOVE) return true;
      if (isMoveInquiryReady()) return true;

      const hasDetail = isLikelyDetailedAddress(state.startAddress) || isLikelyDetailedAddress(state.endAddress) || (state.hasWaypoint && isLikelyDetailedAddress(state.waypointAddress));
      if (hasDetail || (!!state.startAddress && !!state.endAddress && state.distanceKm <= 0)) {
        showAddressGuidePopup();
      } else {
        showToast("거리 계산이 완료돼야 견적서를 발송할 수 있어. 주소 입력 후 거리 계산하기를 다시 눌러줘.", "error");
      }
      return false;
    }

    function updateInquiryButtonsState() {
      const shouldDisableMoveInquiry = state.activeService === SERVICE.MOVE && !isMoveInquiryReady();
      [
        document.getElementById("channelInquiry"),
        document.getElementById("sendInquiry"),
        document.getElementById("startCheckoutCta"),
        document.getElementById("confirmCheckoutStart")
      ].forEach((btn) => {
        if (!btn) return;
        if (shouldDisableMoveInquiry) {
          btn.classList.add("is-disabled");
          btn.setAttribute("aria-disabled", "true");
          if (btn.tagName === "BUTTON") btn.disabled = true;
        } else {
          btn.classList.remove("is-disabled");
          btn.removeAttribute("aria-disabled");
          if (btn.tagName === "BUTTON") btn.disabled = false;
        }
      });
    }

    function normalizePhone(value) {
      return String(value || "").replace(/\D+/g, "");
    }

    function estimateWeightKg() {
      const loadWeightMap = { 0: 0, 1: 80, 2: 160, 3: 260, 4: 360 };
      const moveItemsCount = Object.values(state.items || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      const waypointItemsCount = Object.values(state.waypointItems || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      return (loadWeightMap[state.loadLevel] || 0) + ((moveItemsCount + waypointItemsCount) * 12);
    }

    function estimateFloorValue() {
      const floors = [
        state.noFrom ? Number(state.fromFloor || 0) : 0,
        state.noTo ? Number(state.toFloor || 0) : 0,
        state.hasWaypoint && state.waypointNoElevator ? Number(state.waypointFloor || 0) : 0
      ];
      return Math.max(...floors, 0);
    }

    function buildCheckoutPayload(customerName, customerPhone) {
      const attribution = getAttribution();
      const pricing = buildCurrentPricingBreakdown({
        channel: document.body?.dataset.siteBrand === "당고" ? "dango" : "direct",
      });

      return {
        service_type: state.activeService === SERVICE.CLEAN ? "clean" : "move",
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_note: [
          state.itemsNote ? `가구·가전 기타사항: ${state.itemsNote}` : null,
          state.throwNote ? `버려주세요 기타사항: ${state.throwNote}` : null,
          state.cleaningToggle && state.cleanNote ? `청소 특이사항: ${state.cleanNote}` : null
        ].filter(Boolean).join("\n") || null,
        move_date: state.moveDate,
        start_address: state.startAddress,
        end_address: state.endAddress,
        via_address: state.hasWaypoint ? state.waypointAddress : null,
        distance_km: state.distanceKm,
        floor: estimateFloorValue(),
        weight_kg: estimateWeightKg(),
        item_summary: {
          vehicle: state.vehicle || "",
          moveType: state.moveType,
          loadLevel: state.loadLevel,
          items: state.items || {},
          waypointItems: state.waypointItems || {},
          throwFrom: state.throwFrom || {},
          throwTo: state.throwTo || {},
          ride: state.ride || 0
        },
        option_summary: {
          helper: Boolean(state.helperFrom || state.helperTo),
          helperFrom: Boolean(state.helperFrom),
          helperTo: Boolean(state.helperTo),
          packing: state.moveType === "half",
          cleaning: Boolean(state.cleaningToggle),
          via_stop: Boolean(state.hasWaypoint),
          ladderFrom: Boolean(state.ladderFromEnabled),
          ladderTo: Boolean(state.ladderToEnabled),
          waypointLadder: Boolean(state.waypointLadderEnabled),
          cantCarryFrom: Boolean(state.cantCarryFrom),
          cantCarryTo: Boolean(state.cantCarryTo)
        },
        acquisition_source: attribution.source || "direct",
        acquisition_medium: attribution.medium,
        acquisition_campaign: attribution.campaign,
        raw_text: buildInquiryMessage(),
        price_override: {
          total: pricing.total,
          deposit: pricing.deposit,
          balance: pricing.balance,
          driverAmount: pricing.driverAmount,
          companyAmount: pricing.companyAmount,
          version: pricing.settlement?.source === "move-helper-custom" ? "dango-detailed-helper" : "dango-detailed"
        }
      };
    }

    function buildDraftRecord(payload) {
      return {
        id: `draft-${Date.now()}`,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        move_date: payload.move_date,
        start_address: payload.start_address,
        end_address: payload.end_address,
        via_address: payload.via_address || null,
        raw_text: payload.raw_text,
        total_price: payload.price_override.total,
        deposit_amount: payload.price_override.deposit,
        balance_amount: payload.price_override.balance,
        payment_status: "draft",
        dispatch_status: "pending",
        savedAt: new Date().toISOString()
      };
    }

    async function startDirectCheckout() {
      if (!validateMoveInquiryBeforeSend()) return;

      const nameInput = $("#checkoutCustomerName");
      const phoneInput = $("#checkoutCustomerPhone");
      const messageEl = $("#checkoutInlineMessage");
      const button = $("#confirmCheckoutStart");

      const customerName = (nameInput?.value || "").trim();
      const customerPhone = normalizePhone(phoneInput?.value || "");

      if (!customerName || customerPhone.length < 10) {
        if (messageEl) messageEl.textContent = "이름과 연락처를 정확히 넣어주세요.";
        return;
      }

      const originalText = button?.textContent || "";
      if (button) {
        button.disabled = true;
        button.textContent = "결제 페이지를 준비하고 있어요...";
      }
      if (messageEl) messageEl.textContent = "주문을 만들고 결제 페이지로 넘어가고 있어요.";

      const payload = buildCheckoutPayload(customerName, customerPhone);

      try {
        const headers = { 'Content-Type': 'application/json' };
        try {
          const sb = window.dd?.supabase;
          if (sb) {
            const { data: { session } } = await sb.auth.getSession();
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        } catch {}
        const res = await fetch('/.netlify/functions/create-job', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success && data.job?.id) {
          window.location.href = `../customer/pay.html?jobId=${encodeURIComponent(data.job.id)}`;
          return;
        }
        throw new Error(data.error || '주문 생성에 실패했어요.');
      } catch (error) {
        const draftId = `checkout-${Date.now()}`;
        localStorage.setItem(`dango:${draftId}`, JSON.stringify(buildDraftRecord(payload)));
        if (messageEl) messageEl.textContent = "실주문 연결이 늦어져서 초안 결제 흐름으로 넘어가요.";
        window.location.href = `../customer/pay.html?draftId=${encodeURIComponent(draftId)}`;
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }
    }

    function renderAll() {
      renderMiniSummaries();
      renderSummary();
      renderPrice();
      updateStickyBarVisibility();

      // 중요: 보관이사/보관타입/보관일수는 state를 단일 진실 원천으로 유지
      // 모달 조작이나 다른 입력 후에도 DOM이 기본값으로 돌아가며 금액이 내려가는 현상을 막음
      $$('input[name="moveType"]').forEach((r) => {
        r.checked = String(r.value) === String(state.moveType);
      });
      $$('input[name="storageBase"]').forEach((r) => {
        r.checked = String(r.value) === String(state.storageBase);
      });
      const storageDaysInput = $("#storageDays");
      if (storageDaysInput) storageDaysInput.value = String(Math.max(1, toInt(state.storageDays, 1)));

      setHidden($("#storageBody"), state.moveType !== "storage");
      setHidden($("#ladderFromBody"), !state.ladderFromEnabled);
      setHidden($("#ladderToBody"), !state.ladderToEnabled);
      setHidden($("#cleaningBody"), !state.cleaningToggle);
      setHidden($("#cleanOuterWindowBody"), !state.cleanOuterWindowEnabled);
      setHidden($("#moveCleanOuterWindowBody"), !state.cleanOuterWindowEnabled);

      const cleaningToggle = $("#cleaningToggle");
      if (cleaningToggle) cleaningToggle.checked = !!state.cleaningToggle;

      const moveCleanPrice = $("#moveCleanPrice");
      if (moveCleanPrice) moveCleanPrice.textContent = formatWon(calcCleanDisplayPrice());

      const moveCleanSummary = $("#moveCleanSummary");
      if (moveCleanSummary) {
        const typeLabel = state.cleanType === "movein" ? "입주청소" : state.cleanType === "moveout" ? "이사청소" : "거주청소";
        const soilLabel = state.cleanSoil === "light" ? "가벼움" : state.cleanSoil === "normal" ? "보통" : "심함";
        moveCleanSummary.textContent = `${state.cleanPyeong}평 · ${typeLabel} · ${soilLabel}`;
      }

      const moveCleanAddress = $("#moveCleanAddress");
      if (moveCleanAddress && moveCleanAddress.value !== state.cleanAddress) moveCleanAddress.value = state.cleanAddress || "";
      const moveCleanAddressNote = $("#moveCleanAddressNote");
      if (moveCleanAddressNote && moveCleanAddressNote.value !== state.cleanAddressNote) moveCleanAddressNote.value = state.cleanAddressNote || "";
      const moveCleanNote = $("#moveCleanNote");
      if (moveCleanNote && moveCleanNote.value !== state.cleanNote) moveCleanNote.value = state.cleanNote || "";

      const waypointWrap = $("#waypointWrap");
      if (waypointWrap) waypointWrap.style.display = state.hasWaypoint ? "" : "none";

      const throwWrap = $("#throwMiniWrap");
      if (throwWrap) throwWrap.style.display = state.throwToggle ? "" : "none";

      const distText = $("#distanceText");
      if (distText) {
        if (state.distanceKm > 0 && state.lastDistanceRouteKey === currentRouteKey()) distText.textContent = `${state.distanceKm} km`;
        else if (state.startAddress && state.endAddress) distText.textContent = "거리 계산을 눌러주세요.";
        else distText.textContent = "주소를 입력해주세요.";
      }

      updateInquiryButtonsState();
    }

    /* =========================================================
       SMS / Inquiry flow
    ========================================================= */
    const INQUIRY_SMS_PHONE = "01075416143";

    async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.top = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          return ok;
        } catch (_) {
          return false;
        }
      }
    }

    function buildSmsHref(phone, text) {
      const ua = navigator.userAgent || "";
      const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
      const separator = isAppleMobile ? "&" : "?";
      return `sms:${phone}${separator}body=${encodeURIComponent(String(text || ""))}`;
    }

    function openSmsAppWithPrefill(text) {
      const message = String(text || "").trim();
      if (!message) return false;

      try {
        const href = buildSmsHref(INQUIRY_SMS_PHONE, message);
        window.location.href = href;
        return true;
      } catch (e) {
        console.warn("SMS open failed:", e);
        return false;
      }
    }

    function handleInquirySmsFallback(copied) {
      const fallbackMessage = copied
        ? "문자 앱이 바로 열리지 않으면, 방금 복사된 견적서를 01075416143 번호로 붙여넣어 전송해줘!"
        : "문자 앱이 바로 열리지 않으면, 01075416143 번호로 견적 내용을 직접 보내줘!";
      showToast(fallbackMessage);
    }

    function calcSmsMoveDiscountQuote(displayTotal) {
      const safeTotal = Number(displayTotal) || 0;
      const discountedTotal = Math.max(0, Math.round(safeTotal * 0.97));
      const pricing = buildMovePricingBreakdown(discountedTotal, { channel: "direct" });
      return {
        discountedTotal: pricing.total,
        deposit: pricing.deposit,
        balance: pricing.balance,
        helperDepositAddon: pricing.settlement.helperDepositAddon,
      };
    }

    function buildInquiryMessage() {
      if (state.activeService === SERVICE.MOVE) {
        const vehicle = state.vehicle || "-";
        const moveType =
          state.moveType === "general" ? "일반이사" :
          state.moveType === "half" ? "반포장 이사" :
          "보관이사";

        const time = state.timeSlot ? `${state.timeSlot}시` : "-";
        const dist = state.distanceKm > 0 ? `${state.distanceKm}km` : "-";

        const loadMap = { 0: "없음", 1: "1~5개", 2: "6~10개", 3: "11~15개", 4: "16~20개" };
        const load = loadMap[state.loadLevel] || "-";

        const elevFrom = state.noFrom ? `출발 엘베없음(${state.fromFloor}층)` : "출발 엘베있음";
        const elevTo = state.noTo ? `도착 엘베없음(${state.toFloor}층)` : "도착 엘베있음";

        const items = summarizeItemsWithMattress(state.items);
  // ensure item cost applied
  const itemsCost = items;

        const itemsLine = `가구·가전: ${items}`;
        const itemsNoteLine = (state.itemsNote && state.itemsNote.trim()) ? `가구·가전 기타사항: ${state.itemsNote.trim()}` : null;
        const waypointLoadLine = state.hasWaypoint ? `경유지 짐양: ${state.waypointLoadLevel === null ? "선택 없음" : (loadMap[state.waypointLoadLevel] || "-")}` : null;
        const waypointItemsLine = state.hasWaypoint ? `경유지 가구·가전: ${summarizeItemsWithMattress(state.waypointItems)}` : null;
        const waypointItemsNoteLine = (state.hasWaypoint && state.waypointItemsNote && state.waypointItemsNote.trim()) ? `경유지 짐 기타사항: ${state.waypointItemsNote.trim()}` : null;
        const throwInfo = state.throwToggle
          ? `버려주세요: ${summarizeDict(state.throwFrom)} / ${summarizeDict(state.throwTo)}`
          : "버려주세요: 미사용";
        const throwNoteLine = (state.throwToggle && state.throwNote && state.throwNote.trim())
          ? `버려주세요 기타사항: ${state.throwNote.trim()}`
          : null;
        const waypointCarryLine = state.hasWaypoint ? `경유지 계단: ${state.waypointNoElevator ? `엘베없음(${state.waypointFloor}층)` : "엘베있음"}` : null;
        const waypointLadderLine = state.hasWaypoint ? `경유지 사다리차: ${state.waypointLadderEnabled ? `${state.waypointLadderFloor}층` : "불필요"}` : null;
        const waypointThrowLine = state.hasWaypoint ? `경유지 버려주세요: ${summarizeDict(state.waypointThrow)}` : null;
        const waypointThrowNoteLine = (state.hasWaypoint && state.waypointThrowNote && state.waypointThrowNote.trim())
          ? `경유지 버려주세요 기타사항: ${state.waypointThrowNote.trim()}`
          : null;

        const ladderInfo =
          (state.ladderFromEnabled || state.ladderToEnabled)
            ? `사다리차: ${state.ladderFromEnabled ? `출발(${state.ladderFromFloor}층)` : ""}${state.ladderFromEnabled && state.ladderToEnabled ? " / " : ""}${state.ladderToEnabled ? `도착(${state.ladderToFloor}층)` : ""}`
            : "사다리차: 불필요";

        const helperInfo = (`인부: ${state.helperFrom ? "출발 " : ""}${state.helperTo ? "도착" : ""}`).trim() || "인부: 미사용";

        const cantCarryInfo =
          (state.cantCarryFrom || state.cantCarryTo)
            ? (`직접 나르기 어려움: ${state.cantCarryFrom ? "출발 " : ""}${state.cantCarryTo ? "도착" : ""}`).trim()
            : "직접 나르기 어려움: 없음";

        const cleanOpt = state.cleaningToggle
          ? [
              "[입주청소 문의]",
              `평수: ${state.cleanPyeong}평`,
              `청소 종류: ${state.cleanType === "movein" ? "입주청소" : state.cleanType === "moveout" ? "이사청소" : "거주청소"}`,
              `오염도: ${state.cleanSoil === "light" ? "가벼움" : state.cleanSoil === "normal" ? "보통" : "심함"}`,
              `구성: 방${state.cleanRooms} · 화장실${state.cleanBaths} · 베란다${state.cleanBalconies} · 붙박이장${state.cleanWardrobes}`,
              `주소: ${state.cleanAddress || "-"}`,
              state.cleanAddressNote && state.cleanAddressNote.trim() ? `주소 메모: ${state.cleanAddressNote.trim()}` : null,
              `추가 옵션: ${
                [
                  state.cleanParkingHard ? "주차 어려움" : null,
                  state.cleanNoElevator ? `엘베없음(${state.cleanFloor}층)` : null,
                  state.cleanOuterWindowEnabled ? `외창(${state.cleanOuterWindowPyeong}평)` : null,
                  state.cleanPhytoncideEnabled ? "피톤치드/탈취" : null,
                  state.cleanDisinfectEnabled ? "살균/소독" : null,
                  state.cleanTrashBags > 0 ? `폐기/정리 봉투(${state.cleanTrashBags}개)` : null
                ].filter(Boolean).join(", ") || "없음"
              }`,
              `특수 청소: ${summarizeDict(state.cleanBasic)}`,
              `가전·가구 클리닝: ${summarizeDict(state.cleanAppliance)}`,
              state.cleanNote && state.cleanNote.trim() ? `기타사항: ${state.cleanNote.trim()}` : null,
              `예상 청소비: ${formatWon(calcCleanDisplayPrice())}`,
              `예약금(20%): ${formatWon(calcCleanDeposit())}`,
              `잔금(80%): ${formatWon(calcCleanBalance())}`,
            ].filter(Boolean).join("\n")
          : "입주청소: 미사용";

        const display = calcCurrentPrice() * DISPLAY_MULTIPLIER;
        const price = formatWon(display);
        const smsQuote = calcSmsMoveDiscountQuote(display);
        const deposit = formatWon(smsQuote.deposit);
        const balance = formatWon(smsQuote.balance);
        const helperAdvanceInfo =
          smsQuote.helperDepositAddon > 0
            ? `인부 예약금 추가분: ${formatWon(smsQuote.helperDepositAddon)}`
            : null;
        const depositLabel =
          smsQuote.helperDepositAddon > 0
            ? `예약금(기본 20% + 인부 선결제): ${deposit}`
            : `예약금(20%): ${deposit}`;

        return [
          `${SITE_BRAND} 견적 문의`,
          "",
          "서비스: 이사·용달",
          `차량: ${vehicle}`,
          `이사 방식: ${moveType}`,
          state.moveType === "storage" ? `보관: ${state.storageDays}일 (상한 37만원)` : null,
          `일정: ${state.moveDate || "-"} / ${time}`,
          `출발지: ${state.startAddress || "-"}`,
          state.hasWaypoint ? `경유지: ${state.waypointAddress || "-"}` : null,
          `도착지: ${state.endAddress || "-"}`,
          `거리: ${dist}`,
          elevFrom,
          elevTo,
          `짐양: ${load}`,
          itemsLine,
          itemsNoteLine,
          waypointLoadLine,
          waypointItemsLine,
          waypointItemsNoteLine,
          waypointCarryLine,
          waypointLadderLine,
          helperInfo,
          cantCarryInfo,
          ladderInfo,
          cleanOpt,
          throwInfo,
          throwNoteLine,
          waypointThrowLine,
          waypointThrowNoteLine,
          state.ride > 0 ? `동승: ${state.ride}명` : null,
          "",
          `홈페이지 예상 견적: ${price}`,
          depositLabel,
          helperAdvanceInfo,
          `잔금(80%): ${balance}`,
        ]
          .filter(Boolean)
          .join("\n");
      }

      if (state.activeService === SERVICE.CLEAN) {
        const type =
          state.cleanType === "movein" ? "입주청소(공실)" :
          state.cleanType === "moveout" ? "이사청소(퇴거)" : "거주청소(짐있음)";
        const soil =
          state.cleanSoil === "light" ? "가벼움" :
          state.cleanSoil === "normal" ? "보통" : "심함";
        const area = `${state.cleanPyeong}평`;
        const config = `방${state.cleanRooms} · 화장실${state.cleanBaths} · 베란다${state.cleanBalconies}`;
        const addr = state.cleanAddress || "-";
        const time = state.timeSlot ? `${state.timeSlot}시` : "-";

        const options =
          [
            state.cleanParkingHard ? "주차 어려움" : null,
            state.cleanNoElevator ? `엘베없음(${state.cleanFloor}층)` : null,
            state.cleanOuterWindowEnabled ? `외창(${state.cleanOuterWindowPyeong}평)` : null,
            state.cleanPhytoncideEnabled ? "피톤치드/탈취" : null,
            state.cleanDisinfectEnabled ? "살균/소독" : null,
            state.cleanTrashBags > 0 ? `폐기봉투(${state.cleanTrashBags}개)` : null,
            state.cleanWardrobes > 0 ? `붙박이장(${state.cleanWardrobes}세트)` : null,
          ].filter(Boolean).join(", ") || "없음";

        const special = summarizeDict(state.cleanBasic);
        const appliance = summarizeDict(state.cleanAppliance);
        const note = state.cleanNote.trim() || "-";
        const price = formatWon(calcCurrentPrice() * DISPLAY_MULTIPLIER);

        return [
          `${SITE_BRAND} 견적 문의 (${SITE_BRAND === "디디클린" ? "입주청소" : "입주청소"})`,
          "",
          `유형: ${type}`,
          `오염도: ${soil}`,
          `평수/구성: ${area} · ${config}`,
          `주소: ${addr}`,
          `희망 일정: ${state.moveDate || "-"} / ${time}`,
          options !== "없음" ? `옵션: ${options}` : null,
          special !== "선택 없음" ? `특수청소: ${special}` : null,
          appliance !== "선택 없음" ? `가전/가구 클리닝: ${appliance}` : null,
          note !== "-" ? `기타: ${note}` : null,
          "",
          `예상 견적: ${price}`,
        ]
          .filter(Boolean)
          .join("\n");
      }

      return "";
    }

    $("#channelInquiry")?.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!validateMoveInquiryBeforeSend()) return;
      const msg = buildInquiryMessage();
      const copied = await copyToClipboard(msg);
      const ok = openSmsAppWithPrefill(msg);

      if (!ok) handleInquirySmsFallback(copied);
    });

    function updateStickyBarVisibility() {
      const stickyBarEl = $("#stickyPriceBar");
      if (!stickyBarEl) return;

      const quoteCardEl = $("#priceCardStatic") || $(".section.step-card[data-step=\"12\"] .price-card") || $(".section.step-card[data-step=\"12\"]");
      if (!quoteCardEl) {
        stickyBarEl.classList.remove("is-hidden");
        return;
      }

      const rect = quoteCardEl.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
      const hideStart = window.matchMedia("(max-width: 768px)").matches
        ? viewportH * 0.28
        : viewportH * 0.5;

      const shouldHide = rect.top <= hideStart && rect.bottom > 0;
      stickyBarEl.classList.toggle("is-hidden", shouldHide);
    }

    window.addEventListener("scroll", updateStickyBarVisibility, { passive: true });
    window.addEventListener("resize", updateStickyBarVisibility);

    $("#sendInquiry")?.addEventListener("click", async () => {
      if (!validateMoveInquiryBeforeSend()) return;
      const msg = buildInquiryMessage();
      closeModal("confirmInquiryModal");

      const copied = await copyToClipboard(msg);
      const ok = openSmsAppWithPrefill(msg);

      if (!ok) handleInquirySmsFallback(copied);
    });

    $("#confirmCheckoutStart")?.addEventListener("click", async () => {
      await startDirectCheckout();
    });

    $("#askClean")?.addEventListener("click", () => {
      closeModal("confirmInquiryModal");
      if (CROSS_LINK) {
        window.location.href = CROSS_LINK;
        return;
      }
      state.cleaningToggle = true;
      const cleaningToggle = $("#cleaningToggle");
      if (cleaningToggle) cleaningToggle.checked = true;
      setHidden($("#cleaningBody"), false);
      const host = $("#cleaningBody") || document.querySelector('[data-step="11"]');
      host?.scrollIntoView({ behavior: "smooth", block: "center" });
      renderAll();
    });

    captureAttributionFromQuery();
    await loadRuntimePricingConfig();

    // Initial render
    const initialVisible = computeVisibleSteps();
    const initialFirst = initialVisible.findIndex((s) => {
      const t = getStepToken(s);
      return t !== 0 && t !== "service";
    });
    gotoStep(initialFirst >= 0 ? initialFirst : 0, { noScroll: true });
    renderAll();

    const askCleanBtn = $("#askClean");
    if (askCleanBtn && CROSS_LINK) askCleanBtn.textContent = "당고 랜딩으로 돌아가기";

    const altServiceLink = document.querySelector(".alt-service-link");
    if (altServiceLink) {
      altServiceLink.setAttribute("href", CROSS_LINK || "/");
      altServiceLink.textContent = DEFAULT_SERVICE === "clean" ? "이사도 필요하면 눌러주세요." : "청소도 필요하면 눌러주세요.";
    }

    updateStickyBarVisibility();

    window.addEventListener("load", updateStickyBarVisibility);
  });
})();

/* ===== Animation Helpers ===== */

/* 스크롤 등장 애니메이션 */
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
    }
  });
},{threshold:0.15});

document.querySelectorAll("section,.card,.service-card").forEach(el=>{
  el.classList.add("reveal");
  revealObserver.observe(el);
});


/* 가격 카운트 애니메이션 */
function animateNumber(el,newValue,duration=500){

  const start = parseInt(el.innerText.replace(/[^0-9]/g,'')) || 0
  const startTime = performance.now()

  function frame(time){

    const progress = Math.min((time-startTime)/duration,1)

    const value = Math.floor(start+(newValue-start)*progress)

    el.innerText = value.toLocaleString()

    if(progress < 1){
      requestAnimationFrame(frame)
    }

  }

  requestAnimationFrame(frame)

}


/* data-price 자동 애니메이션 */
document.querySelectorAll("[data-price]").forEach(el=>{

  const v = parseInt(el.dataset.price)

  if(!isNaN(v)){
    animateNumber(el,v)
  }

})



/* ===== FIX PATCH START ===== */

// 상태 통합
window.getAllItems = function(){
  const result = {};
  const merge = (src)=>{
    if(!src) return;
    Object.keys(src).forEach(k=>{
      result[k] = (result[k]||0) + src[k];
    });
  };
  merge(window.state?.items || {});
  merge(window.state?.waypointItems || {});
  return result;
};

// 거리 계산 보정
window.calculateTotalDistance = function(){
  if(!window.state?.waypoint){
    return window.getDistance?.(window.state.start, window.state.end) || 0;
  }
  return (window.getDistance?.(window.state.start, window.state.waypoint) || 0)
       + (window.getDistance?.(window.state.waypoint, window.state.end) || 0);
};

// 모달 복구
window.restoreItemsModal = function(){
  const modal = document.getElementById("itemsModal");
  if(modal && modal.parentElement !== document.body){
    document.body.appendChild(modal);
  }
};

// 버튼 중복 이벤트 방지
document.querySelectorAll(".item-plus").forEach(btn=>{
  btn.onclick = (e)=>{
    e.stopPropagation();
    if(window.updateItem){
      window.updateItem(btn.dataset.key, 1);
    }
  }
});

document.querySelectorAll(".item-minus").forEach(btn=>{
  btn.onclick = (e)=>{
    e.stopPropagation();
    if(window.updateItem){
      window.updateItem(btn.dataset.key, -1);
    }
  }
});

/* ===== FIX PATCH END ===== */
