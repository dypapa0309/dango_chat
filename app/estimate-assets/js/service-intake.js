(function () {
  const SERVICE = document.body?.dataset.defaultService || "waste";
  const CONFIG = {
    waste: {
      label: "폐기물",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 수거 주소와 날짜부터 정리하면 됩니다.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 버릴 품목과 양을 실제에 가깝게 골라주세요.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 층수와 진입 조건을 같이 보면 더 정확해집니다.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 철거나 추가 인력이 필요한지 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    install: {
      label: "설치",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 설치 주소와 날짜부터 정리하면 됩니다.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 설치할 품목과 수량을 먼저 골라주세요.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 타공이나 연결 작업 여부를 확인하면 됩니다.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 사다리나 인부 같은 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 진행 방식을 확인하면 됩니다."
      }
    }
  };

  const state = {
    currentStep: 1,
    address: "",
    moveDate: "",
    timeSlot: "",
    memo: "",
    wasteScale: "small",
    wasteItems: {},
    noElevator: false,
    floor: 1,
    vehicleHard: false,
    dismantle: false,
    ladder: false,
    helper: false,
    installType: "furniture",
    installQty: 1,
    drilling: false,
    anchorFix: false,
    electric: false,
    gas: false,
    water: false,
    oldRemoval: false,
    modelName: ""
  };

  const WASTE_ITEM_PRICES = {
    chair: 10000,
    table: 20000,
    mattress: 30000,
    refrigerator: 50000,
    washer: 40000,
    wardrobe: 50000
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function formatWon(value) {
    return `${Number(value || 0).toLocaleString("ko-KR")}원`;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function getAttribution() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || "direct",
      medium: params.get("utm_medium") || null,
      campaign: params.get("utm_campaign") || null
    };
  }

  function calculateWastePrice() {
    const baseMap = { small: 70000, medium: 120000, large: 180000 };
    let total = baseMap[state.wasteScale] || 70000;
    Object.entries(state.wasteItems).forEach(([key, qty]) => {
      total += (WASTE_ITEM_PRICES[key] || 0) * Number(qty || 0);
    });
    if (state.noElevator) total += Math.max(0, Number(state.floor || 1) - 1) * 8000;
    if (state.vehicleHard) total += 20000;
    if (state.dismantle) total += 30000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculateInstallPrice() {
    const baseMap = {
      furniture: 60000,
      appliance: 70000,
      curtain: 50000,
      tv: 90000,
      lighting: 50000
    };
    const base = baseMap[state.installType] || 60000;
    const qty = Math.max(1, Number(state.installQty || 1));
    let total = base + Math.max(0, qty - 1) * Math.round(base * 0.5);
    if (state.drilling) total += 30000;
    if (state.anchorFix) total += 20000;
    if (state.electric) total += 30000;
    if (state.gas) total += 50000;
    if (state.water) total += 50000;
    if (state.oldRemoval) total += 20000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculatePrice() {
    const total = SERVICE === "install" ? calculateInstallPrice() : calculateWastePrice();
    const driverAmount = Math.round(total * 0.8);
    return {
      total,
      deposit: total,
      balance: 0,
      driverAmount,
      companyAmount: total - driverAmount
    };
  }

  function wasteItemLabel(key) {
    const map = {
      chair: "의자",
      table: "테이블",
      mattress: "매트리스",
      refrigerator: "냉장고",
      washer: "세탁기",
      wardrobe: "장롱"
    };
    return map[key] || key;
  }

  function wasteScaleLabel(scale) {
    const map = { small: "소형", medium: "중형", large: "대형" };
    return map[scale] || "소형";
  }

  function installTypeLabel(key) {
    const map = {
      furniture: "가구 설치",
      appliance: "가전 설치",
      curtain: "커튼·블라인드",
      tv: "TV 설치",
      lighting: "조명 설치"
    };
    return map[key] || "가구 설치";
  }

  function readState() {
    state.address = $("#serviceAddress")?.value?.trim() || "";
    state.moveDate = $("#moveDate")?.value || "";
    state.timeSlot = $('input[name="timeSlot"]:checked')?.value || "";
    state.memo = $("#serviceMemo")?.value?.trim() || "";
    state.ladder = !!$("#needsLadder")?.checked;
    state.helper = !!$("#needsHelper")?.checked;

    if (SERVICE === "waste") {
      state.wasteScale = $('input[name="wasteScale"]:checked')?.value || "small";
      state.noElevator = !!$("#wasteNoElevator")?.checked;
      state.floor = Number($("#wasteFloor")?.value || 1);
      state.vehicleHard = !!$("#vehicleHard")?.checked;
      state.dismantle = !!$("#wasteDismantle")?.checked;
      $$(".waste-item-qty").forEach((input) => {
        state.wasteItems[input.dataset.item] = Number(input.value || 0);
      });
    } else {
      state.installType = $('input[name="installType"]:checked')?.value || "furniture";
      state.installQty = Number($("#installQty")?.value || 1);
      state.drilling = !!$("#installDrilling")?.checked;
      state.anchorFix = !!$("#installAnchorFix")?.checked;
      state.electric = !!$("#installElectric")?.checked;
      state.gas = !!$("#installGas")?.checked;
      state.water = !!$("#installWater")?.checked;
      state.oldRemoval = !!$("#oldRemoval")?.checked;
      state.modelName = $("#modelName")?.value?.trim() || "";
    }
  }

  function validateStep(step) {
    readState();
    if (step === 1) return !!state.address && !!state.moveDate;
    if (step === 2) {
      if (SERVICE === "waste") {
        return Object.values(state.wasteItems).some((value) => Number(value || 0) > 0);
      }
      return !!state.installType && Number(state.installQty || 0) > 0;
    }
    return true;
  }

  function getSummaryLines() {
    if (SERVICE === "waste") {
      const items = Object.entries(state.wasteItems)
        .filter(([, qty]) => Number(qty || 0) > 0)
        .map(([key, qty]) => `${wasteItemLabel(key)} ${qty}개`);
      return [
        `수거 주소: ${state.address || "-"}`,
        `희망 날짜: ${state.moveDate || "-"}`,
        `짐 규모: ${wasteScaleLabel(state.wasteScale)}`,
        items.length ? `폐기물: ${items.join(", ")}` : "폐기물: 선택 없음",
        `작업 조건: ${[
          state.noElevator ? `${state.floor}층 계단` : "엘리베이터 있음",
          state.vehicleHard ? "차량 진입 어려움" : null,
          state.dismantle ? "간단 철거 필요" : null,
          state.helper ? "인부 필요" : null,
          state.ladder ? "사다리차 필요" : null
        ].filter(Boolean).join(" · ")}`
      ];
    }

    return [
      `설치 주소: ${state.address || "-"}`,
      `희망 날짜: ${state.moveDate || "-"}`,
      `설치 품목: ${installTypeLabel(state.installType)} ${Math.max(1, Number(state.installQty || 1))}건`,
      `작업 조건: ${[
        state.drilling ? "타공 있음" : "타공 없음",
        state.anchorFix ? "벽고정 있음" : null,
        state.electric ? "전기 연결" : null,
        state.gas ? "가스 연결" : null,
        state.water ? "수도 연결" : null,
        state.oldRemoval ? "기존 제품 철거" : null,
        state.helper ? "인부 필요" : null,
        state.ladder ? "사다리차 필요" : null
      ].filter(Boolean).join(" · ")}`,
      state.modelName ? `모델명: ${state.modelName}` : "모델명: 미입력"
    ];
  }

  function renderPrice() {
    readState();
    const pricing = calculatePrice();
    if ($("#stickyPrice")) $("#stickyPrice").textContent = formatWon(pricing.total);
    if ($("#price")) $("#price").textContent = formatWon(pricing.total);
    if ($("#stickyPriceDetail")) {
      $("#stickyPriceDetail").textContent = `기사 정산 예정 ${formatWon(pricing.driverAmount)} / 당고 정산 ${formatWon(pricing.companyAmount)}`;
    }
    if ($("#priceUnder")) {
      $("#priceUnder").textContent = "전체 결제 뒤 바로 주문을 만들고 배차 준비를 시작합니다.";
    }
    if ($("#summary")) {
      $("#summary").innerHTML = getSummaryLines().map((line) => `<div class="mini-summary">${line}</div>`).join("");
    }
  }

  function updateStageShell() {
    const progress = Math.round((state.currentStep / 5) * 100);
    if ($("#wizardStageBar")) $("#wizardStageBar").style.width = `${progress}%`;
    if ($("#wizardCheer")) $("#wizardCheer").textContent = CONFIG[SERVICE].cheer[state.currentStep];
    $$("#wizardStagePills .stage-pill").forEach((pill, index) => {
      pill.classList.toggle("is-active", index + 1 === state.currentStep);
      pill.classList.toggle("is-done", index + 1 < state.currentStep);
    });
  }

  function showStep(step) {
    state.currentStep = Math.max(1, Math.min(5, step));
    $$("[data-step]").forEach((section) => {
      section.hidden = String(section.dataset.step) !== String(state.currentStep);
    });
    updateStageShell();
    renderPrice();
    if ($("#wizardPrev")) $("#wizardPrev").disabled = state.currentStep === 1;
    if ($("#wizardNext")) $("#wizardNext").textContent = state.currentStep === 5 ? "결제 확인하기" : "다음 단계";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildRawText() {
    return [`[${CONFIG[SERVICE].label} 접수]`, ...getSummaryLines(), state.memo ? `메모: ${state.memo}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildCheckoutPayload(customerName, customerPhone) {
    readState();
    const pricing = calculatePrice();
    const attribution = getAttribution();
    return {
      service_type: SERVICE,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_note: state.memo || null,
      move_date: state.moveDate,
      start_address: state.address,
      end_address: state.address,
      distance_km: 0,
      floor: SERVICE === "waste" && state.noElevator ? state.floor : 0,
      weight_kg: 0,
      item_summary: SERVICE === "waste"
        ? { scale: state.wasteScale, wasteItems: state.wasteItems }
        : { installType: state.installType, installQty: state.installQty, modelName: state.modelName },
      option_summary: SERVICE === "waste"
        ? {
            noElevator: state.noElevator,
            vehicleHard: state.vehicleHard,
            dismantle: state.dismantle,
            helper: state.helper,
            ladder: state.ladder
          }
        : {
            drilling: state.drilling,
            anchorFix: state.anchorFix,
            electric: state.electric,
            gas: state.gas,
            water: state.water,
            oldRemoval: state.oldRemoval,
            helper: state.helper,
            ladder: state.ladder
          },
      acquisition_source: attribution.source,
      acquisition_medium: attribution.medium,
      acquisition_campaign: attribution.campaign,
      raw_text: buildRawText(),
      price_override: {
        total: pricing.total,
        deposit: pricing.total,
        balance: 0,
        driverAmount: pricing.driverAmount,
        companyAmount: pricing.companyAmount,
        version: `dango-${SERVICE}-v1`
      }
    };
  }

  async function startCheckout() {
    const customerName = ($("#checkoutCustomerName")?.value || "").trim();
    const customerPhone = normalizePhone($("#checkoutCustomerPhone")?.value || "");
    const messageEl = $("#checkoutInlineMessage");
    const button = $("#confirmCheckoutStart");
    if (!customerName || customerPhone.length < 10) {
      if (messageEl) messageEl.textContent = "이름과 연락처를 정확히 넣어주세요.";
      return;
    }
    const originalText = button?.textContent || "";
    if (button) {
      button.disabled = true;
      button.textContent = "결제 페이지를 준비하고 있어요...";
    }
    try {
      const res = await fetch("/.netlify/functions/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutPayload(customerName, customerPhone))
      });
      const data = await res.json();
      if (res.ok && data.job?.id) {
        window.location.href = `../customer/pay.html?jobId=${encodeURIComponent(data.job.id)}`;
        return;
      }
      throw new Error(data.error || "주문 생성 실패");
    } catch (error) {
      if (messageEl) messageEl.textContent = "주문 연결이 늦어지고 있어요. 잠시 후 다시 시도해주세요.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  function bindSteppers() {
    $$(".stepper-btn[data-stepper]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.stepper);
        if (!input) return;
        const value = Math.max(Number(input.min || 0), Number(input.value || 0) + Number(button.dataset.dir || 0));
        input.value = String(value);
        renderPrice();
      });
    });
  }

  function bindWasteItems() {
    $$(".waste-item-row").forEach((row) => {
      row.addEventListener("click", (event) => {
        if (event.target.closest("button") || event.target.tagName === "INPUT") return;
        const input = row.querySelector("input");
        if (!input) return;
        input.value = String(Number(input.value || 0) + 1);
        renderPrice();
      });
    });
    $$(".waste-item-stepper .stepper-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.dataset.item;
        const input = $(`.waste-item-qty[data-item="${item}"]`);
        if (!input) return;
        input.value = String(Math.max(0, Number(input.value || 0) + Number(button.dataset.dir || 0)));
        renderPrice();
      });
    });
  }

  function bindModals() {
    $$("[data-open-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = document.getElementById(button.dataset.openModal);
        if (modal) {
          modal.hidden = false;
          modal.setAttribute("aria-hidden", "false");
        }
      });
    });
    $$("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(".modal");
        if (modal) {
          modal.hidden = true;
          modal.setAttribute("aria-hidden", "true");
        }
      });
    });
  }

  function bindEvents() {
    bindSteppers();
    bindWasteItems();
    bindModals();
    $$("#wizardStagePills .stage-pill").forEach((pill, index) => {
      pill.addEventListener("click", () => {
        if (index + 1 <= state.currentStep || validateStep(state.currentStep)) {
          showStep(index + 1);
        }
      });
    });
    $("#wizardPrev")?.addEventListener("click", () => showStep(state.currentStep - 1));
    $("#wizardNext")?.addEventListener("click", () => {
      if (!validateStep(state.currentStep)) {
        alert("현재 단계 입력을 먼저 확인해주세요.");
        return;
      }
      if (state.currentStep === 5) {
        $("#startCheckoutCta")?.click();
        return;
      }
      showStep(state.currentStep + 1);
    });
    document.addEventListener("input", renderPrice);
    document.addEventListener("change", renderPrice);
    $("#confirmCheckoutStart")?.addEventListener("click", startCheckout);
    $("#stickyToggleBtn")?.addEventListener("click", () => {
      const bar = $("#stickyPriceBar");
      const expanded = bar?.classList.toggle("is-expanded");
      bar?.classList.toggle("is-collapsed", !expanded);
      $("#stickyToggleBtn").textContent = expanded ? "접기" : "상세";
      $("#stickyToggleBtn").setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    $(".dd-footer-toggle")?.addEventListener("click", () => {
      const body = $("#ddBizInfo");
      const expanded = $(".dd-footer-toggle").getAttribute("aria-expanded") === "true";
      $(".dd-footer-toggle").setAttribute("aria-expanded", expanded ? "false" : "true");
      if (body) body.hidden = expanded;
    });
  }

  function init() {
    const dateInput = $("#moveDate");
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    bindEvents();
    renderPrice();
    showStep(1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
