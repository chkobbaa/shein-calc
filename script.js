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
            remember_me: "Se souvenir de moi",
            choose_method: "Choisissez une méthode",
            method_total: "Convertir Total",
            method_total_desc: "Conversion instantanée d'un montant global SAR avec application de votre marge.",
            method_url: "Lien du panier Shein",
            method_url_desc: "Extraction et calcul détaillé par article depuis un lien partagé.",
            method_images: "Calculer avec Images",
            method_images_desc: "Scannez des captures d'écran de panier pour calculer automatiquement.",
            method_admin: "Administration",
            method_admin_desc: "Gérer les marges, remises et paramètres de chaque mode de calcul.",
            admin_mode_all: "Tous",
            admin_mode_manual: "Manuel",
            admin_mode_url: "Lien",
            admin_mode_images: "Image",
            coming_soon: "Bientôt !",
            back: "Retour",
            manual_sar_label: "Montant global du panier (SAR)",
            admin_saved_all: "Config appliquée à tous les modes !",
            admin_saved_mode: "Config enregistrée pour ce mode !"
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
            save_success: "Settings saved!",
            order_item_line: "Item",
            order_qty: "Qty",
            order_total: "TOTAL",
            items_count: "items",
            remember_me: "Remember me",
            choose_method: "Choose a method",
            method_total: "Convert Total",
            method_total_desc: "Instant conversion of a SAR cart total with your margin applied.",
            method_url: "Shein Cart Link",
            method_url_desc: "Extract and calculate line-by-line item details from a shared link.",
            method_images: "Calculate with Images",
            method_images_desc: "Scan screenshots of the cart to automatically calculate.",
            method_admin: "Administration",
            method_admin_desc: "Manage margins, discounts, and settings for each calculation mode.",
            admin_mode_all: "All",
            admin_mode_manual: "Manual",
            admin_mode_url: "Link",
            admin_mode_images: "Image",
            coming_soon: "Coming soon!",
            back: "Back",
            manual_sar_label: "Global Cart Amount (SAR)",
            admin_saved_all: "Config applied to all modes!",
            admin_saved_mode: "Config saved for this mode!"
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
    let showItemsInOriginal = false;

    // Per-mode settings store
    // { manual: { ... }, url: { ... }, images: { ... } }
    let modeSettings = {
        manual: { 'price-mode': 'sale', 'discount-code': '0', 'shipping-fee': '0', 'margin-threshold': '18', 'margin-low': '2.1', 'margin-high': '1.7' },
        url: { 'price-mode': 'sale', 'discount-code': '0', 'shipping-fee': '0', 'margin-threshold': '18', 'margin-low': '2.1', 'margin-high': '1.7' },
        images: { 'price-mode': 'sale', 'discount-code': '0', 'shipping-fee': '0', 'margin-threshold': '18', 'margin-low': '2.1', 'margin-high': '1.7' }
    };

    // Which calculation mode was used for the current cart (url or images)
    let activeCalcMode = 'url';

    // Helper to read settings for a given mode
    const getSettings = (mode) => modeSettings[mode] || modeSettings.url;

    // DOM Elements
    const form = document.getElementById('calculator-form');
    const resultSection = document.getElementById('result-section');
    const itemsList = document.getElementById('items-list');

    // VIEWS LOGIC
    const landingView = document.getElementById('landing-view');
    const urlView = document.getElementById('url-view');
    const manualView = document.getElementById('manual-view');
    const imagesView = document.getElementById('images-view');
    const adminView = document.getElementById('admin-view');
    const adminMethodCard = document.getElementById('btn-method-admin');

    let adminInterval;
    let trafficChart;

    const renderChart = (data) => {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;
        if (trafficChart) {
            trafficChart.data.labels = data.labels;
            trafficChart.data.datasets[0].data = data.uniques;
            trafficChart.data.datasets[1].data = data.visits;
            trafficChart.update();
            return;
        }

        trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Visiteurs Uniques',
                        data: data.uniques,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Vues Totales',
                        data: data.visits,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    };

    const fetchAdminStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/stats`);
            const data = await res.json();
            const totEl = document.getElementById('stat-total-visitors');
            const uniqEl = document.getElementById('stat-unique-visitors');
            if (totEl) totEl.textContent = data.totalVisits || 0;
            if (uniqEl) uniqEl.textContent = data.totalUniques || 0;

            if (data.labels) renderChart(data);
        } catch (e) { }
    };

    document.getElementById('btn-method-total').addEventListener('click', () => {
        landingView.classList.add('hidden');
        manualView.classList.remove('hidden');
        if (document.getElementById('manual-items-list').children.length === 0) {
            manualItemCount = 0;
            addManualItemRow();
        }
    });

    document.getElementById('btn-method-url').addEventListener('click', () => {
        landingView.classList.add('hidden');
        urlView.classList.remove('hidden');
    });

    document.getElementById('btn-method-images').addEventListener('click', () => {
        landingView.classList.add('hidden');
        imagesView.classList.remove('hidden');
    });

    document.getElementById('btn-method-admin').addEventListener('click', () => {
        landingView.classList.add('hidden');
        adminView.classList.remove('hidden');
        loadAdminFields('all'); // default to "Tous"
        fetchAdminStats();
        adminInterval = setInterval(fetchAdminStats, 3000);
    });

    document.querySelectorAll('.back-to-landing').forEach(btn => {
        btn.addEventListener('click', () => {
            landingView.classList.remove('hidden');
            urlView.classList.add('hidden');
            manualView.classList.add('hidden');
            imagesView.classList.add('hidden');
            adminView.classList.add('hidden');
            resSec.classList.add('hidden'); // also hide results if open
            if (adminInterval) clearInterval(adminInterval);
        });
    });

    // Language processing
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

    const langInd = document.getElementById('lang-ind');
    const authBtn = document.getElementById('auth-btn');
    const authText = document.getElementById('auth-text');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModBtn = document.getElementById('close-modal-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const showToast = (msg, type = 'error') => {
        let toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // Toggle admin UI elements
    const updateAdminUI = () => {
        if (isAdmin) {
            adminMethodCard.classList.remove('hidden');
            authBtn.classList.add('active-admin');
        } else {
            adminMethodCard.classList.add('hidden');
            authBtn.classList.remove('active-admin');
            // If currently in admin view, kick back to landing
            if (!adminView.classList.contains('hidden')) {
                adminView.classList.add('hidden');
                landingView.classList.remove('hidden');
            }
        }
        updateLanguage();
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

    // ============================================================
    // AUTH — Login / Logout / Remember Me
    // ============================================================

    authBtn.addEventListener('click', () => {
        if (isAdmin) {
            isAdmin = false;
            localStorage.removeItem('sheinCalc_adminAuth');
            showToast("Déconnecté / Logged out", "success");
            updateAdminUI();
        } else {
            loginModal.classList.remove('hidden');
        }
    });

    closeModBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

    // Login handler
    const doLogin = async (user, pass, opts = {}) => {
        const { showUI = true, remember = false } = opts;
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await res.json();

            if (data.success) {
                isAdmin = true;
                if (remember) {
                    // Store encoded credentials for auto-login on reload
                    localStorage.setItem('sheinCalc_adminAuth', btoa(JSON.stringify({ u: user, p: pass })));
                }
                updateAdminUI();
                if (showUI) {
                    loginModal.classList.add('hidden');
                    loginForm.reset();
                    showToast("Connecté en tant qu'admin / Logged in as admin", "success");
                }
                return true;
            } else {
                if (showUI) showToast(dictionary[lang].err_login);
                return false;
            }
        } catch (err) {
            if (showUI) showToast("Server error. Could not connect to API.");
            return false;
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const remember = document.getElementById('remember-me').checked;

        const btn = e.target.querySelector('button[type="submit"]');
        const origText = btn.textContent;
        btn.textContent = "...";
        btn.disabled = true;

        await doLogin(user, pass, { showUI: true, remember });

        btn.textContent = origText;
        btn.disabled = false;
    });

    // Auto-login from remembered credentials
    const tryAutoLogin = async () => {
        const stored = localStorage.getItem('sheinCalc_adminAuth');
        if (!stored) return;
        try {
            const creds = JSON.parse(atob(stored));
            if (creds.u && creds.p) {
                const ok = await doLogin(creds.u, creds.p, { showUI: false, remember: true });
                if (!ok) {
                    // Stored creds are invalid, clear them
                    localStorage.removeItem('sheinCalc_adminAuth');
                }
            }
        } catch (e) {
            localStorage.removeItem('sheinCalc_adminAuth');
        }
    };

    // Rates & Formatting
    const exchangeRates = {
        'SAR': 1, // base
        'TND': 1, // 1:1 direct replacement as requested
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
        const s = getSettings(activeCalcMode);
        const mode = s['price-mode'] || 'sale';
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
                <div class="toggle-pills" style="${isAdmin ? '' : 'display: none;'}">
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
        let postMarginTotalSAR = 0;

        const marginLow = parseFloat(s['margin-low']) || 2.1;
        const marginHigh = parseFloat(s['margin-high']) || 1.7;
        const marginThresh = parseFloat(s['margin-threshold']) || 18;

        cartItems.forEach((it, i) => {
            const priceSAR = mode === 'sale' ? it.salePrice : it.origPrice;
            const multiplier = priceSAR > marginThresh ? marginHigh : marginLow;
            const markedPriceSAR = priceSAR * multiplier;

            postMarginTotalSAR += markedPriceSAR * it.qty;

            // Display price in the chosen item currency
            const dispPrice = markedPriceSAR * exchangeRates[itemCur];
            const origMultiplier = it.origPrice > marginThresh ? marginHigh : marginLow;
            const dispOrig = (it.origPrice * origMultiplier) * exchangeRates[itemCur];

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
                            <span class="current-price" style="display: flex; align-items: center; gap: 8px;">
                                ${formatMoney(priceSAR, 'SAR')} 
                                <ion-icon name="arrow-forward-outline" style="color: var(--text-muted); font-size: 1rem;"></ion-icon> 
                                ${formatMoney(dispPrice, itemCur)}
                            </span>
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
        renderSummary(postMarginTotalSAR, targetCur);
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

        const s = getSettings(activeCalcMode);
        const marginLow = parseFloat(s['margin-low']) || 2.1;
        const marginHigh = parseFloat(s['margin-high']) || 1.7;
        const marginThresh = parseFloat(s['margin-threshold']) || 18;

        removedItems.forEach((it, i) => {
            const priceSAR = mode === 'sale' ? it.salePrice : it.origPrice;
            const multiplier = priceSAR > marginThresh ? marginHigh : marginLow;
            const markedPriceSAR = priceSAR * multiplier;

            const dispPrice = markedPriceSAR * exchangeRates[itemCur];

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
                            <span class="current-price" style="display: flex; align-items: center; gap: 8px;">
                                ${formatMoney(priceSAR, 'SAR')} 
                                <ion-icon name="arrow-forward-outline" style="color: var(--text-muted); font-size: 1rem;"></ion-icon> 
                                ${formatMoney(dispPrice, itemCur)}
                            </span>
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

    const renderSummary = (postMarginTotalSAR, targetCur) => {
        const s = getSettings(activeCalcMode);
        const couponDisc = parseFloat(s['discount-code']) || 0;
        const shipFee = parseFloat(s['shipping-fee']) || 0;

        const finalSARBeforeShip = postMarginTotalSAR * (1 - (couponDisc / 100));
        const finalTarget = finalSARBeforeShip * exchangeRates[targetCur];
        const finalWithShip = finalTarget + shipFee;

        const sumEl = document.getElementById('summary-details');
        sumEl.innerHTML = `
            <div class="summary-row total-margin">
                <span>${dictionary[lang].items_post_margin || 'Sous-total inclus marge'}</span>
                <span>${formatMoney(postMarginTotalSAR * exchangeRates[targetCur], targetCur)}</span>
            </div>
        `;

        if (couponDisc > 0) {
            sumEl.innerHTML += `
                <div class="summary-row" style="color: var(--danger)">
                    <span>${dictionary[lang].discount_applied || 'Remise'} (${couponDisc}%)</span>
                    <span>-${formatMoney((postMarginTotalSAR * (couponDisc / 100)) * exchangeRates[targetCur], targetCur)}</span>
                </div>
            `;
        }

        if (shipFee > 0) {
            sumEl.innerHTML += `
                <div class="summary-row">
                    <span>${dictionary[lang].shipping_fee || 'Livraison'}</span>
                    <span>${formatMoney(shipFee * exchangeRates[targetCur], targetCur)}</span>
                </div>
            `;
        }

        document.getElementById('grand-total-val').textContent = formatMoney(finalWithShip, targetCur);
    };

    // ============================================================
    // MANUAL CONVERTER LOGIC (Multi-line)
    // ============================================================
    let manualItemCount = 0;

    const addManualItemRow = () => {
        manualItemCount++;
        const container = document.getElementById('manual-items-list');
        const rowId = `manual-row-${manualItemCount}`;

        const row = document.createElement('div');
        row.className = 'manual-item-row';
        row.id = rowId;

        row.innerHTML = `
            <div class="manual-row-header">
                <div class="manual-row-header-left">
                    <span class="manual-item-label">Produit ${manualItemCount}</span>
                </div>
                <button type="button" class="remove-btn manual-remove-btn" style="padding: 0;">
                    <ion-icon name="close-circle-outline" style="font-size:1.6rem;"></ion-icon>
                </button>
            </div>
            <div class="manual-row-body">
                <div class="manual-input-wrap">
                    <input type="number" step="0.01" min="0" class="manual-price-input" placeholder="Ex: 10">
                    <span>SAR</span>
                </div>
                <div class="qty-control" style="border-radius: 8px; flex-shrink: 0; min-width: 110px; justify-content: center;">
                    <button type="button" class="qty-btn manual-qty-minus">−</button>
                    <input type="number" class="qty-value manual-qty-val" value="1" min="1" readonly style="width: 40px; padding:0; text-align:center;">
                    <button type="button" class="qty-btn manual-qty-plus">+</button>
                </div>
            </div>
        `;

        const priceInput = row.querySelector('.manual-price-input');
        const qtyMinus = row.querySelector('.manual-qty-minus');
        const qtyPlus = row.querySelector('.manual-qty-plus');
        const qtyVal = row.querySelector('.manual-qty-val');
        const remBtn = row.querySelector('.manual-remove-btn');

        qtyMinus.addEventListener('click', () => {
            let q = parseInt(qtyVal.value);
            if (q > 1) qtyVal.value = q - 1;
        });

        qtyPlus.addEventListener('click', () => {
            qtyVal.value = parseInt(qtyVal.value) + 1;
        });

        remBtn.addEventListener('click', () => {
            row.remove();
        });

        container.appendChild(row);
    };

    const addBtn = document.getElementById('add-manual-item-btn');
    if (addBtn) addBtn.addEventListener('click', addManualItemRow);

    const manualCalcBtn = document.getElementById('manual-calc-btn');
    if (manualCalcBtn) {
        manualCalcBtn.addEventListener('click', () => {
            const rows = document.querySelectorAll('.manual-item-row');
            if (rows.length === 0) return showToast("Veuillez ajouter au moins un produit.", "error");

            let postMarginTotalSAR = 0;
            const s = getSettings('manual');
            const marginLow = parseFloat(s['margin-low']) || 2.1;
            const marginHigh = parseFloat(s['margin-high']) || 1.7;
            const marginThresh = parseFloat(s['margin-threshold']) || 18;
            const couponDisc = parseFloat(s['discount-code']) || 0;
            const shipFee = parseFloat(s['shipping-fee']) || 0;
            const targetCur = document.getElementById('manual-currency').value;

            rows.forEach(r => {
                const price = parseFloat(r.querySelector('.manual-price-input').value) || 0;
                const qty = parseInt(r.querySelector('.manual-qty-val').value) || 1;

                const multiplier = price > marginThresh ? marginHigh : marginLow;
                postMarginTotalSAR += (price * multiplier) * qty;
            });

            if (postMarginTotalSAR === 0) return showToast("Le total est de 0.", "error");

            const finalSARBeforeShip = postMarginTotalSAR * (1 - (couponDisc / 100));
            const finalTarget = finalSARBeforeShip * exchangeRates[targetCur];
            const finalWithShip = finalTarget + shipFee;

            const sumEl = document.getElementById('manual-summary-details');
            sumEl.innerHTML = `
                <div class="summary-row total-margin">
                    <span>${dictionary[lang].items_post_margin || 'Sous-total inclus marge'}</span>
                    <span>${formatMoney(postMarginTotalSAR * exchangeRates[targetCur], targetCur)}</span>
                </div>
            `;

            if (couponDisc > 0) {
                sumEl.innerHTML += `
                    <div class="summary-row" style="color: var(--danger)">
                        <span>${dictionary[lang].discount_applied || 'Remise'} (${couponDisc}%)</span>
                        <span>-${formatMoney((postMarginTotalSAR * (couponDisc / 100)) * exchangeRates[targetCur], targetCur)}</span>
                    </div>
                `;
            }
            if (shipFee > 0) {
                sumEl.innerHTML += `
                    <div class="summary-row">
                        <span>${dictionary[lang].shipping_fee || 'Livraison'}</span>
                        <span>${formatMoney(shipFee * exchangeRates[targetCur], targetCur)}</span>
                    </div>
                `;
            }

            document.getElementById('manual-grand-total-val').textContent = formatMoney(finalWithShip, targetCur);
            document.getElementById('manual-result-section').classList.remove('hidden');
        });
    }

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

        activeCalcMode = 'url';
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
    // IMAGES CALCULATOR FORM
    // ============================================================
    const imagesForm = document.getElementById('images-form');
    const imagesCalcBtn = document.getElementById('images-calc-btn');
    const cartImagesInput = document.getElementById('cart-images');
    const previewContainer = document.getElementById('image-preview-container');
    let selectedFilesBase64 = [];

    cartImagesInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);

        for (const file of files) {
            if (selectedFilesBase64.length >= 10) break; // max 10

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (selectedFilesBase64.length >= 10) return;

                selectedFilesBase64.push(reader.result);
                const img = document.createElement('img');
                img.src = reader.result;
                img.className = 'image-preview';
                previewContainer.appendChild(img);
            };
        }

        setTimeout(() => {
            if (files.length > 0) showToast(`${files.length} image(s) ajoutée(s).`, "success");
        }, 100);

        // Clear input
        cartImagesInput.value = '';
    });

    imagesForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (selectedFilesBase64.length === 0) {
            showToast("Veuillez sélectionner au moins une image.");
            return;
        }

        activeCalcMode = 'images';
        imagesCalcBtn.classList.add('loading');

        try {
            const res = await fetch(`${API_BASE_URL}/api/extract-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: selectedFilesBase64 })
            });

            const data = await res.json();

            if (!res.ok || !data.items || data.items.length === 0) {
                const errMsg = data.error || "Erreur de traitement des images.";
                showToast(errMsg);
                imagesCalcBtn.classList.remove('loading');
                resSec.classList.add('hidden');
                return;
            }

            // Sync original total currency with images total currency 
            document.getElementById('currency').value = document.getElementById('images-currency').value;

            cartItems = data.items.map(it => {
                const imgIdx = (it.imageIndex && it.imageIndex > 0) ? (it.imageIndex - 1) : 0;
                return { ...it, qty: 1, image: selectedFilesBase64[imgIdx] || selectedFilesBase64[0] };
            });

            resSec.classList.remove('hidden');
            renderCart();
            imagesCalcBtn.classList.remove('loading');
            resSec.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            showToast("API Server Error: Could not fetch data.");
            imagesCalcBtn.classList.remove('loading');
        }
    });

    document.getElementById('images-clear-btn').addEventListener('click', () => {
        imagesForm.reset();
        previewContainer.innerHTML = '';
        selectedFilesBase64 = [];
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
        const s = getSettings(activeCalcMode);
        const mode = s['price-mode'] || 'sale';
        const igHandle = document.getElementById('instagram-handle').value.trim();
        const cartUrl = document.getElementById('cart-url').value.trim();
        const grandTotal = document.getElementById('grand-total-val').textContent;

        let text = `${dictionary[lang].order_header}\n`;
        text += `${'─'.repeat(30)}\n`;
        if (igHandle) text += `📸 Instagram: ${igHandle}\n`;
        text += `🔗 ${cartUrl}\n`;
        text += `${'─'.repeat(30)}\n\n`;

        const marginLow = parseFloat(s['margin-low']) || 2.1;
        const marginHigh = parseFloat(s['margin-high']) || 1.7;
        const marginThresh = parseFloat(s['margin-threshold']) || 18;

        cartItems.forEach((it, i) => {
            const price = mode === 'sale' ? it.salePrice : it.origPrice;
            const multiplier = price > marginThresh ? marginHigh : marginLow;
            const markedPrice = price * multiplier;

            const dispTarget = markedPrice * exchangeRates[targetCur];
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
    // ADMIN SETTINGS — Server persistence (per-mode)
    // ============================================================

    const adminFields = ['price-mode', 'discount-code', 'shipping-fee', 'margin-threshold', 'margin-low', 'margin-high'];
    let currentAdminMode = 'all'; // Which mode pill is active in admin view

    const updateAdminMarginLabels = () => {
        const thresh = document.getElementById('admin-margin-threshold').value || 18;
        const lowLabel = document.getElementById('admin-margin-low-label');
        const highLabel = document.getElementById('admin-margin-high-label');
        if (lowLabel) lowLabel.textContent = `Marge (Achat <= ${thresh} SAR)`;
        if (highLabel) highLabel.textContent = `Marge (Achat > ${thresh} SAR)`;
    };

    // Load fields from modeSettings into admin form for a given mode
    const loadAdminFields = (mode) => {
        currentAdminMode = mode;
        // Update pill active state
        document.querySelectorAll('.admin-mode-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.mode === mode);
            // Special red style for "Tous"
            if (p.dataset.mode === 'all') {
                p.classList.toggle('all-mode', true);
            }
        });

        // Determine which settings to display
        // If "all", show url settings as representative (they should all be the same if synced)
        const srcMode = mode === 'all' ? 'url' : mode;
        const s = modeSettings[srcMode] || {};

        adminFields.forEach(id => {
            const el = document.getElementById(`admin-${id}`);
            if (el && s[id] !== undefined) {
                el.value = s[id];
            }
        });
        updateAdminMarginLabels();
    };

    // Mode pill click handlers
    document.querySelectorAll('.admin-mode-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            loadAdminFields(pill.dataset.mode);
        });
    });

    const saveSettings = async () => {
        const settings = {};
        adminFields.forEach(id => {
            const el = document.getElementById(`admin-${id}`);
            if (el) settings[id] = el.value;
        });

        const btn = document.getElementById('save-settings-btn');
        if (btn) btn.classList.add('loading');

        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: currentAdminMode, settings })
            });

            // Update local modeSettings
            if (currentAdminMode === 'all') {
                ['manual', 'url', 'images'].forEach(m => {
                    modeSettings[m] = { ...modeSettings[m], ...settings };
                });
                showToast(dictionary[lang].admin_saved_all, 'success');
            } else {
                modeSettings[currentAdminMode] = { ...modeSettings[currentAdminMode], ...settings };
                showToast(dictionary[lang].admin_saved_mode, 'success');
            }

            // Re-render cart if active
            if (cartItems.length > 0) renderCart();
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
            const data = await res.json();

            // data should be { manual: {...}, url: {...}, images: {...} }
            if (data.manual) modeSettings.manual = { ...modeSettings.manual, ...data.manual };
            if (data.url) modeSettings.url = { ...modeSettings.url, ...data.url };
            if (data.images) modeSettings.images = { ...modeSettings.images, ...data.images };

            // If cart is already loaded, recalculate with new settings
            if (cartItems.length > 0) renderCart();
        } catch (e) { /* fallback to defaults if server fetch fails */ }
    };

    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }

    const threshInput = document.getElementById('admin-margin-threshold');
    if (threshInput) threshInput.addEventListener('input', updateAdminMarginLabels);

    const logVisit = async () => {
        const hasVisited = localStorage.getItem('sheinCalc_hasVisited');
        const isNewSession = !sessionStorage.getItem('sheinCalc_visited');

        if (isNewSession) {
            try {
                const type = hasVisited ? 'return' : 'new';
                await fetch(`${API_BASE_URL}/api/stats?type=${type}`, { method: 'POST' });
                sessionStorage.setItem('sheinCalc_visited', 'true');
                localStorage.setItem('sheinCalc_hasVisited', 'true');
            } catch (e) { }
        }
    };

    const startHeartbeat = () => {
        if (!localStorage.getItem('sheinCalc_uuid')) {
            localStorage.setItem('sheinCalc_uuid', crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
        }

        const pingLive = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/live?uuid=${localStorage.getItem('sheinCalc_uuid')}`, { method: 'POST' });
                const data = await res.json();
                const liveEl = document.getElementById('stat-live-visitors');
                if (liveEl) liveEl.textContent = data.live || 0;
            } catch (e) { }
        };

        pingLive();
        setInterval(pingLive, 5000);

        window.addEventListener('beforeunload', () => {
            const uuid = localStorage.getItem('sheinCalc_uuid');
            if (uuid) {
                navigator.sendBeacon(`${API_BASE_URL}/api/live?uuid=${uuid}&action=leave`);
            }
        });
    };

    // ============================================================
    // INIT
    // ============================================================
    const init = async () => {
        await logVisit();
        startHeartbeat();
        await loadSettings();
        await tryAutoLogin();
        updateAdminUI();
        updateLanguage();
    };

    init();
});
