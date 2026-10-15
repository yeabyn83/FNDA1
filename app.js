/**
 * Emart Central Store Customer Promotion WebApp Logic
 * Features:
 *  - 2-Item Selection Simulator & Real-time Bill Engine (20% DC)
 *  - Lifestyle Preset Quick Selector
 *  - Real-time 12:00 Time Attack Countdown Timer (Daily 20 Sets Limit)
 *  - Card News Carousel (Touch/Click/Auto-slide)
 *  - Mobile Barcode / Coupon Voucher Modal
 *  - Social Share & Toast Notification
 *  - Accessible FAQ Accordion
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Data Definitions
  const PRODUCTS = {
    saladwrap: {
      id: 'saladwrap',
      name: '훈제오리 샐러드랩',
      price: 6200
    },
    beefbowl: {
      id: 'beefbowl',
      name: '한끼 소불고기덮밥',
      price: 5900
    },
    chickenrice: {
      id: 'chickenrice',
      name: '매콤 닭갈비볶음밥',
      price: 5500
    }
  };

  const PRESETS = {
    balance: { saladwrap: 1, beefbowl: 1, chickenrice: 0 },
    tasty: { saladwrap: 1, beefbowl: 0, chickenrice: 1 },
    hearty: { saladwrap: 0, beefbowl: 1, chickenrice: 1 },
    light: { saladwrap: 2, beefbowl: 0, chickenrice: 0 }
  };

  // State
  let currentQuantities = {
    saladwrap: 1,
    beefbowl: 1,
    chickenrice: 0
  };

  // DOM Elements - Sidebar Simulator
  const qtyDisplays = {
    saladwrap: document.getElementById('qty-saladwrap'),
    beefbowl: document.getElementById('qty-beefbowl'),
    chickenrice: document.getElementById('qty-chickenrice')
  };

  const subtotalDisplays = {
    saladwrap: document.getElementById('subtotal-saladwrap'),
    beefbowl: document.getElementById('subtotal-beefbowl'),
    chickenrice: document.getElementById('subtotal-chickenrice')
  };

  const productCards = document.querySelectorAll('.side-product-card');
  const presetBoxes = document.querySelectorAll('.preset-box');

  // Receipt Elements
  const calcStatusBanner = document.getElementById('calcStatusBanner');
  const selectedChipsContainer = document.getElementById('selectedChipsContainer');
  const receiptOriginalPrice = document.getElementById('receiptOriginalPrice');
  const receiptDcRow = document.getElementById('receiptDcRow');
  const receiptDiscountAmount = document.getElementById('receiptDiscountAmount');
  const receiptFinalPrice = document.getElementById('receiptFinalPrice');
  const mealUnitPrice = document.getElementById('mealUnitPrice');
  const mealUnitBanner = document.getElementById('mealUnitBanner');
  const btnReset = document.getElementById('btnReset');

  // Modal Elements
  const barcodeModal = document.getElementById('barcodeModal');
  const btnOpenBarcode = document.getElementById('btnOpenBarcode');
  const btnHeaderBarcode = document.getElementById('btnHeaderBarcode');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnModalConfirm = document.getElementById('btnModalConfirm');
  const ticketItemsSummary = document.getElementById('ticketItemsSummary');
  const ticketOrig = document.getElementById('ticketOrig');
  const ticketFinal = document.getElementById('ticketFinal');

  // Share & Toast Elements
  const btnShareTop = document.getElementById('btnShareTop');
  const btnShareComb = document.getElementById('btnShareComb');
  const toastMessage = document.getElementById('toastMessage');
  const toastText = document.getElementById('toastText');

  // Format Helper
  const formatWon = (num) => Number(num).toLocaleString('ko-KR') + '원';

  // 2. Simulator Calculation Engine
  function updateSimulatorUI() {
    let totalCount = 0;
    let originalTotal = 0;
    const selectedItems = [];

    // Process each product
    Object.keys(PRODUCTS).forEach((id) => {
      const qty = currentQuantities[id] || 0;
      totalCount += qty;
      const subtotal = qty * PRODUCTS[id].price;
      originalTotal += subtotal;

      // Update Qty display
      if (qtyDisplays[id]) qtyDisplays[id].textContent = qty;
      if (subtotalDisplays[id]) subtotalDisplays[id].textContent = formatWon(subtotal);

      // Card active highlight
      const card = document.querySelector(`.side-product-card[data-id="${id}"]`);
      if (card) {
        if (qty > 0) {
          card.classList.add('has-qty');
        } else {
          card.classList.remove('has-qty');
        }
      }

      if (qty > 0) {
        selectedItems.push({
          name: PRODUCTS[id].name,
          qty: qty
        });
      }
    });

    // Check 20% discount criteria (2 or more items)
    const isDiscountQualified = totalCount >= 2;
    const discountAmount = isDiscountQualified ? Math.round(originalTotal * 0.20) : 0;
    const finalPrice = originalTotal - discountAmount;
    const perMeal = totalCount > 0 ? Math.round(finalPrice / totalCount) : 0;

    // 1) Update Status Banner
    if (isDiscountQualified) {
      calcStatusBanner.className = 'receipt-status-banner';
      calcStatusBanner.innerHTML = `<span class="status-icon">🎉</span><span class="status-msg"><strong>20% 즉시 할인 적용!</strong> (전 조합 9천원대 실현)</span>`;
      if (receiptDcRow) receiptDcRow.style.display = 'flex';
      if (mealUnitBanner) mealUnitBanner.style.display = 'flex';
    } else if (totalCount === 1) {
      calcStatusBanner.className = 'receipt-status-banner warning';
      calcStatusBanner.innerHTML = `<span class="status-icon">💡</span><span class="status-msg"><strong>1개 더 담으시면</strong> 20% 즉시 할인이 적용됩니다!</span>`;
      if (receiptDcRow) receiptDcRow.style.display = 'none';
      if (mealUnitBanner) mealUnitBanner.style.display = 'none';
    } else {
      calcStatusBanner.className = 'receipt-status-banner warning';
      calcStatusBanner.innerHTML = `<span class="status-icon">🛒</span><span class="status-msg">원하는 상품을 2개 이상 선택해 보세요!</span>`;
      if (receiptDcRow) receiptDcRow.style.display = 'none';
      if (mealUnitBanner) mealUnitBanner.style.display = 'none';
    }

    // 2) Update Chips Summary
    selectedChipsContainer.innerHTML = '';
    if (selectedItems.length === 0) {
      selectedChipsContainer.innerHTML = '<span class="chip-bubble" style="color:#8B95A1;">선택된 상품이 없습니다</span>';
    } else {
      selectedItems.forEach(item => {
        const chip = document.createElement('span');
        chip.className = 'chip-bubble';
        chip.textContent = `${item.name} ${item.qty}개`;
        selectedChipsContainer.appendChild(chip);
      });
    }

    // 3) Update Prices
    receiptOriginalPrice.textContent = formatWon(originalTotal);
    receiptDiscountAmount.textContent = `-${formatWon(discountAmount)}`;
    receiptFinalPrice.textContent = Number(finalPrice).toLocaleString('ko-KR');
    if (mealUnitPrice) mealUnitPrice.textContent = Number(perMeal).toLocaleString('ko-KR');

    // 4) Update Modal Ticket Content
    if (ticketItemsSummary) {
      if (selectedItems.length === 0) {
        ticketItemsSummary.innerHTML = '선택된 상품이 없습니다.';
      } else {
        ticketItemsSummary.innerHTML = selectedItems.map(item => `• ${item.name} ${item.qty}개`).join('<br>');
      }
    }
    if (ticketOrig) ticketOrig.textContent = formatWon(originalTotal);
    if (ticketFinal) ticketFinal.textContent = formatWon(finalPrice);
  }

  // 3. Event Listeners for +/- buttons in Sidebar
  productCards.forEach(card => {
    const id = card.dataset.id;
    const btnMinus = card.querySelector('.btn-sp-qty.minus');
    const btnPlus = card.querySelector('.btn-sp-qty.plus');

    btnMinus.addEventListener('click', () => {
      if (currentQuantities[id] > 0) {
        currentQuantities[id]--;
        clearActivePreset();
        updateSimulatorUI();
      }
    });

    btnPlus.addEventListener('click', () => {
      if (currentQuantities[id] < 10) {
        currentQuantities[id]++;
        clearActivePreset();
        updateSimulatorUI();
      }
    });
  });

  // Reset Button
  btnReset.addEventListener('click', () => {
    currentQuantities = { saladwrap: 0, beefbowl: 0, chickenrice: 0 };
    clearActivePreset();
    updateSimulatorUI();
    showToast('선택이 초기화되었습니다.');
  });

  // 4. Quick Presets Handling
  function clearActivePreset() {
    presetBoxes.forEach(p => p.classList.remove('active'));
  }

  presetBoxes.forEach(box => {
    box.addEventListener('click', () => {
      const presetKey = box.dataset.preset;
      if (PRESETS[presetKey]) {
        currentQuantities = { ...PRESETS[presetKey] };
        clearActivePreset();
        box.classList.add('active');
        updateSimulatorUI();
        
        // Mobile / Small screen auto-scroll
        if (window.innerWidth <= 1024) {
          const simSection = document.getElementById('simulator');
          if (simSection) {
            simSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });
  });

  // 5. Card News Carousel Logic
  const track = document.getElementById('cardNewsTrack');
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const btnPrev = document.getElementById('btnPrevSlide');
  const btnNext = document.getElementById('btnNextSlide');
  let currentSlideIndex = 0;
  let carouselTimer = null;

  function showSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlideIndex = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
      showSlide(currentSlideIndex - 1);
      resetAutoSlide();
    });

    btnNext.addEventListener('click', () => {
      showSlide(currentSlideIndex + 1);
      resetAutoSlide();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      showSlide(idx);
      resetAutoSlide();
    });
  });

  function startAutoSlide() {
    carouselTimer = setInterval(() => {
      showSlide(currentSlideIndex + 1);
    }, 5000);
  }

  function resetAutoSlide() {
    clearInterval(carouselTimer);
    startAutoSlide();
  }

  startAutoSlide();

  // 6. Time Attack Countdown Timer Logic (20 Sets Limit)
  function updateTimeAttackCountdown() {
    const hoursEl = document.getElementById('cdHours');
    const minutesEl = document.getElementById('cdMinutes');
    const secondsEl = document.getElementById('cdSeconds');
    const taBadge = document.getElementById('taStatusBadge');

    const now = new Date();
    const target = new Date(now);
    target.setHours(12, 0, 0, 0);

    let diff = target - now;

    if (diff < 0) {
      const endOfDay = new Date(now);
      endOfDay.setHours(22, 0, 0, 0);
      const remainingTime = endOfDay - now;

      if (remainingTime > 0) {
        if (taBadge) taBadge.textContent = '타임어택 진행중 (선착순 20세트)';
        const h = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
        const m = Math.floor((remainingTime / (1000 * 60)) % 60);
        const s = Math.floor((remainingTime / 1000) % 60);

        if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
        return;
      } else {
        target.setDate(target.getDate() + 1);
        diff = target - now;
        if (taBadge) taBadge.textContent = '내일 12:00 오픈';
      }
    } else {
      if (taBadge) taBadge.textContent = '오픈 준비중';
    }

    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(mins).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(secs).padStart(2, '0');
  }

  setInterval(updateTimeAttackCountdown, 1000);
  updateTimeAttackCountdown();

  // 7. Modal Control
  function openModal() {
    barcodeModal.classList.add('open');
    barcodeModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    barcodeModal.classList.remove('open');
    barcodeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnOpenBarcode) btnOpenBarcode.addEventListener('click', openModal);
  if (btnHeaderBarcode) btnHeaderBarcode.addEventListener('click', openModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnModalConfirm) btnModalConfirm.addEventListener('click', closeModal);

  barcodeModal.addEventListener('click', (e) => {
    if (e.target === barcodeModal) closeModal();
  });

  // 8. Toast Helper
  function showToast(message) {
    if (!toastMessage) return;
    toastText.textContent = message;
    toastMessage.classList.add('show');
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2400);
  }

  // 9. Share Functionality
  function handleShare() {
    const shareData = {
      title: '이마트 센트럴점 간편식 20% 파격 할인',
      text: '내 맘대로 2개 골라 담으면 전 조합 9천원대! 매일 점심 12시 선착순 20세트 특가를 센트럴점에서 만나보세요.',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        copyToClipboard(window.location.href);
      });
    } else {
      copyToClipboard(window.location.href);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('링크가 클립보드에 복사되었습니다! 🎉');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('링크가 클립보드에 복사되었습니다! 🎉');
  }

  if (btnShareTop) btnShareTop.addEventListener('click', handleShare);
  if (btnShareComb) btnShareComb.addEventListener('click', handleShare);

  // 10. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // Initial Simulator Run
  updateSimulatorUI();
});
