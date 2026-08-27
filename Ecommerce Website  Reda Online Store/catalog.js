// ============================================================
// TechMart - catalog.js
// الكود النهائي الموحد والشامل لفريق العمل
// المميزات: بحث حي، فلاتر متداخلة، تقييم تفاعلي محفوظ، سلة ومفضلة
// ============================================================

(function () {
  "use strict";

  // 1. الإعدادات ومفاتيح التخزين المحلي (Configuration & Storage Keys)
  const CONFIG = {
    JSON_FILE: "products.json",
    STORAGE_KEYS: {
      wishlist: "techmart_wishlist",
      cart: "techmart_cart",
      ratings: "techmart_ratings"
    }
  };

  // 2. موصلات عناصر واجهة المستخدم (DOM Elements)
  const DOM = {
    grid: document.querySelector(".products-grid"),
    sort: document.getElementById("sort"),
    search: document.getElementById("product-search"),
    wishlistToggle: document.getElementById("show-wishlist-only"),
    wishlistCounter: document.getElementById("wishlist-count"),
    cartCounter: document.getElementById("cart-count"),
    resetBtn: document.getElementById("reset-filters"),
    priceBtn: document.querySelector(".btn-filter-apply"),
    minPrice: document.getElementById("min-price"),
    maxPrice: document.getElementById("max-price"),
    stockCheckbox: document.getElementById("in-stock"),
    toastContainer: document.getElementById("toast-container")
  };

  // 3. حالة التطبيق المركزية (Central State)
  const state = {
    allProducts: [],
    filteredProducts: [],
    isLoading: true
  };

  // 4. دالة بدء التطبيق وتحميل البيانات
  async function initApp() {
    try {
      renderLoadingSkeleton();
      
      let data = [];
      try {
        const response = await fetch(CONFIG.JSON_FILE);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (fetchErr) {
        console.warn("جاري محاولة المسار البديل /products.json:", fetchErr);
        try {
          const resAlt = await fetch("/products.json");
          if (resAlt.ok) {
            data = await resAlt.json();
          } else {
            throw new Error("Fallback file not found");
          }
        } catch {
          data = getFallbackProducts();
        }
      }

      const savedRatings = getStoredData(CONFIG.STORAGE_KEYS.ratings, {});

      state.allProducts = data.map(p => {
        const custom = savedRatings[p.id] || {};
        return {
          ...p,
          id: Number(p.id),
          price: Number(p.price),
          old_price: p.old_price ? Number(p.old_price) : null,
          rating: custom.rating !== undefined ? Number(custom.rating) : Number(p.rating || 0),
          rating_count: custom.count !== undefined ? Number(custom.count) : Number(p.rating_count || 0),
          brand: p.brand ? p.brand.toLowerCase() : inferBrand(p.name_ar, p.name_en),
          in_stock: p.in_stock !== undefined ? p.in_stock : true
        };
      });

      state.filteredProducts = [...state.allProducts];
      state.isLoading = false;

      applyFiltersAndSort();
      attachGlobalListeners();
      updateGlobalUI();

    } catch (error) {
      console.error("خطأ أثناء تهيئة الكتالوج:", error);
      if (DOM.grid) {
        DOM.grid.innerHTML = `
          <div class="error" style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #e53e3e; background: #fff5f5; border-radius: 8px; border: 1px solid #feb2b2;">
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 8px;">تعذر تحميل المنتجات</p>
            <p style="font-size: 0.9rem; color: #718096;">تأكد من سلامة ملف products.json ومسار الاستدعاء.</p>
          </div>
        `;
      }
    }
  }

  // 5. رسم واجهة التحميل المؤقت (Skeleton Loader)
  function renderLoadingSkeleton() {
    if (!DOM.grid) return;
    DOM.grid.innerHTML = Array(8).fill(0).map(() => `
      <div class="product-card" style="opacity: 0.6; pointer-events: none;">
        <div style="width: 100%; height: 140px; background: #e2e8f0; border-radius: 6px; margin-bottom: 12px;"></div>
        <div style="width: 70%; height: 16px; background: #e2e8f0; border-radius: 4px; margin: 0 auto 10px;"></div>
        <div style="width: 40%; height: 18px; background: #cbd5e1; border-radius: 4px; margin: 0 auto 12px;"></div>
        <div style="width: 100%; height: 38px; background: #e2e8f0; border-radius: 8px; margin-top: auto;"></div>
      </div>
    `).join("");
  }

  // 6. استنتاج الماركة من اسم المنتج تلقائياً
  function inferBrand(arName, enName) {
    const combined = `${arName || ""} ${enName || ""}`.toLowerCase();
    if (combined.includes("apple") || combined.includes("آيفون") || combined.includes("ايفون")) return "apple";
    if (combined.includes("samsung") || combined.includes("سامسونج")) return "samsung";
    if (combined.includes("sony") || combined.includes("سوني")) return "sony";
    if (combined.includes("lg") || combined.includes("ال جي")) return "lg";
    if (combined.includes("hp") || combined.includes("اتش بي")) return "hp";
    if (combined.includes("lenovo") || combined.includes("لينوفو")) return "lenovo";
    if (combined.includes("huawei") || combined.includes("هواوي")) return "huawei";
    if (combined.includes("epson") || combined.includes("إبسون") || combined.includes("ابسون")) return "epson";
    return "other";
  }

  // 7. بناء هيكل النجوم التفاعلية مع دعم التقييم والتحويم
  function createStarsHTML(rating, productId) {
    const roundedRating = Math.round(Number(rating) || 0);
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= roundedRating;
      stars += `<span class="star ${isFilled ? "star-filled" : "star-empty"}" data-value="${i}" title="تقييم ${i} من 5" style="cursor:pointer; color: ${isFilled ? "var(--star-color, #ffc107)" : "#d1d5db"}; font-size: 1.1rem; padding: 0 1px; transition: transform 0.15s ease;">★</span>`;
    }
    return `<div class="interactive-stars" data-pid="${productId}" style="display:inline-flex; align-items:center; gap:2px;">${stars}</div>`;
  }

  // 8. توليد بطاقة المنتج ديناميكياً مع معالجة الصور والتخفيض
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;

    const discountBadge = (product.old_price && product.old_price > product.price)
      ? `<span class="badge discount" style="position:absolute; top:10px; right:10px; background:#ef4444; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">-${Math.round(((product.old_price - product.price) / product.old_price) * 100)}%</span>`
      : "";

    const wishlist = getStoredData(CONFIG.STORAGE_KEYS.wishlist, []);
    const isWishlisted = wishlist.includes(product.id);

    card.innerHTML = `
      ${discountBadge}
      <button class="btn-wishlist ${isWishlisted ? "active" : ""}" title="${isWishlisted ? "إزالة من المفضلة" : "أضف للمفضلة"}" type="button" aria-label="أضف للمفضلة">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
      <a href="product-detail.html?id=${product.id}" class="product-link" style="text-decoration:none; color:inherit; display:block;">
        <img 
          src="${product.img}" 
          alt="${product.name_ar}" 
          class="product-image" 
          loading="lazy"
          onerror="this.onerror=null; if('${product.fallback_img}') { this.src='${product.fallback_img}'; } else { this.src='https://placehold.co/400x300/f3f4f6/334155?text=${encodeURIComponent(product.name_ar)}'; }"
        >
        <h2 class="product-title">${product.name_ar}</h2>
      </a>
      <div class="product-price-box" style="display:flex; justify-content:center; align-items:baseline; gap:8px; margin: 4px 0 8px;">
        <span class="product-price" style="font-weight:700; font-size:1.05rem; color:var(--text-color, #1f2937);">$${product.price.toFixed(2)}</span>
        ${product.old_price ? `<span class="old-price" style="text-decoration:line-through; font-size:0.85rem; color:#9ca3af;">$${product.old_price.toFixed(2)}</span>` : ""}
      </div>
      <div class="product-rating" style="display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:12px;">
        ${createStarsHTML(product.rating, product.id)}
        <span class="rating-count" style="font-size:0.8rem; color:#6b7280;">(${product.rating_count})</span>
      </div>
      <button class="btn-add-cart" data-id="${product.id}" type="button">أضف إلى السلة</button>
    `;

    return card;
  }

  // 9. محرك الفلترة والترتيب الموحد (The Filter & Sort Engine)
  function applyFiltersAndSort() {
    const query = DOM.search ? DOM.search.value.toLowerCase().trim() : "";
    const wishlistOnly = DOM.wishlistToggle ? DOM.wishlistToggle.checked : false;
    const wishlist = getStoredData(CONFIG.STORAGE_KEYS.wishlist, []);
    
    // الماركات المحددة
    const checkedBrandNodes = document.querySelectorAll('input[name="brand"]:checked');
    const selectedBrands = Array.from(checkedBrandNodes).map(cb => cb.value.toLowerCase());

    // نطاق السعر
    const minP = parseFloat(DOM.minPrice?.value) || 0;
    const maxP = parseFloat(DOM.maxPrice?.value) || Infinity;

    // التقييم الأدنى
    const checkedRating = document.querySelector('input[name="rating-filter"]:checked');
    const minRate = checkedRating ? Number(checkedRating.value) : 0;

    // التوفر في المخزون
    const stockOnly = DOM.stockCheckbox ? DOM.stockCheckbox.checked : false;

    // تطبيق الفلاتر
    state.filteredProducts = state.allProducts.filter(p => {
      const fullText = `${p.name_ar || ""} ${p.name_en || ""} ${p.category || ""}`.toLowerCase();
      const matchesSearch = query === "" || fullText.includes(query);
      const matchesWishlist = !wishlistOnly || wishlist.includes(p.id);
      
      const productBrand = (p.brand || inferBrand(p.name_ar, p.name_en)).toLowerCase();
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(productBrand) || selectedBrands.some(b => fullText.includes(b));
      
      const matchesPrice = p.price >= minP && p.price <= maxP;
      const matchesRating = p.rating >= minRate;
      const matchesStock = !stockOnly || p.in_stock === true;

      return matchesSearch && matchesWishlist && matchesBrand && matchesPrice && matchesRating && matchesStock;
    });

    // خوارزميات الترتيب
    const sortType = DOM.sort ? DOM.sort.value : "price-asc";
    state.filteredProducts.sort((a, b) => {
      if (sortType === "price-asc") return a.price - b.price;
      if (sortType === "price-desc") return b.price - a.price;
      if (sortType === "rating") return b.rating - a.rating || b.rating_count - a.rating_count;
      if (sortType === "newest") return b.id - a.id;
      return 0;
    });

    renderUI();
  }

  // 10. رسم وتحديث الواجهة
  function renderUI() {
    if (!DOM.grid) return;
    DOM.grid.innerHTML = "";

    if (state.filteredProducts.length === 0) {
      DOM.grid.innerHTML = `
        <div class="products-empty" style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">عذراً، لا توجد نتائج مطابقة لاختياراتك</h3>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 14px;">جرب تغيير كلمات البحث أو مسح بعض الفلاتر لعرض المنتجات.</p>
          <button type="button" id="empty-reset-btn" class="btn-filter-apply" style="max-width: 180px; margin: 0 auto; display: block;">إعادة ضبط الفلاتر</button>
        </div>
      `;

      const emptyReset = document.getElementById("empty-reset-btn");
      if (emptyReset) {
        emptyReset.addEventListener("click", resetAllFilters);
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    state.filteredProducts.forEach(p => {
      fragment.appendChild(createProductCard(p));
    });
    DOM.grid.appendChild(fragment);

    bindCardEvents();
  }

  // 11. ربط أحداث البطاقات (السلة، المفضلة، التقييم)
  function bindCardEvents() {
    // إضافة إلى السلة
    DOM.grid.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const pid = Number(btn.dataset.id);
        const product = state.allProducts.find(p => p.id === pid);
        if (product) {
          addToCart(product);
          btn.style.transform = "scale(0.96)";
          setTimeout(() => btn.style.transform = "scale(1)", 150);
        }
      };
    });

    // إدارة المفضلة
    DOM.grid.querySelectorAll(".btn-wishlist").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const card = btn.closest(".product-card");
        if (card) {
          toggleWishlist(Number(card.dataset.id));
        }
      };
    });

    // تقييم النجوم وحفظه بالـ localStorage
    DOM.grid.querySelectorAll(".star").forEach(star => {
      star.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const parent = this.closest(".interactive-stars");
        if (!parent) return;
        
        const pid = Number(parent.dataset.pid);
        const selectedValue = Number(this.dataset.value);
        const product = state.allProducts.find(p => p.id === pid);

        if (product) {
          const oldRating = product.rating || 0;
          const oldCount = product.rating_count || 0;
          const newCount = oldCount + 1;
          const newRating = Number(((oldRating * oldCount + selectedValue) / newCount).toFixed(1));

          product.rating = newRating;
          product.rating_count = newCount;

          const savedRatings = getStoredData(CONFIG.STORAGE_KEYS.ratings, {});
          savedRatings[pid] = { rating: newRating, count: newCount };
          setStoredData(CONFIG.STORAGE_KEYS.ratings, savedRatings);

          showToast(`شكراً لك! تم تقييم المنتج بـ ${selectedValue} نجوم ⭐`);
          applyFiltersAndSort();
        }
      };

      // تأثير التحويم
      star.onmouseenter = function() {
        const val = Number(this.dataset.value);
        const parent = this.closest(".interactive-stars");
        if (!parent) return;
        parent.querySelectorAll(".star").forEach(s => {
          const sVal = Number(s.dataset.value);
          s.style.color = sVal <= val ? "#f59e0b" : "#e2e8f0";
        });
      };

      star.onmouseleave = function() {
        const parent = this.closest(".interactive-stars");
        if (!parent) return;
        const pid = Number(parent.dataset.pid);
        const prod = state.allProducts.find(p => p.id === pid);
        const currRate = prod ? Math.round(prod.rating) : 0;
        parent.querySelectorAll(".star").forEach(s => {
          const sVal = Number(s.dataset.value);
          s.style.color = sVal <= currRate ? "var(--star-color, #ffc107)" : "#d1d5db";
        });
      };
    });
  }

  // 12. عمليات السلة والمفضلة والإشعارات
  function addToCart(product) {
    const cart = getStoredData(CONFIG.STORAGE_KEYS.cart, []);
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        price: product.price,
        img: product.img,
        quantity: 1
      });
    }

    setStoredData(CONFIG.STORAGE_KEYS.cart, cart);
    showToast(`تمت إضافة "${product.name_ar}" إلى السلة 🛒`);
    updateGlobalUI();
  }

  function toggleWishlist(productId) {
    const wishlist = getStoredData(CONFIG.STORAGE_KEYS.wishlist, []);
    const index = wishlist.indexOf(productId);
    const product = state.allProducts.find(p => p.id === productId);
    const prodName = product ? product.name_ar : "المنتج";

    if (index === -1) {
      wishlist.push(productId);
      showToast(`تمت إضافة "${prodName}" إلى المفضلة ❤️`);
    } else {
      wishlist.splice(index, 1);
      showToast(`تمت إزالة "${prodName}" من المفضلة 🤍`);
    }

    setStoredData(CONFIG.STORAGE_KEYS.wishlist, wishlist);
    updateGlobalUI();

    if (DOM.wishlistToggle && DOM.wishlistToggle.checked) {
      applyFiltersAndSort();
    }
  }

  function showToast(message) {
    let container = DOM.toastContainer;
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
      DOM.toastContainer = container;
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }

  function updateGlobalUI() {
    const wishlist = getStoredData(CONFIG.STORAGE_KEYS.wishlist, []);
    const cart = getStoredData(CONFIG.STORAGE_KEYS.cart, []);

    if (DOM.wishlistCounter) {
      DOM.wishlistCounter.textContent = wishlist.length;
    }

    if (DOM.cartCounter) {
      const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      DOM.cartCounter.textContent = totalCount;
    }

    document.querySelectorAll(".product-card").forEach(card => {
      const cardId = Number(card.dataset.id);
      const btn = card.querySelector(".btn-wishlist");
      if (btn) {
        if (wishlist.includes(cardId)) {
          btn.classList.add("active");
          btn.querySelector("svg")?.setAttribute("fill", "currentColor");
        } else {
          btn.classList.remove("active");
          btn.querySelector("svg")?.setAttribute("fill", "none");
        }
      }
    });
  }

  function resetAllFilters() {
    if (DOM.search) DOM.search.value = "";
    if (DOM.wishlistToggle) DOM.wishlistToggle.checked = false;
    if (DOM.sort) DOM.sort.selectedIndex = 0;
    if (DOM.minPrice) DOM.minPrice.value = "";
    if (DOM.maxPrice) DOM.maxPrice.value = "";
    if (DOM.stockCheckbox) DOM.stockCheckbox.checked = false;

    document.querySelectorAll('input[type="checkbox"][name="brand"]').forEach(el => el.checked = false);
    document.querySelectorAll('input[type="radio"][name="rating-filter"]').forEach(el => el.checked = false);

    state.filteredProducts = [...state.allProducts];
    applyFiltersAndSort();
    showToast("تمت إعادة ضبط جميع الفلاتر 🔄");
  }

  // 13. ربط الأحداث العامة (Global Event Listeners)
  function attachGlobalListeners() {
    DOM.search?.addEventListener("input", debounce(applyFiltersAndSort, 200));
    DOM.sort?.addEventListener("change", applyFiltersAndSort);
    DOM.wishlistToggle?.addEventListener("change", applyFiltersAndSort);
    DOM.stockCheckbox?.addEventListener("change", applyFiltersAndSort);
    
    document.querySelectorAll('input[name="brand"], input[name="rating-filter"]').forEach(input => {
      input.addEventListener("change", applyFiltersAndSort);
    });

    DOM.priceBtn?.addEventListener("click", applyFiltersAndSort);
    DOM.resetBtn?.addEventListener("click", resetAllFilters);

    [DOM.minPrice, DOM.maxPrice].forEach(input => {
      input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyFiltersAndSort();
        }
      });
    });
  }

  // 14. دوال مساعدة (Helper Functions)
  function getStoredData(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  function setStoredData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("فشل التخزين في localStorage:", e);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // بيانات طوارئ مدمجة
  function getFallbackProducts() {
    return [
      { id: 101, img: "img/product/0.png", name_ar: "شاشة LG FHD", price: 145.00, rating: 5.0, rating_count: 128, brand: "lg" },
      { id: 102, img: "img/product/1.png", name_ar: "TECHNO 7", price: 28.00, old_price: 31.00, rating: 5.0, rating_count: 256, brand: "other" },
      { id: 103, img: "img/product/11.png", name_ar: "هواوي Y8", price: 65.00, rating: 4.0, rating_count: 310, brand: "huawei" },
      { id: 104, img: "img/product/10.png", name_ar: "داتا شو", price: 39.00, rating: 5.0, rating_count: 189, brand: "other" },
      { id: 105, img: "img/product/12.png", name_ar: "طابعة حراري epson", price: 31.00, rating: 4.0, rating_count: 95, brand: "epson" },
      { id: 106, img: "img/product/20.png", name_ar: "عصارة", price: 92.00, rating: 5.0, rating_count: 64, brand: "other" }
    ];
  }

  // تشغيل عند تحميل الصفحة
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();