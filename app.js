/**
 * 이마트 센트럴점 냉장 간편식 프로모션 - 최종 app.js
 * Features:
 *  - 2종 골라담기 실시간 계산기 (20% 할인 엔진)
 *  - 라이프스타일 프리셋 원클릭 세팅
 *  - 카드뉴스 1~6 캐러셀 (터치/클릭/자동 슬라이드)
 *  - 타임어택 카운트다운 + 선착순 재고 시뮬레이션
 *  - 바코드 모달 팝업
 *  - 사이드바 스크롤 부드러운 떠오름 효과
 *  - 공유하기 + 토스트 알림
 *  - FAQ 아코디언
 */

'use strict';

/* ────────────────────────────────────────
   1. 상품 데이터
──────────────────────────────────────── */
const PRODUCTS = {
  saladwrap:   { name: '훈제오리 샐러드랩',  price: 6200 },
  beefbowl:    { name: '한끼 소불고기덮밥',  price: 5900 },
  chickenrice: { name: '매콤 닭갈비볶음밥', price: 5500 },
};

const PRESETS = {
  balance: { saladwrap: 1, beefbowl: 1, chickenrice: 0 },
  tasty:   { saladwrap: 1, beefbowl: 0, chickenrice: 1 },
  hearty:  { saladwrap: 0, beefbowl: 1, chickenrice: 1 },
  light:   { saladwrap: 2, beefbowl: 0, chickenrice: 0 },
};

/* ────────────────────────────────────────
   2. 상태 (State)
──────────────────────────────────────── */
let state = {
  qty: { saladwrap: 1, beefbowl: 1, chickenrice: 0 },
  currentSlide: 0,
  totalSlides: 6,
  autoSlideTimer: null,
  stockLeft: 20,
};

/* ────────────────────────────────────────
   3. 계산 엔진
──────────────────────────────────────── */
function calcBill() {
  const qty = state.qty;
  let subtotal = 0;
  let totalQty = 0;

  Object.keys(PRODUCTS).forEach(id => {
    subtotal += PRODUCTS[id].price * qty[id];
    totalQty += qty[id];
  });

  const eligible = totalQty >= 2;
  const discount = eligible ? Math.round(subtotal * 0.2) : 0;
  const final    = subtotal - discount;
  const perMeal  = totalQty > 0 ? Math.round(final / totalQty) : 0;

  return { subtotal, discount, final, totalQty, eligible, perMeal };
}

/* ────────────────────────────────────────
   4. UI 업데이트
──────────────────────────────────────── */
function fmt(n) {
  return n.toLocaleString('ko-KR');
}

function updateUI() {
  const { subtotal, discount, final, totalQty, eligible, perMeal } = calcBill();
  const qty = state.qty;

  // 각 상품 소계
  Object.keys(PRODUCTS).forEach(id => {
    const el = document.getElementById(`qty-${id}`);
    const sub = document.getElementById(`subtotal-${id}`);
    const card = document.querySelector(`.side-product-card[data-id="${id}"]`);
    if (el) el.textContent = qty[id];
    if (sub) sub.textContent = fmt(PRODUCTS[id].price * qty[id]) + '원';
    if (card) card.classList.toggle('has-qty', qty[id] > 0);
  });

  // 상태 배너
  const banner = document.getElementById('calcStatusBanner');
  if (banner) {
    if (eligible) {
      banner.classList.remove('warning');
      banner.innerHTML = '<span class="status-icon">🎉</span><span class="status-msg"><strong>20% 할인 조건 충족!</strong> (전 조합 9천원대 실현)</span>';
    } else {
      banner.classList.add('warning');
      const need = 2 - totalQty;
      banner.innerHTML = `<span class="status-icon">🛒</span><span class="status-msg">상품을 <strong>${need}개 더</strong> 담으면 20% 할인!</span>`;
    }
  }

  // 선택 칩 요약
  const chipsEl = document.getElementById('selectedChipsContainer');
  if (chipsEl) {
    let chips = '';
    Object.keys(PRODUCTS).forEach(id => {
      if (qty[id] > 0) {
        chips += `<span class="chip-bubble">${PRODUCTS[id].name} ${qty[id]}개</span>`;
      }
    });
    chipsEl.innerHTML = chips || '<span class="chip-bubble" style="color:#8B95A1;">상품을 선택해 주세요</span>';
  }

  // 금액 표시
  const origEl = document.getElementById('receiptOriginalPrice');
  const dcEl   = document.getElementById('receiptDiscountAmount');
  const finEl  = document.getElementById('receiptFinalPrice');
  const mealEl = document.getElementById('mealUnitPrice');
  const dcRow  = document.getElementById('receiptDcRow');
  const mealBanner = document.getElementById('mealUnitBanner');

  if (origEl) origEl.textContent = fmt(subtotal) + '원';
  if (dcEl)   dcEl.textContent   = eligible ? `-${fmt(discount)}원` : '0원';
  if (finEl)  finEl.textContent  = fmt(final);
  if (mealEl) mealEl.textContent = fmt(perMeal);
  if (dcRow)  dcRow.style.opacity = eligible ? '1' : '0.4';
  if (mealBanner) mealBanner.style.display = totalQty > 0 ? 'flex' : 'none';

  // 모달 티켓 동기화
  syncModalTicket(subtotal, final, qty);
}

function syncModalTicket(subtotal, final, qty) {
  const ticketItems = document.getElementById('ticketItemsSummary');
  const ticketOrig  = document.getElementById('ticketOrig');
  const ticketFinal = document.getElementById('ticketFinal');

  if (ticketItems) {
    let lines = '';
    Object.keys(PRODUCTS).forEach(id => {
      if (qty[id] > 0) {
        lines += `• ${PRODUCTS[id].name} ${qty[id]}개<br>`;
      }
    });
    ticketItems.innerHTML = lines || '• 상품을 선택해 주세요';
  }
  if (ticketOrig)  ticketOrig.textContent  = fmt(subtotal) + '원';
  if (ticketFinal) ticketFinal.textContent = fmt(final) + '원';
}

/* ────────────────────────────────────────
   5. 수량 컨트롤 이벤트
──────────────────────────────────────── */
function initQuantityControls() {
  document.querySelectorAll('.side-product-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.btn-sp-qty.plus')?.addEventListener('click', () => {
      state.qty[id]++;
      updateUI();
    });
    card.querySelector('.btn-sp-qty.minus')?.addEventListener('click', () => {
      if (state.qty[id] > 0) {
        state.qty[id]--;
        updateUI();
      }
    });
  });

  document.getElementById('btnReset')?.addEventListener('click', () => {
    Object.keys(state.qty).forEach(id => state.qty[id] = 0);
    document.querySelectorAll('.preset-box').forEach(b => b.classList.remove('active'));
    updateUI();
  });
}

/* ────────────────────────────────────────
   6. 프리셋 버튼
──────────────────────────────────────── */
function initPresets() {
  document.querySelectorAll('.preset-box').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;

      Object.keys(preset).forEach(id => { state.qty[id] = preset[id]; });
      document.querySelectorAll('.preset-box').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUI();

      // 사이드바로 부드럽게 스크롤
      document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

/* ────────────────────────────────────────
   7. 카드뉴스 캐러셀
──────────────────────────────────────── */
function goToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.dot');
  const total  = slides.length;

  if (index < 0) index = total - 1;
  if (index >= total) index = 0;
  state.currentSlide = index;

  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

function startAutoSlide() {
  stopAutoSlide();
  state.autoSlideTimer = setInterval(() => {
    goToSlide(state.currentSlide + 1);
  }, 4000);
}

function stopAutoSlide() {
  if (state.autoSlideTimer) {
    clearInterval(state.autoSlideTimer);
    state.autoSlideTimer = null;
  }
}

function initCarousel() {
  document.getElementById('btnPrevSlide')?.addEventListener('click', () => {
    goToSlide(state.currentSlide - 1);
    stopAutoSlide();
    startAutoSlide();
  });
  document.getElementById('btnNextSlide')?.addEventListener('click', () => {
    goToSlide(state.currentSlide + 1);
    stopAutoSlide();
    startAutoSlide();
  });
  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.index));
      stopAutoSlide();
      startAutoSlide();
    });
  });

  // 터치 스와이프
  const track = document.getElementById('cardNewsTrack');
  if (track) {
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        goToSlide(state.currentSlide + (diff > 0 ? 1 : -1));
        stopAutoSlide();
        startAutoSlide();
      }
    }, { passive: true });
  }

  startAutoSlide();
}

/* ────────────────────────────────────────
   8. 타임어택 카운트다운
──────────────────────────────────────── */
function initCountdown() {
  function tick() {
    const now  = new Date();
    const next = new Date();

    // 다음 정오(12:00) 계산
    next.setHours(12, 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);

    const diff = Math.max(0, next - now);
    const h    = Math.floor(diff / 3600000);
    const m    = Math.floor((diff % 3600000) / 60000);
    const s    = Math.floor((diff % 60000) / 1000);

    const pad = n => String(n).padStart(2, '0');
    const cdH = document.getElementById('cdHours');
    const cdM = document.getElementById('cdMinutes');
    const cdS = document.getElementById('cdSeconds');
    if (cdH) cdH.textContent = pad(h);
    if (cdM) cdM.textContent = pad(m);
    if (cdS) cdS.textContent = pad(s);

    // 상태 배지
    const badge = document.getElementById('taStatusBadge');
    const hr = now.getHours();
    if (badge) {
      if (hr === 12) {
        badge.textContent = '🔥 타임어택 진행 중!';
        badge.style.background = 'rgba(255,59,48,0.3)';
      } else {
        badge.textContent = '실시간 진행중';
        badge.style.background = '';
      }
    }
  }
  tick();
  setInterval(tick, 1000);

  // 재고 시뮬레이션 (랜덤 감소)
  function simulateStock() {
    if (state.stockLeft > 0 && Math.random() < 0.3) {
      state.stockLeft = Math.max(0, state.stockLeft - 1);
    }
    const leftEl = document.getElementById('stockLeft');
    const barEl  = document.getElementById('stockBarFill');
    if (leftEl) leftEl.textContent = state.stockLeft;
    if (barEl)  barEl.style.width  = (state.stockLeft / 20 * 100) + '%';
  }
  setInterval(simulateStock, 8000);
}

/* ────────────────────────────────────────
   9. 바코드 모달
──────────────────────────────────────── */
function initModal() {
  const modal     = document.getElementById('barcodeModal');
  const openBtns  = [document.getElementById('btnOpenBarcode'), document.getElementById('btnHeaderBarcode')];
  const closeBtn  = document.getElementById('btnCloseModal');
  const confirmBtn= document.getElementById('btnModalConfirm');

  function openModal() {
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  openBtns.forEach(btn => btn?.addEventListener('click', openModal));
  closeBtn?.addEventListener('click', closeModal);
  confirmBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ────────────────────────────────────────
   10. 공유하기 + 토스트
──────────────────────────────────────── */
function showToast(msg) {
  const toast = document.getElementById('toastMessage');
  const text  = document.getElementById('toastText');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function initShare() {
  const shareAction = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: '이마트 센트럴점 간편식 20% 할인!', url });
      } catch (_) { /* 취소 무시 */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사되었습니다! 친구에게 공유해 보세요 😊');
      } catch (_) {
        showToast('링크 복사에 실패했습니다. 직접 URL을 복사해 주세요.');
      }
    }
  };

  document.getElementById('btnShareTop')?.addEventListener('click', shareAction);
  document.getElementById('btnShareComb')?.addEventListener('click', shareAction);
}

/* ────────────────────────────────────────
   11. FAQ 아코디언
──────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // 모두 닫기
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ────────────────────────────────────────
   12. 사이드바 스크롤 떠오름 효과
──────────────────────────────────────── */
function initScrollEffect() {
  const panel = document.getElementById('stickyCalcPanel');
  if (!panel) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        panel.classList.toggle('is-scrolling', window.scrollY > 80);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ────────────────────────────────────────
   13. 초기화 (DOM Ready)
──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  initQuantityControls();
  initPresets();
  initCarousel();
  initCountdown();
  initModal();
  initShare();
  initFAQ();
  initScrollEffect();
});
