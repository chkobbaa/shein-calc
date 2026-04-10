document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURATION ===
    // Uses relative URLs — works on any host (localhost, Vercel, etc.)
    // If frontend and backend are on different domains, set the full backend URL here.
    const API_BASE_URL = '';
    // =====================

    const dictionary = {
        fr: {
            title: "Calculateur de Panier",
            login_btn: "Connexion",
            logout_btn: "Déconnexion",
            link_label: "Lien du panier Shein",
            link_placeholder: "Collez le lien partagé ici...",
            currency_label: "Devise du total",
            admin_settings: "Paramètres Administrateur",
            calc_mode: "Mode de calcul",
            after_sale: "Prix après soldes",
            before_sale: "Prix originaux",
            discount: "Remise (Appliquée sur le total)",
            shipping: "Frais de livraison (Devise cible)",
            margins: "Config. Marges",
            margin_low: "Marge (Total <= 18 SAR)",
            margin_high: "Marge (Total > 18 SAR)",
            calc_btn: "Calculer le Total",
            clear_btn: "Effacer",
            breakdown: "Détail du produit",
            summary: "Résumé avec Marges",
            total_pay: "Total Client",
            modal_title: "Connexion Administrateur",
            user_name: "Nom d'utilisateur",
            password: "Mot de passe",
            cancel: "Annuler",
            submit_login: "Valider",
            err_login: "Identifiants invalides.",
            err_link: "Veuillez entrer un lien Shein valide.",
            items_subtotal: "Sous-total Brut",
            items_post_margin: "Total incluant Marge",
            show_original_prices: "Prix Shein",
            show_converted_prices: "Prix convertis",
            discount_applied: "Remise Coupon",
            shipping_tax: "Frais de Livraison",
            instagram_label: "Votre @ Instagram (optionnel)",
            instagram_placeholder: "@votre_nom",
            order_btn: "Commander maintenant",
            order_confirm_title: "Commande prête !",
            order_confirm_text: "Votre récapitulatif a été copié. Envoyez-le nous par Instagram DM pour finaliser votre commande.",
            copy_btn: "Copier",
            close: "Fermer",
            remove: "Retirer",
            restore: "Remettre",
            removed_section: "Articles retirés",
            copied: "Copié !",
            empty_cart: "Votre panier est vide.",
            order_header: "🛒 NOUVELLE COMMANDE",
            save_settings: "Enregistrer la config",
            save_success: "Paramètres enregistrés !",
            order_item_line: "Article",
            order_qty: "Qté",
            order_total: "TOTAL",
            items_count: "articles",
        },
        en: {
            title: "Cart Calculator",
            login_btn: "Login",
            logout_btn: "Logout",
            link_label: "Shein Cart Link",
            link_placeholder: "Paste shared link here...",
            currency_label: "Total Currency",
            admin_settings: "Admin Settings",
            calc_mode: "Calculation Mode",
            after_sale: "After Sale Prices",
            before_sale: "Original Prices",
            discount: "Global Discount (%)",
            shipping: "Shipping Fee (Target Currency)",
            margins: "Margin Multipliers",
            margin_low: "Margin (Total <= 18 SAR)",
            margin_high: "Margin (Total > 18 SAR)",
            calc_btn: "Calculate Total",
            clear_btn: "Clear",
            breakdown: "Product Breakdown",
            summary: "Calculated Summary",
            total_pay: "Final Payable Total",
            modal_title: "Admin Login",
            user_name: "Username",
            password: "Password",
            cancel: "Cancel",
            submit_login: "Sign In",
            err_login: "Invalid credentials.",
            err_link: "Enter a valid shared link.",
            items_subtotal: "Raw Subtotal",
            items_post_margin: "Total after Margin",
            show_original_prices: "Shein Prices",
            show_converted_prices: "Converted Prices",
            discount_applied: "Coupon Discount",
            shipping_tax: "Shipping & Tax",
            instagram_label: "Your @ Instagram (optional)",
            instagram_placeholder: "@your_username",
            order_btn: "Order now",
            order_confirm_title: "Order ready!",
            order_confirm_text: "Your order summary has been copied. Send it to us via Instagram DM to finalize your order.",
            copy_btn: "Copy",
            close: "Close",
            remove: "Remove",
            restore: "Restore",
            removed_section: "Removed items",
            copied: "Copied!",
            empty_cart: "Your cart is empty.",
            order_header: "🛒 NEW ORDER",
            save_settings: "Save config",
            save_success: "Settings saved globally!",
            order_item_line: "Item",
            order_qty: "Qty",
            order_total: "TOTAL",
            items_count: "items",
        }
    };

    let lang = 'fr';
    let isAdmin = false;
    let isDark = false;
    // Cart state — array of { ...itemData, qty: number }
    let cartItems = [];
    // Items that have been removed (can be restored)
    let removedItems = [];
    // The original currency from the Shein API (always SAR for now)
    let sourceCurrency = 'SAR';
    // Whether items are displayed in source currency or target currency
    let showItemsInOriginal = true;

    // Elements
    const langInd = document.getElementById('lang-ind');
    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const adminPanel = document.getElementById('admin-panel');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModBtn = document.getElementById('close-modal-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // DOM Updates
    const updateLanguage = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary[lang][key]) el.textContent = dictionary[lang][key];
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (dictionary[lang][key]) el.placeholder = dictionary[lang][key];
        });
        langInd.textContent = lang.toUpperCase();
        // Dynamic overrides
        if (isAdmin) {
            authText.textContent = dictionary[lang].logout_btn;
        } else {
            authText.textContent = dictionary[lang].login_btn;
        }
    };

    const showToast = (msg, type = 'error') => {
        let toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // Events
    document.getElementById('lang-toggle').addEventListener('click', () => {
        lang = lang === 'fr' ? 'en' : 'fr';
        updateLanguage();
        if (cartItems.length > 0) renderCart();
    });

    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            themeIcon.name = 'sunny-outline';
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            themeIcon.name = 'moon-outline';
        }
    });

    authBtn.addEventListener('click', () => {
        if (isAdmin) {
            isAdmin = false;
            adminPanel.classList.add('hidden');
            authBtn.classList.remove('active-admin');
            showToast("Déconnecté / Logged out", "success");
            updateLanguage();
        } else {
            loginModal.classList.remove('hidden');
        }
    });

    closeModBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        try {
            const btn = e.target.querySelector('button[type="submit"]');
            const origText = btn.textContent;
            btn.textContent = "...";
            btn.disabled = true;

            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await res.json();

            btn.textContent = origText;
            btn.disabled = false;

            if (data.success) {
                isAdmin = true;
                adminPanel.classList.remove('hidden');
                authBtn.classList.add('active-admin');
                loginModal.classList.add('hidden');
                loginForm.reset();
                updateLanguage();
                showToast("Connecté en tant qu'admin / Logged in as admin", "success");
            } else {
                showToast(dictionary[lang].err_login);
            }
        } catch (err) {
            showToast("Server error. Could not connect to API.");
        }
    });

    // Rates & Formatting
    const exchangeRates = {
        'SAR': 1, // base
        'TND': 0.83,
        'USD': 0.266,
        'EUR': 0.245,
        'GBP': 0.211,
        'AED': 0.978,
        'DZD': 35.8,
        'MAD': 2.65
    };

    const currencySymbols = {
        'SAR': 'SAR', 'TND': 'DT', 'USD': '$', 'EUR': '€', 'GBP': '£',
        'AED': 'AED', 'DZD': 'DA', 'MAD': 'MAD'
    };

    const formatMoney = (amount, currency) => {
        return `${amount.toFixed(2)} ${currencySymbols[currency]}`;
    };

    // ============================================================
    // CART RENDERING & INTERACTION
    // ============================================================

    const resSec = document.getElementById('result-section');

    const removeItem = (index) => {
        const card = document.querySelector(`.product-card[data-index="${index}"]`);
        const removed = cartItems.splice(index, 1)[0];
        if (removed) removedItems.push(removed);
        if (card) {
            card.classList.add('removing');
            setTimeout(() => renderCart(), 300);
        } else {
            renderCart();
        }
    };

    const restoreItem = (index) => {
        const restored = removedItems.splice(index, 1)[0];
        if (restored) cartItems.push(restored);
        renderCart();
    };

    const updateQty = (index, delta) => {
        const newQty = cartItems[index].qty + delta;
        if (newQty < 1) return;
        cartItems[index].qty = newQty;
        renderCart();
    };

    const renderCart = () => {
        const listEl = document.getElementById('items-list');
        const targetCur = document.getElementById('currency').value;
        const mode = document.getElementById('price-mode').value;
        // Which currency to show item prices in
        const itemCur = showItemsInOriginal ? sourceCurrency : targetCur;

        if (cartItems.length === 0 && removedItems.length === 0) {
            resSec.classList.add('hidden');
            return;
        }

        // Render the currency toggle pill in the section header
        const headerEl = document.querySelector('.section-title[data-i18n="breakdown"]');
        if (headerEl) {
            const toggleId = 'item-currency-toggle';
            let toggleEl = document.getElementById(toggleId);
            if (!toggleEl) {
                toggleEl = document.createElement('div');
                toggleEl.id = toggleId;
                toggleEl.className = 'currency-toggle';
                headerEl.parentNode.insertBefore(toggleEl, headerEl.nextSibling);
            }
            const srcLabel = currencySymbols[sourceCurrency];
            const tgtLabel = currencySymbols[targetCur];
            toggleEl.innerHTML = `
                <span class="items-count">${cartItems.reduce((s, it) => s + it.qty, 0)} ${dictionary[lang].items_count}</span>
                <div class="toggle-pills">
                    <button type="button" class="pill ${showItemsInOriginal ? 'active' : ''}" data-orig="true">${srcLabel}</button>
                    <button type="button" class="pill ${!showItemsInOriginal ? 'active' : ''}" data-orig="false">${tgtLabel}</button>
                </div>
            `;
            toggleEl.querySelectorAll('.pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    showItemsInOriginal = pill.dataset.orig === 'true';
                    renderCart();
                });
            });
        }

        listEl.innerHTML = '';
        let totalBaseSAR = 0;

        cartItems.forEach((it, i) => {
            const priceSAR = mode === 'sale' ? it.salePrice : it.origPrice;
            const lineTotal = priceSAR * it.qty;
            totalBaseSAR += lineTotal;

            // Display price in the chosen item currency
            const dispPrice = priceSAR * exchangeRates[itemCur];
            const dispOrig = it.origPrice * exchangeRates[itemCur];

            listEl.innerHTML += `
                <div class="product-card" data-index="${i}">
                    <div class="product-image">
                        <img src="${it.image}" alt="${it.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-header">
                            <div class="product-name">${it.name}</div>
                            <a href="${it.link}" target="_blank" class="product-link">
                                <ion-icon name="open-outline"></ion-icon>
                            </a>
                        </div>
                        <div class="price-row">
                            <span class="current-price">${formatMoney(dispPrice, itemCur)}</span>
                            ${(mode === 'sale' && it.discount > 0) ? `<span class="orig-price">${formatMoney(dispOrig, itemCur)}</span> <span class="discount-tag">-${it.discount}%</span>` : ''}
                        </div>
                        <div class="product-controls">
                            <div class="qty-control">
                                <button type="button" class="qty-btn" data-action="minus" data-index="${i}">−</button>
                                <span class="qty-value">${it.qty}</span>
                                <button type="button" class="qty-btn" data-action="plus" data-index="${i}">+</button>
                            </div>
                            <button type="button" class="remove-btn" data-index="${i}">
                                <ion-icon name="trash-outline"></ion-icon>
                                <span>${dictionary[lang].remove}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Attach event listeners
        listEl.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const delta = btn.dataset.action === 'plus' ? 1 : -1;
                updateQty(idx, delta);
            });
        });
        listEl.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeItem(parseInt(btn.dataset.index));
            });
        });

        // Render removed items section
        renderRemovedItems(listEl, itemCur, mode);

        // Recalculate summary — always in target currency
        renderSummary(totalBaseSAR, targetCur);
    };

    const renderRemovedItems = (listEl, itemCur, mode) => {
        // Remove existing removed section if present
        const existingSection = document.getElementById('removed-items-section');
        if (existingSection) existingSection.remove();

        if (removedItems.length === 0) return;

        const section = document.createElement('div');
        section.id = 'removed-items-section';
        section.className = 'removed-items-section';
        section.innerHTML = `<div class="removed-header"><ion-icon name="trash-outline"></ion-icon> ${dictionary[lang].removed_section} (${removedItems.length})</div>`;

        removedItems.forEach((it, i) => {
            const priceSAR = mode === 'sale' ? it.salePrice : it.origPrice;
            const dispPrice = priceSAR * exchangeRates[itemCur];

            section.innerHTML += `
                <div class="product-card removed-card">
                    <div class="product-image">
                        <img src="${it.image}" alt="${it.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-header">
                            <div class="product-name">${it.name}</div>
                        </div>
                        <div class="price-row">
                            <span class="current-price">${formatMoney(dispPrice, itemCur)}</span>
                        </div>
                        <div class="product-controls">
                            <button type="button" class="restore-btn" data-rindex="${i}">
                                <ion-icon name="arrow-undo-outline"></ion-icon>
                                <span>${dictionary[lang].restore}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        listEl.appendChild(section);

        section.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                restoreItem(parseInt(btn.dataset.rindex));
            });
        });
    };

    const renderSummary = (totalBaseSAR, targetCur) => {
        const marginLow = parseFloat(document.getElementById('margin-low').value) || 2.1;
        const marginHigh = parseFloat(document.getElementById('margin-high').value) || 1.7;
        const couponDisc = parseFloat(document.getElementById('discount-code').value) || 0;
        const shipFee = parseFloat(document.getElementById('shipping-fee').value) || 0;

        const multiplier = totalBaseSAR > 18 ? marginHigh : marginLow;
        const postMarginTotalSAR = totalBaseSAR * multiplier;
        const finalSARBeforeShip = postMarginTotalSAR * (1 - (couponDisc / 100));
        const finalTarget = finalSARBeforeShip * exchangeRates[targetCur];
        const finalWithShip = finalTarget + shipFee;

        const sumEl = document.getElementById('summary-details');
        sumEl.innerHTML = `
            <div class="summary-row">
                <span>${dictionary[lang].items_subtotal}</span>
                <span>${formatMoney(totalBaseSAR * exchangeRates[targetCur], targetCur)}</span>
            </div>
            <div class="summary-row total-margin">
                <span>${dictionary[lang].items_post_margin} (x${multiplier})</span>
                <span>${formatMoney(postMarginTotalSAR * exchangeRates[targetCur], targetCur)}</span>
            </div>
        `;

        if (couponDisc > 0) {
            sumEl.innerHTML += `
                <div class="summary-row" style="color: var(--danger)">
                    <span>${dictionary[lang].discount_applied} (${couponDisc}%)</span>
                    <span>-${formatMoney((postMarginTotalSAR * (couponDisc / 100)) * exchangeRates[targetCur], targetCur)}</span>
                </div>
            `;
        }

        if (shipFee > 0) {
            sumEl.innerHTML += `
                <div class="summary-row bold">
                    <span>${dictionary[lang].shipping_tax}</span>
                    <span>+${formatMoney(shipFee, targetCur)}</span>
                </div>
            `;
        }

        document.getElementById('grand-total-val').textContent = formatMoney(finalWithShip, targetCur);
    };

    // Re-render on currency change
    document.getElementById('currency').addEventListener('change', () => {
        if (cartItems.length > 0) renderCart();
    });

    // ============================================================
    // CALCULATE FORM — fetch and populate cart
    // ============================================================

    const calcForm = document.getElementById('calculator-form');
    const calcBtn = document.getElementById('calc-btn');

    calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('cart-url').value;
        if (!url.toLowerCase().includes('shein')) {
            showToast(dictionary[lang].err_link);
            return;
        }

        calcBtn.classList.add('loading');

        try {
            const res = await fetch(`${API_BASE_URL}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();

            if (!res.ok || !data.items || data.items.length === 0) {
                const errMsg = data.error || (lang === 'fr' ? "Erreur: Aucun article trouvé." : "Error: No valid items found.");
                showToast(errMsg);
                calcBtn.classList.remove('loading');
                resSec.classList.add('hidden');
                return;
            }

            // Populate cart state, each item starts with qty=1
            cartItems = data.items.map(it => ({ ...it, qty: 1 }));

            resSec.classList.remove('hidden');
            renderCart();
            calcBtn.classList.remove('loading');
            resSec.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            showToast("API Server Error: Could not fetch data.");
            calcBtn.classList.remove('loading');
        }
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        calcForm.reset();
        cartItems = [];
        removedItems = [];
        resSec.classList.add('hidden');
        window.scrollTo(0, 0);
    });

    // ============================================================
    // ORDER — "Commander maintenant"
    // ============================================================

    const orderBtn = document.getElementById('order-btn');
    const orderModal = document.getElementById('order-modal');
    const orderPreview = document.getElementById('order-preview');
    const closeOrderModal = document.getElementById('close-order-modal');
    const copyOrderBtn = document.getElementById('copy-order-btn');

    const buildOrderText = () => {
        const targetCur = document.getElementById('currency').value;
        const mode = document.getElementById('price-mode').value;
        const igHandle = document.getElementById('instagram-handle').value.trim();
        const cartUrl = document.getElementById('cart-url').value.trim();
        const grandTotal = document.getElementById('grand-total-val').textContent;

        let text = `${dictionary[lang].order_header}\n`;
        text += `${'─'.repeat(30)}\n`;
        if (igHandle) text += `📸 Instagram: ${igHandle}\n`;
        text += `🔗 ${cartUrl}\n`;
        text += `${'─'.repeat(30)}\n\n`;

        cartItems.forEach((it, i) => {
            const price = mode === 'sale' ? it.salePrice : it.origPrice;
            // Show item price in original SAR + converted target price
            const dispTarget = price * exchangeRates[targetCur];
            const lineTotalTarget = dispTarget * it.qty;
            text += `${i + 1}. ${it.name.substring(0, 50)}${it.name.length > 50 ? '...' : ''}\n`;
            text += `   ${formatMoney(price, sourceCurrency)} → ${formatMoney(dispTarget, targetCur)}\n`;
            text += `   ${dictionary[lang].order_qty}: ${it.qty} × ${formatMoney(dispTarget, targetCur)} = ${formatMoney(lineTotalTarget, targetCur)}\n\n`;
        });

        text += `${'─'.repeat(30)}\n`;
        text += `💰 ${dictionary[lang].order_total}: ${grandTotal}\n`;

        return text;
    };

    orderBtn.addEventListener('click', () => {
        if (cartItems.length === 0) {
            showToast(dictionary[lang].empty_cart);
            return;
        }
        const text = buildOrderText();
        orderPreview.textContent = text;
        orderModal.classList.remove('hidden');
    });

    closeOrderModal.addEventListener('click', () => {
        orderModal.classList.add('hidden');
    });

    copyOrderBtn.addEventListener('click', async () => {
        const text = orderPreview.textContent;
        try {
            await navigator.clipboard.writeText(text);
            showToast(dictionary[lang].copied, 'success');
        } catch (err) {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast(dictionary[lang].copied, 'success');
        }
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    // ============================================================
    // ADMIN SETTINGS — Server persistence
    // ============================================================

    const adminFields = ['price-mode', 'discount-code', 'shipping-fee', 'margin-low', 'margin-high'];

    const saveSettings = async () => {
        const settings = {};
        adminFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) settings[id] = el.value;
        });

        const btn = document.getElementById('save-settings-btn');
        if (btn) btn.classList.add('loading');

        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            showToast(dictionary[lang].save_success, 'success');
        } catch (e) {
            showToast("Error saving settings to server.");
        } finally {
            if (btn) btn.classList.remove('loading');
        }
    };

    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/settings`);
            if (!res.ok) return;
            const settings = await res.json();

            adminFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && settings[id] !== undefined) {
                    el.value = settings[id];
                }
            });

            // If cart is already loaded, recalculate with new settings
            if (cartItems.length > 0) renderCart();
        } catch (e) { /* fallback to defaults if server fetch fails */ }
    };

    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }

    // INIT
    loadSettings();
    updateLanguage();
});
