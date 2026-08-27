// ==========================================
// TechMart - Catalog JavaScript
// مصدر المنتجات: products.json
// صفحة العرض: catalog.html
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------------------------
    // الإعدادات
    // ------------------------------------------

    const JSON_FILE = "products.json";

    const productsGrid = document.querySelector(".products-grid");
    const sortSelect = document.getElementById("sort");

    let products = [];
    let filteredProducts = [];


    // ------------------------------------------
    // تحميل المنتجات من JSON
    // ------------------------------------------

    async function loadProducts() {

        try {

            const response = await fetch(JSON_FILE);

            if (!response.ok) {
                throw new Error(
                    `Failed to load ${JSON_FILE}: ${response.status}`
                );
            }

            products = await response.json();

            // التأكد من أن البيانات مصفوفة
            if (!Array.isArray(products)) {
                throw new Error("Products JSON must contain an array.");
            }

            filteredProducts = [...products];

            renderProducts();

            initializeFilters();

        } catch (error) {

            console.error("Error loading products:", error);

            productsGrid.innerHTML = `
                <div class="products-error">
                    <p>حدث خطأ أثناء تحميل المنتجات.</p>
                    <p>تأكد من وجود ملف <strong>products.json</strong>.</p>
                </div>
            `;
        }
    }


    // ------------------------------------------
    // إنشاء بطاقة المنتج
    // ------------------------------------------

    function createProductCard(product) {

        const card = document.createElement("div");

        card.className = "product-card";
        card.dataset.id = product.id;


        // --------------------------------------
        // حساب الخصم
        // --------------------------------------

        let discountBadge = "";

        if (product.old_price && product.old_price > product.price) {

            const discount = Math.round(
                ((product.old_price - product.price) /
                    product.old_price) * 100
            );

            discountBadge = `
                <span class="badge discount">
                    -${discount}%
                </span>
            `;
        }


        // --------------------------------------
        // النجوم
        // --------------------------------------

        const rating = Number(product.rating) || 0;

        const fullStars = Math.floor(rating);

        const emptyStars = 5 - fullStars;

        const stars =
            "★".repeat(fullStars) +
            "☆".repeat(emptyStars);


        // --------------------------------------
        // السعر القديم
        // --------------------------------------

        let oldPriceHTML = "";

        if (product.old_price) {

            oldPriceHTML = `
                <span class="old-price">
                    $${Number(product.old_price).toFixed(2)}
                </span>
            `;
        }


        // --------------------------------------
        // البطاقة
        // --------------------------------------

        card.innerHTML = `

            ${discountBadge}

            <button
                class="btn-wishlist"
                aria-label="أضف للمفضلة"
                title="أضف للمفضلة"
                type="button">

                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">

                    <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0
                        L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78
                        7.78l1.06 1.06L12 21.23l7.78-7.78
                        1.06-1.06a5.5 5.5 0 0 0-7.78 0z">
                    </path>

                </svg>

            </button>


            <a
                href="product-detail.html?id=${product.id}"
                class="product-link">

                <img
                    src="${product.img}"
                    alt="${product.name_ar}"
                    class="product-image"
                    loading="lazy">

                <h2 class="product-title">
                    ${product.name_ar}
                </h2>

            </a>


            <div class="product-price-box">

                <span class="product-price">
                    $${Number(product.price).toFixed(2)}
                </span>

                ${oldPriceHTML}

            </div>


            <div class="product-rating">

                <span class="stars">
                    ${stars}
                </span>

                <span class="rating-count">
                    (${product.rating_count || 0})
                </span>

            </div>


            <button
                class="btn-add-cart"
                data-id="${product.id}"
                type="button">

                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">

                    <circle
                        cx="9"
                        cy="21"
                        r="1">
                    </circle>

                    <circle
                        cx="20"
                        cy="21"
                        r="1">
                    </circle>

                    <path
                        d="M1 1h4l2.68 13.39a2 2 0 0
                        0 2 1.61h9.72a2 2 0 0 0
                        2 1.61L23 6H6">
                    </path>

                </svg>

                أضف إلى السلة

            </button>
        `;


        return card;
    }


    // ------------------------------------------
    // عرض المنتجات
    // ------------------------------------------

    function renderProducts() {

        if (!productsGrid) {
            console.error("Element .products-grid was not found.");
            return;
        }

        productsGrid.innerHTML = "";

        if (filteredProducts.length === 0) {

            productsGrid.innerHTML = `
                <div class="products-empty">
                    لا توجد منتجات مطابقة للبحث.
                </div>
            `;

            return;
        }


        filteredProducts.forEach(product => {

            const card = createProductCard(product);

            productsGrid.appendChild(card);

        });


        initializeProductButtons();
    }


    // ------------------------------------------
    // ترتيب المنتجات
    // ------------------------------------------

    function sortProducts(type) {

        switch (type) {

            // الأقل سعراً
            case "price-asc":

                filteredProducts.sort(
                    (a, b) => Number(a.price) - Number(b.price)
                );

                break;


            // الأعلى سعراً
            case "price-desc":

                filteredProducts.sort(
                    (a, b) => Number(b.price) - Number(a.price)
                );

                break;


            // الأحدث
            // يعتمد على ترتيب ID
            case "newest":

                filteredProducts.sort(
                    (a, b) => Number(b.id) - Number(a.id)
                );

                break;


            // الأعلى تقييماً
            case "rating":

                filteredProducts.sort(
                    (a, b) => Number(b.rating) - Number(a.rating)
                );

                break;


            default:

                filteredProducts = [...products];

                break;
        }


        renderProducts();
    }


    // ------------------------------------------
    // فلتر الماركة
    // ------------------------------------------

    function getSelectedBrands() {

        const checkboxes =
            document.querySelectorAll(
                'input[name="brand"]:checked'
            );

        return Array.from(checkboxes)
            .map(checkbox =>
                checkbox.value.toLowerCase()
            );
    }


    // ------------------------------------------
    // تطبيق جميع الفلاتر
    // ------------------------------------------

    function applyFilters() {

        const selectedBrands = getSelectedBrands();


        const minPriceInput =
            document.getElementById("min-price");

        const maxPriceInput =
            document.getElementById("max-price");


        const minPrice =
            minPriceInput && minPriceInput.value
                ? Number(minPriceInput.value)
                : 0;


        const maxPrice =
            maxPriceInput && maxPriceInput.value
                ? Number(maxPriceInput.value)
                : Infinity;


        const selectedRating =
            document.querySelector(
                'input[name="rating-filter"]:checked'
            );


        const minimumRating =
            selectedRating
                ? Number(selectedRating.value)
                : 0;


        const stockCheckbox =
            document.getElementById("in-stock");


        const stockOnly =
            stockCheckbox
                ? stockCheckbox.checked
                : false;


        filteredProducts = products.filter(product => {


            // ----------------------------------
            // فلتر الماركة
            // ----------------------------------

            if (selectedBrands.length > 0) {

                const productName =
                    `${product.name_ar} ${product.name_en}`
                        .toLowerCase();

                const hasBrand =
                    selectedBrands.some(brand =>
                        productName.includes(brand)
                    );

                if (!hasBrand) {
                    return false;
                }
            }


            // ----------------------------------
            // فلتر السعر
            // ----------------------------------

            const price = Number(product.price);

            if (price < minPrice) {
                return false;
            }

            if (price > maxPrice) {
                return false;
            }


            // ----------------------------------
            // فلتر التقييم
            // ----------------------------------

            const rating =
                Number(product.rating) || 0;

            if (rating < minimumRating) {
                return false;
            }


            // ----------------------------------
            // فلتر المخزون
            // ----------------------------------

            /*
                ملاحظة:
                JSON الحالي لا يحتوي على stock أو in_stock.

                لذلك لن نستبعد أي منتج حاليًا.
                عندما نضيف stock إلى JSON سنفعّل
                هذا الفلتر بشكل كامل.
            */

            if (stockOnly && product.in_stock === false) {
                return false;
            }


            return true;

        });


        // إعادة الترتيب حسب الخيار الحالي
        if (sortSelect) {
            sortProducts(sortSelect.value);
        } else {
            renderProducts();
        }
    }


    // ------------------------------------------
    // تشغيل الفلاتر
    // ------------------------------------------

    function initializeFilters() {

        // فلتر الماركة
        const brandCheckboxes =
            document.querySelectorAll(
                'input[name="brand"]'
            );

        brandCheckboxes.forEach(checkbox => {

            checkbox.addEventListener(
                "change",
                applyFilters
            );

        });


        // فلتر التقييم
        const ratingRadios =
            document.querySelectorAll(
                'input[name="rating-filter"]'
            );

        ratingRadios.forEach(radio => {

            radio.addEventListener(
                "change",
                applyFilters
            );

        });


        // زر تطبيق السعر
        const applyPriceButton =
            document.querySelector(
                ".btn-filter-apply"
            );

        if (applyPriceButton) {

            applyPriceButton.addEventListener(
                "click",
                applyFilters
            );
        }


        // فلتر المخزون
        const stockCheckbox =
            document.getElementById("in-stock");

        if (stockCheckbox) {

            stockCheckbox.addEventListener(
                "change",
                applyFilters
            );
        }


        // الترتيب
        if (sortSelect) {

            sortSelect.addEventListener(
                "change",
                () => {

                    // إذا كان هناك فلاتر فعالة
                    // نحافظ عليها
                    if (
                        getSelectedBrands().length > 0 ||
                        document.getElementById("min-price")?.value ||
                        document.getElementById("max-price")?.value ||
                        document.querySelector(
                            'input[name="rating-filter"]:checked'
                        ) ||
                        document.getElementById("in-stock")?.checked
                    ) {

                        applyFilters();

                    } else {

                        sortProducts(sortSelect.value);

                    }

                }
            );
        }
    }


    // ------------------------------------------
    // أزرار السلة والمفضلة
    // ------------------------------------------

    function initializeProductButtons() {

        // ------------------------------
        // أضف إلى السلة
        // ------------------------------

        const cartButtons =
            document.querySelectorAll(
                ".btn-add-cart"
            );


        cartButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const productId =
                        Number(button.dataset.id);


                    const product =
                        products.find(
                            item =>
                                Number(item.id) === productId
                        );


                    if (!product) {
                        return;
                    }


                    addToCart(product);
                }
            );

        });


        // ------------------------------
        // المفضلة
        // ------------------------------

        const wishlistButtons =
            document.querySelectorAll(
                ".btn-wishlist"
            );


        wishlistButtons.forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const card =
                        button.closest(
                            ".product-card"
                        );


                    if (!card) {
                        return;
                    }


                    const productId =
                        Number(card.dataset.id);


                    toggleWishlist(
                        productId,
                        button
                    );

                }
            );

        });


        updateWishlistButtons();
    }


    // ------------------------------------------
    // السلة
    // ------------------------------------------

    function addToCart(product) {

        let cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];


        const existingProduct =
            cart.find(
                item =>
                    Number(item.id) === Number(product.id)
            );


        if (existingProduct) {

            existingProduct.quantity += 1;

        } else {

            cart.push({

                id: product.id,

                name_ar: product.name_ar,

                name_en: product.name_en,

                img: product.img,

                price: product.price,

                quantity: 1

            });
        }


        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );


        alert(
            `تمت إضافة "${product.name_ar}" إلى السلة`
        );
    }


    // ------------------------------------------
    // المفضلة
    // ------------------------------------------

    function toggleWishlist(productId, button) {

        let wishlist =
            JSON.parse(
                localStorage.getItem("wishlist")
            ) || [];


        const index =
            wishlist.indexOf(productId);


        if (index === -1) {

            wishlist.push(productId);

            button.classList.add("active");

        } else {

            wishlist.splice(index, 1);

            button.classList.remove("active");
        }


        localStorage.setItem(
            "wishlist",
            JSON.stringify(wishlist)
        );
    }


    // ------------------------------------------
    // تحديث أزرار المفضلة
    // ------------------------------------------

    function updateWishlistButtons() {

        const wishlist =
            JSON.parse(
                localStorage.getItem("wishlist")
            ) || [];


        const wishlistButtons =
            document.querySelectorAll(
                ".btn-wishlist"
            );


        wishlistButtons.forEach(button => {

            const card =
                button.closest(
                    ".product-card"
                );


            if (!card) {
                return;
            }


            const productId =
                Number(card.dataset.id);


            if (wishlist.includes(productId)) {

                button.classList.add("active");

            } else {

                button.classList.remove("active");
            }

        });
    }


    // ------------------------------------------
    // بدء تشغيل الكتالوج
    // ------------------------------------------

    loadProducts();

});