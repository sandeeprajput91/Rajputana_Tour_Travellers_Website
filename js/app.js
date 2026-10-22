/**
 * Rajputana Tour & Travellers - Main Application Architecture
 * Enterprise State Management, Multilingual Engine, Dynamic Booking Wizard,
 * Leaflet GPS Tracker, and SQLite RESTful Backend Integration.
 * No hardcoded prices on cards; dynamic quotation & direct SQLite database persistence.
 */

(function () {
  const STORAGE_KEY_LANG = "rtt_lang_preference";
  const STORAGE_KEY_USER = "rtt_logged_user";

  // Application State
  const AppState = {
    language: localStorage.getItem(STORAGE_KEY_LANG) || "en",
    bookings: [],
    fleet: [],
    tours: [],
    currentUserPhone: localStorage.getItem(STORAGE_KEY_USER) || null,
    currentStep: 1,
    bookingDraft: {
      tripType: "outstation",
      pickup: "",
      drop: "",
      date: "",
      time: "",
      passengers: 4,
      vehicleId: "innova-crysta",
      customerName: "",
      phone: "",
      email: "",
      otpVerified: false,
      payMode: "cash", // 'advance_20' | 'full' | 'cash'
      notes: ""
    },
    generatedOtp: null,
    trackingMap: null,
    trackingMarker: null,
    trackingInterval: null
  };

  // Initialize Application
  async function initApp() {
    setupLanguage();
    setupNavigation();
    setupHeroCalculator();
    setupBookingWizard();
    setupCustomerPortal();
    setupQuickContactActions();

    // Fetch initial data from SQLite Database API
    await loadInitialDataFromDB();

    // Render components
    setupFleetAndTours();

    // Initialize submodules
    if (window.initAIAssistant) window.initAIAssistant();
    if (window.initAdminPanel) window.initAdminPanel();
    if (window.initDriverApp) window.initDriverApp();

    // Check hash route
    handleHashRouting();
    window.addEventListener("hashchange", handleHashRouting);
  }

  // Load from SQLite Database API
  async function loadInitialDataFromDB() {
    try {
      const [bRes, fRes, tRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/fleet"),
        fetch("/api/tours")
      ]);

      if (bRes.ok) AppState.bookings = await bRes.json();
      if (fRes.ok) {
        const fleetData = await fRes.json();
        if (fleetData && fleetData.length > 0) {
          AppState.fleet = fleetData;
          if (window.RTT_DATA) window.RTT_DATA.fleet = fleetData;
        }
      }
      if (tRes.ok) {
        const toursData = await tRes.json();
        if (toursData && toursData.length > 0) {
          AppState.tours = toursData;
          if (window.RTT_DATA) window.RTT_DATA.tourPackages = toursData;
        }
      }
    } catch (e) {
      console.warn("API load error, falling back to bundled data", e);
      if (window.RTT_DATA) {
        AppState.bookings = [...window.RTT_DATA.initialBookings];
        AppState.fleet = [...window.RTT_DATA.fleet];
        AppState.tours = [...window.RTT_DATA.tourPackages];
      }
    }
  }

  // Public Getters and Setters for other modules
  window.getAppBookings = () => AppState.bookings;

  window.updateBookingStatus = (id, newStatus) => {
    const booking = AppState.bookings.find(b => b.id === id);
    if (booking) {
      booking.tripStatus = newStatus;
      if (window.refreshAdminPanel) window.refreshAdminPanel();
      if (window.refreshDriverApp) window.refreshDriverApp();
      updateCustomerPortalUI();
    }
  };

  window.updateBookingDriver = (bookingId, driver) => {
    const booking = AppState.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.driverId = driver.id;
      booking.driverName = driver.name;
      booking.driverPhone = driver.phone;
      booking.vehiclePlate = driver.assigned_vehicle || driver.assignedVehicle;
      booking.tripStatus = "Driver Assigned";
      if (window.refreshAdminPanel) window.refreshAdminPanel();
      if (window.refreshDriverApp) window.refreshDriverApp();
      updateCustomerPortalUI();
    }
  };

  window.removeBooking = (id) => {
    AppState.bookings = AppState.bookings.filter(b => b.id !== id);
  };

  // Language / i18n System
  function setupLanguage() {
    window.currentLanguage = AppState.language;
    updateLanguageButtons();
    applyLanguageDOM();

    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        if (lang && lang !== AppState.language) {
          AppState.language = lang;
          window.currentLanguage = lang;
          localStorage.setItem(STORAGE_KEY_LANG, lang);
          updateLanguageButtons();
          applyLanguageDOM();
          setupFleetAndTours();
        }
      });
    });
  }

  function updateLanguageButtons() {
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === AppState.language);
    });
  }

  function applyLanguageDOM() {
    const lang = AppState.language;
    document.querySelectorAll("[data-en]").forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = text;
        } else {
          el.innerHTML = text;
        }
      }
    });
  }

  // Navigation & Hash Router
  function setupNavigation() {
    const mobileToggle = document.getElementById("mobileToggle");
    const navMenu = document.getElementById("navMenu");

    mobileToggle?.addEventListener("click", () => {
      navMenu?.classList.toggle("open");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navMenu?.classList.remove("open");
      });
    });
  }

  function handleHashRouting() {
    const hash = window.location.hash || "#home";
    const cleanHash = hash.replace("#", "");

    document.querySelectorAll(".app-view").forEach(section => {
      section.style.display = "none";
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });

    const targetSection = document.getElementById(`view-${cleanHash}`);
    if (targetSection) {
      targetSection.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (cleanHash === "my-bookings") {
        updateCustomerPortalUI();
      } else if (cleanHash === "admin") {
        if (window.refreshAdminPanel) window.refreshAdminPanel();
      } else if (cleanHash === "driver-app") {
        if (window.refreshDriverApp) window.refreshDriverApp();
      }
    } else {
      const home = document.getElementById("view-home");
      if (home) home.style.display = "block";
      const inPageAnchor = document.getElementById(cleanHash);
      if (inPageAnchor) {
        setTimeout(() => inPageAnchor.scrollIntoView({ behavior: "smooth" }), 60);
      }
    }
  }

  // Setup Fleet & Tour Cards (No Hardcoded Prices!)
  function setupFleetAndTours() {
    const fleetGrid = document.getElementById("fleetContainer");
    const toursGrid = document.getElementById("toursContainer");
    const lang = AppState.language;

    const fleet = (AppState.fleet && AppState.fleet.length > 0) ? AppState.fleet : window.RTT_DATA.fleet;
    const tours = (AppState.tours && AppState.tours.length > 0) ? AppState.tours : window.RTT_DATA.tourPackages;

    // Render Fleet without hardcoded prices
    if (fleetGrid && fleet) {
      fleetGrid.innerHTML = fleet.map(v => `
        <div class="vehicle-card">
          <div class="vehicle-img-wrap">
            <img src="${v.image}" alt="${v.name}" loading="lazy">
            <span class="vehicle-badge-pill">${v.badge || 'Royal Fleet'}</span>
            <span class="vehicle-rate-pill" style="background:#059669;">Verified Fleet</span>
          </div>
          <div class="vehicle-body">
            <h3 class="vehicle-name">${v.name}</h3>
            <span class="vehicle-type-sub">${v.type} • ${v.ac ? 'Chilled Dual AC' : 'Non-AC'}</span>
            
            <div class="vehicle-specs-grid">
              <div class="spec-item">👥 <span>${v.seats} Passenger Seats</span></div>
              <div class="spec-item">🧳 <span>${v.luggage}</span></div>
              <div class="spec-item">🛡️ <span>Spotless Sanitized AC</span></div>
              <div class="spec-item">🗺️ <span>All India &amp; Rajasthan Permit</span></div>
            </div>

            <ul class="vehicle-features-list">
              ${(Array.isArray(v.features) ? v.features : []).map(f => `<li>${f}</li>`).join("")}
            </ul>

            <div class="vehicle-footer">
              <button class="btn btn-primary" style="flex:1;" onclick="window.startBookingWithVehicle('${v.id}')">
                ${lang === 'hi' ? 'यह गाड़ी बुक करें' : 'Book This Vehicle ➔'}
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }

    // Render Tours with transparent 'Up to ₹...' pricing and dynamic rule badges
    if (toursGrid && tours) {
      toursGrid.innerHTML = tours.map(pkg => `
        <div class="tour-card">
          <div class="tour-img-wrap">
            <img src="${pkg.cover}" alt="${pkg.title}">
            <span class="tour-duration-tag">⏱️ ${pkg.duration}</span>
            <span class="tour-tag-pill">${pkg.tag || 'Popular Tour'}</span>
          </div>
          <div class="tour-body">
            <h3 class="tour-title">${lang === 'hi' ? (pkg.title_hi || pkg.hindiTitle || pkg.title) : pkg.title}</h3>
            
            <div class="tour-highlights-title">Key Tour Sights:</div>
            <ul class="tour-highlights">
              ${(Array.isArray(pkg.highlights) ? pkg.highlights : []).map(h => `<li>${h}</li>`).join("")}
            </ul>

            <div class="tour-pricing-rule-box" style="background:#f0fdf4; border-left:3px solid #059669; padding:8px 12px; border-radius:6px; margin:12px 0;">
              <span style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#065f46; letter-spacing:0.5px; display:block;">Pricing Calculation Rule:</span>
              <span style="font-size:0.8rem; font-weight:600; color:#047857; line-height:1.35; display:block;">
                ${pkg.pricing_rule || (pkg.trip_mode === 'same_day' ? 'Same Day Drop: Calculated on actual KM (Zero Night Charge)' : 'Multi-Day Tour: 250 KM/Day Min Rule + Driver Night Allowance Extra')}
              </span>
            </div>

            <div class="tour-price-row" style="align-items:center; margin-bottom:14px;">
              <div>
                <span style="font-size:0.75rem; color:#64748b; display:block;">Transparent Database Tariff:</span>
                <span class="tour-price-amount" style="font-size:1.35rem; font-weight:800; color:#059669;">
                  ${pkg.price_upto || pkg.price || 'Best Quote'}
                </span>
              </div>
              <span style="font-size:0.75rem; color:#64748b; text-align:right;">Fuel, Tolls &amp; Driver Allowance Included</span>
            </div>

            <button class="btn btn-navy" style="width:100%; font-weight:600;" onclick="window.startBookingTour('${pkg.id}')">
              ${lang === 'hi' ? 'यह टूर पैकेज बुक करें ➔' : 'Book Tour ' + (pkg.price_upto ? '(' + pkg.price_upto + ')' : '') + ' ➔'}
            </button>
          </div>
        </div>
      `).join("");
    }

    if (window.refresh3DTilt) window.refresh3DTilt();
  }

  // Central Dynamic Tariff Engine (Same Day Actual KM vs Multi-Day 250 KM/day minimum rule)
  function calculateTripTariff({ drop = "", vehicleId = "innova-crysta", tripMode = "same_day", days = 1 }) {
    const fleet = (AppState.fleet && AppState.fleet.length > 0) ? AppState.fleet : window.RTT_DATA.fleet;
    const v = fleet.find(item => item.id === vehicleId) || fleet[0];
    
    const ratePerKm = Number(v.rate_per_km || v.ratePerKm || 18);
    const minKmPerDay = Number(v.min_km_per_day || v.minKmPerDay || 250);
    const nightCharge = Number(v.night_charge || v.driverAllowance || 350);

    // Determine route distance based on destination
    const dropLower = (drop || "").toLowerCase();
    let distance = 250; // Standard outstation default

    // Check specific outstation destinations first
    if (dropLower.includes("udaipur")) {
      distance = 395;
    } else if (dropLower.includes("jaisalmer")) {
      distance = 560;
    } else if (dropLower.includes("jodhpur")) {
      distance = 335;
    } else if (dropLower.includes("delhi") || dropLower.includes("gurgaon") || dropLower.includes("noida")) {
      distance = 275;
    } else if (dropLower.includes("agra") || dropLower.includes("taj")) {
      distance = 240;
    } else if (dropLower.includes("pushkar") || dropLower.includes("ajmer")) {
      distance = 145;
    } else if (dropLower.includes("ranthambore") || dropLower.includes("sawai")) {
      distance = 160;
    } else if (dropLower.includes("khatu") || dropLower.includes("salasar")) {
      distance = 180;
    } else if (dropLower.includes("mount abu")) {
      distance = 490;
    } else if (dropLower.includes("bikaner")) {
      distance = 335;
    } else if (dropLower.includes("chittor")) {
      distance = 310;
    } else if (dropLower.includes("airport")) {
      distance = 35;
    } else if (dropLower.includes("darshan") || dropLower.includes("sightseeing") || dropLower.includes("local")) {
      distance = 80;
    }

    let totalFare = 0;
    let kmFare = 0;
    let driverNightTotal = 0;
    const minDailyKm = minKmPerDay || 250;
    let billableKm = distance;
    let ruleText = "";

    if (tripMode === "multi_day") {
      const tourDays = Math.max(2, Number(days) || 4);
      const nights = Math.max(1, tourDays - 1);
      const minAllowanceKm = tourDays * minDailyKm;
      billableKm = Math.max(minAllowanceKm, distance);
      kmFare = billableKm * ratePerKm;
      driverNightTotal = nights * nightCharge;
      totalFare = kmFare + driverNightTotal;
      if (distance > minAllowanceKm) {
        const extraKm = distance - minAllowanceKm;
        ruleText = `Multi-Day Tour: ${tourDays} Days (${minAllowanceKm} KM Base Min + ${extraKm} Extra KM @ ₹${ratePerKm}/KM) + ${nights} Night${nights > 1 ? 's' : ''} Driver Allowance (₹${nightCharge}/night)`;
      } else {
        ruleText = `Multi-Day Tour: ${tourDays} Days × ${minDailyKm} KM/Day Min (${minAllowanceKm} KM) @ ₹${ratePerKm}/KM + ${nights} Night${nights > 1 ? 's' : ''} Driver Allowance (₹${nightCharge}/night)`;
      }
    } else {
      tripMode = "same_day";
      // Same Day Drop: Minimum 250 KM Running Rule applies! Extra KM charged above 250 KM
      billableKm = Math.max(minDailyKm, distance);
      kmFare = billableKm * ratePerKm;
      driverNightTotal = 0;
      totalFare = kmFare;
      if (distance > minDailyKm) {
        const extraKm = distance - minDailyKm;
        ruleText = `Same Day Drop: ${distance} KM Billed (${minDailyKm} KM Base Min + ${extraKm} Extra KM @ ₹${ratePerKm}/KM • Zero Night Charge)`;
      } else {
        ruleText = `Same Day Drop: Min. ${minDailyKm} KM Running Rule Applied (${distance} KM distance @ ₹${ratePerKm}/KM • Zero Night Charge)`;
      }
    }

    const roundedTotal = Math.ceil(totalFare / 50) * 50;
    const roundedKmFare = Math.ceil(kmFare / 50) * 50;

    return {
      distance,
      billableKm,
      ratePerKm,
      minKmPerDay,
      nightCharge,
      days: (tripMode === "multi_day") ? Math.max(2, Number(days) || 4) : 1,
      nights: (tripMode === "multi_day") ? Math.max(1, (Number(days) || 4) - 1) : 0,
      kmFare: roundedKmFare,
      driverNightTotal,
      total: roundedTotal,
      priceUpto: `Up to ₹${roundedTotal.toLocaleString("en-IN")}`,
      ruleText,
      vehicle: v
    };
  }

  // Quick Hero Calculator
  function setupHeroCalculator() {
    const tripChips = document.querySelectorAll(".hero-trip-chip");
    const modeChips = document.querySelectorAll(".hero-mode-chip");
    const durationGroup = document.getElementById("heroDurationGroup");
    const tourDaysSelect = document.getElementById("heroTourDays");
    const calcPickup = document.getElementById("heroCalcPickup");
    const calcDrop = document.getElementById("heroCalcDrop");
    const calcVeh = document.getElementById("heroCalcVehicle");
    const priceDisplay = document.getElementById("heroEstimatedPrice");
    const ruleDisplay = document.getElementById("heroEstimateRuleBadge");
    const btnBookNow = document.getElementById("heroBtnProceedBooking");

    let currentHeroTrip = "outstation";
    let currentHeroMode = "same_day";

    function updateHeroPriceEstimate() {
      const drop = calcDrop?.value || "Udaipur (Lake City)";
      const vehicleId = calcVeh?.value || "innova-crysta";
      const days = (currentHeroMode === "multi_day" && tourDaysSelect) ? parseInt(tourDaysSelect.value, 10) : 1;

      const tariff = calculateTripTariff({ drop, vehicleId, tripMode: currentHeroMode, days });

      if (priceDisplay) {
        priceDisplay.textContent = tariff.priceUpto;
      }
      if (ruleDisplay) {
        ruleDisplay.textContent = tariff.ruleText;
      }

      // Sync state draft
      AppState.bookingDraft.tripType = currentHeroTrip;
      AppState.bookingDraft.tripMode = currentHeroMode;
      AppState.bookingDraft.durationDays = days;
      AppState.bookingDraft.vehicleId = vehicleId;
      AppState.bookingDraft.pickup = calcPickup?.value || "Jaipur City Centre";
      AppState.bookingDraft.drop = drop;
      AppState.bookingDraft.estimatedFareUpto = tariff.priceUpto;
      AppState.bookingDraft.pricingRule = tariff.ruleText;
    }

    window.selectHeroTripMode = function(mode) {
      document.querySelectorAll(".hero-mode-chip").forEach(c => c.classList.toggle("active", c.getAttribute("data-mode") === mode));
      currentHeroMode = mode;
      
      const heroDrop = document.getElementById("heroCalcDrop");
      const heroDur = document.getElementById("heroDurationGroup");
      const heroDaysSel = document.getElementById("heroTourDays");

      if (mode === "multi_day") {
        document.querySelectorAll(".hero-trip-chip").forEach(c => c.classList.toggle("active", c.getAttribute("data-type") === "outstation"));
        currentHeroTrip = "outstation";
        if (heroDrop && (heroDrop.value.includes("Airport") || heroDrop.value.includes("Circuit") || heroDrop.value.includes("80 KM"))) {
          heroDrop.value = "Udaipur (Lake City)";
        }
      }

      if (heroDur) {
        heroDur.style.display = (mode === "multi_day") ? "block" : "none";
      }
      if (mode === "multi_day") {
        AppState.bookingDraft.tripMode = "multi_day";
        AppState.bookingDraft.durationDays = parseInt(heroDaysSel?.value || 4, 10);
      } else {
        AppState.bookingDraft.tripMode = "same_day";
        AppState.bookingDraft.durationDays = 1;
      }
      updateHeroPriceEstimate();
    };

    window.selectHeroTripType = function(type) {
      document.querySelectorAll(".hero-trip-chip").forEach(c => c.classList.toggle("active", c.getAttribute("data-type") === type));
      currentHeroTrip = type;
      const heroDrop = document.getElementById("heroCalcDrop");

      if (type === "local") {
        if (heroDrop) heroDrop.value = "Jaipur Sightseeing Circuit (80 KM)";
        window.selectHeroTripMode("same_day");
      } else if (type === "airport") {
        if (heroDrop) heroDrop.value = "Jaipur International Airport (JAI)";
        window.selectHeroTripMode("same_day");
      } else {
        if (heroDrop && (heroDrop.value.includes("Airport") || heroDrop.value.includes("Circuit") || heroDrop.value.includes("80 KM"))) {
          heroDrop.value = "Udaipur (Lake City)";
        }
        updateHeroPriceEstimate();
      }
    };

    tripChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const type = chip.getAttribute("data-type");
        window.selectHeroTripType(type);
      });
    });

    modeChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const mode = chip.getAttribute("data-mode");
        window.selectHeroTripMode(mode);
      });
    });

    tourDaysSelect?.addEventListener("change", () => {
      if (currentHeroMode === "multi_day") {
        AppState.bookingDraft.durationDays = parseInt(tourDaysSelect.value, 10);
      }
      updateHeroPriceEstimate();
    });
    calcVeh?.addEventListener("change", updateHeroPriceEstimate);
    calcDrop?.addEventListener("input", updateHeroPriceEstimate);
    calcPickup?.addEventListener("input", updateHeroPriceEstimate);

    // Initial calculation trigger
    updateHeroPriceEstimate();

    btnBookNow?.addEventListener("click", () => {
      updateHeroPriceEstimate();
      window.location.hash = "#book";
      populateWizardFields();
      goToStep(2);
    });
  }

  // Booking Wizard Core
  function setupBookingWizard() {
    document.getElementById("btnStep1Next")?.addEventListener("click", () => {
      const p = document.getElementById("wizPickup")?.value;
      const d = document.getElementById("wizDrop")?.value;
      const date = document.getElementById("wizDate")?.value;
      const time = document.getElementById("wizTime")?.value;
      const pax = document.getElementById("wizPax")?.value;
      const activeTrip = document.querySelector(".wiz-trip-chip.active")?.getAttribute("data-type") || "outstation";
      const activeMode = document.querySelector(".wiz-mode-chip.active")?.getAttribute("data-mode") || "same_day";
      const tourDays = document.getElementById("wizTourDays")?.value;

      if (p) AppState.bookingDraft.pickup = p;
      if (d) AppState.bookingDraft.drop = d;
      if (date) AppState.bookingDraft.date = date;
      if (time) AppState.bookingDraft.time = time;
      if (pax) AppState.bookingDraft.passengers = parseInt(pax, 10);
      AppState.bookingDraft.tripType = activeTrip;
      AppState.bookingDraft.tripMode = activeMode;
      AppState.bookingDraft.durationDays = activeMode === "multi_day" ? parseInt(tourDays || 4, 10) : 1;

      goToStep(2);
    });

    document.getElementById("btnStep2Back")?.addEventListener("click", () => goToStep(1));
    document.getElementById("btnStep2Modify")?.addEventListener("click", () => goToStep(1));
    document.getElementById("btnStep2Next")?.addEventListener("click", () => goToStep(3));
    document.getElementById("btnStep3Back")?.addEventListener("click", () => goToStep(2));
    document.getElementById("btnStep3Next")?.addEventListener("click", handleStep3Validation);
    document.getElementById("btnStep4Back")?.addEventListener("click", () => goToStep(3));
    document.getElementById("btnConfirmBookingFinal")?.addEventListener("click", handleBookingFinalization);

    window.selectWizardTripMode = function(mode) {
      document.querySelectorAll(".wiz-mode-chip").forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-mode") === mode);
      });
      AppState.bookingDraft.tripMode = mode;
      const durGroup = document.getElementById("wizDurationGroup");
      if (durGroup) {
        durGroup.style.display = mode === "multi_day" ? "block" : "none";
      }
      if (mode === "multi_day") {
        document.querySelectorAll(".wiz-trip-chip").forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-type") === "outstation");
        });
        AppState.bookingDraft.tripType = "outstation";
        const wizDrop = document.getElementById("wizDrop");
        if (wizDrop && (wizDrop.value.includes("Airport") || wizDrop.value.includes("Circuit") || wizDrop.value.includes("80 KM"))) {
          wizDrop.value = "Udaipur City Palace";
        }
        const daysSelect = document.getElementById("wizTourDays");
        AppState.bookingDraft.durationDays = parseInt(daysSelect?.value || 4, 10);
      } else {
        AppState.bookingDraft.durationDays = 1;
      }
      renderWizardVehicleGrid();
      recalculateFare();
    };

    window.selectWizardTripType = function(type) {
      document.querySelectorAll(".wiz-trip-chip").forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-type") === type);
      });
      AppState.bookingDraft.tripType = type;
      const wizDrop = document.getElementById("wizDrop");
      if (type === "local") {
        if (wizDrop) wizDrop.value = "Jaipur Sightseeing Circuit (80 KM)";
        window.selectWizardTripMode("same_day");
      } else if (type === "airport") {
        if (wizDrop) wizDrop.value = "Jaipur International Airport (JAI)";
        window.selectWizardTripMode("same_day");
      } else {
        if (wizDrop && (wizDrop.value.includes("Airport") || wizDrop.value.includes("Circuit") || wizDrop.value.includes("80 KM"))) {
          wizDrop.value = "Udaipur City Palace";
        }
        renderWizardVehicleGrid();
        recalculateFare();
      }
    };

    document.querySelectorAll(".wiz-trip-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const type = chip.getAttribute("data-type");
        window.selectWizardTripType(type);
      });
    });

    document.querySelectorAll(".wiz-mode-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const mode = chip.getAttribute("data-mode");
        window.selectWizardTripMode(mode);
      });
    });

    document.getElementById("wizTourDays")?.addEventListener("change", (e) => {
      AppState.bookingDraft.durationDays = parseInt(e.target.value, 10);
      recalculateFare();
    });

    document.getElementById("wizDrop")?.addEventListener("input", recalculateFare);
    document.getElementById("wizPickup")?.addEventListener("input", recalculateFare);

    document.querySelectorAll(".pay-card-option").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".pay-card-option").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        AppState.bookingDraft.payMode = card.getAttribute("data-mode");
        updatePaymentDetailsDisplay();
      });
    });

    document.getElementById("btnSendOtp")?.addEventListener("click", sendSimulatedOtp);
    document.getElementById("btnVerifyOtp")?.addEventListener("click", verifySimulatedOtp);

    renderWizardVehicleGrid();
  }

  function goToStep(step) {
    AppState.currentStep = step;
    document.querySelectorAll(".wizard-step-node").forEach(node => {
      const s = Number(node.getAttribute("data-step"));
      node.classList.toggle("active", s === step);
    });

    document.querySelectorAll(".wizard-pane").forEach(pane => {
      const s = Number(pane.getAttribute("data-pane"));
      pane.classList.toggle("active", s === step);
    });

    if (step === 2) {
      recalculateFare();
    } else if (step === 4) {
      updatePaymentDetailsDisplay();
    }

    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function populateWizardFields() {
    const p = document.getElementById("wizPickup");
    const d = document.getElementById("wizDrop");
    const date = document.getElementById("wizDate");
    const durGroup = document.getElementById("wizDurationGroup");
    const tourDays = document.getElementById("wizTourDays");

    if (p && AppState.bookingDraft.pickup) p.value = AppState.bookingDraft.pickup;
    if (d && AppState.bookingDraft.drop) d.value = AppState.bookingDraft.drop;
    if (date && !date.value) {
      date.value = new Date().toISOString().slice(0, 10);
    }

    // Sync mode chips in wizard
    const mode = AppState.bookingDraft.tripMode || "same_day";
    document.querySelectorAll(".wiz-mode-chip").forEach(c => {
      const match = c.getAttribute("data-mode") === mode;
      c.classList.toggle("active", match);
    });

    if (durGroup) {
      durGroup.style.display = mode === "multi_day" ? "block" : "none";
    }
    if (tourDays && AppState.bookingDraft.durationDays) {
      tourDays.value = AppState.bookingDraft.durationDays;
    }

    renderWizardVehicleGrid();
    recalculateFare();
  }

  window.goToStep = goToStep;

  function renderWizardVehicleGrid() {
    const grid = document.getElementById("wizVehGrid");
    if (!grid) return;

    const fleet = (AppState.fleet && AppState.fleet.length > 0) ? AppState.fleet : window.RTT_DATA.fleet;
    const drop = document.getElementById("wizDrop")?.value || AppState.bookingDraft.drop || "Outstation Trip";
    const mode = AppState.bookingDraft.tripMode || "same_day";
    const tourDaysInput = document.getElementById("wizTourDays");
    const days = mode === "multi_day" ? parseInt(tourDaysInput?.value || AppState.bookingDraft.durationDays || 4, 10) : 1;

    grid.innerHTML = fleet.map(v => {
      const vTariff = calculateTripTariff({ drop, vehicleId: v.id, tripMode: mode, days });
      return `
        <div class="veh-select-card ${AppState.bookingDraft.vehicleId === v.id ? 'selected' : ''}" onclick="window.selectWizardVehicle('${v.id}')">
          <img src="${v.image}" alt="${v.name}" class="veh-thumb">
          <div class="veh-details" style="flex-grow:1;">
            <h5>${v.name}</h5>
            <p>👥 ${v.seats} Seats | 🧳 ${v.luggage} | ${v.ac ? 'Chilled AC' : 'Non-AC'}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:4px;">
              <span style="font-size:0.8rem; color:#475569; font-weight:600;">₹${v.rate_per_km || v.ratePerKm}/KM • ${mode === 'multi_day' ? `${days} Days (${days * 250} KM Min)` : 'Min. 250 KM'}</span>
              <span class="veh-fare-tag" style="font-size:0.92rem; color:#059669; font-weight:800; background:#dcfce7; padding:2px 8px; border-radius:6px;">${vTariff.priceUpto}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  window.selectWizardVehicle = (vehId) => {
    AppState.bookingDraft.vehicleId = vehId;
    renderWizardVehicleGrid();
    recalculateFare();
  };

  function recalculateFare() {
    const elRule = document.getElementById("breakdownRuleBadge");
    const elBase = document.getElementById("breakdownBaseFare");
    const elNight = document.getElementById("breakdownNightAllowance");
    const elTotal = document.getElementById("breakdownTotalFare");
    const elAdvance = document.getElementById("breakdownAdvanceFare");

    const drop = document.getElementById("wizDrop")?.value || AppState.bookingDraft.drop || "Outstation Trip";
    const pickup = document.getElementById("wizPickup")?.value || AppState.bookingDraft.pickup || "Jaipur City Centre";
    const vehicleId = AppState.bookingDraft.vehicleId || "innova-crysta";
    const mode = AppState.bookingDraft.tripMode || "same_day";
    const tourDaysInput = document.getElementById("wizTourDays");
    const days = mode === "multi_day" ? parseInt(tourDaysInput?.value || AppState.bookingDraft.durationDays || 4, 10) : 1;

    AppState.bookingDraft.tripMode = mode;
    AppState.bookingDraft.durationDays = days;
    AppState.bookingDraft.vehicleId = vehicleId;
    AppState.bookingDraft.drop = drop;
    AppState.bookingDraft.pickup = pickup;

    const tariff = calculateTripTariff({ drop, vehicleId, tripMode: mode, days });

    if (elRule) {
      elRule.textContent = tariff.ruleText;
    }
    if (elBase) {
      elBase.textContent = `Up to ₹${tariff.kmFare.toLocaleString("en-IN")}`;
    }
    if (elNight) {
      elNight.textContent = tariff.driverNightTotal > 0 
        ? `₹${tariff.driverNightTotal.toLocaleString("en-IN")} (${tariff.nights} Night${tariff.nights > 1 ? 's' : ''} @ ₹${tariff.nightCharge}/night)`
        : "₹0 (Same Day Drop - Zero Night Charge)";
      elNight.style.color = tariff.driverNightTotal > 0 ? "#0b2a55" : "#059669";
    }
    if (elTotal) {
      elTotal.textContent = tariff.priceUpto;
    }
    if (elAdvance) {
      elAdvance.textContent = "Optional Advance (Pay to Driver on Arrival)";
    }

    // Step 1 live estimate box
    const step1Price = document.getElementById("wizStep1PriceUpto");
    const step1Rule = document.getElementById("wizStep1RuleText");
    if (step1Price) step1Price.textContent = tariff.priceUpto;
    if (step1Rule) step1Rule.textContent = tariff.ruleText;

    // Step 2 route summary banner
    const step2Summary = document.getElementById("step2RouteSummary");
    if (step2Summary) {
      step2Summary.textContent = mode === "multi_day"
        ? `${pickup} ➔ ${drop} • Multi-Day Tour (${days} Days / ${days - 1} Nights • Min. ${days * 250} KM)`
        : `${pickup} ➔ ${drop} • Same Day Drop (Min. 250 KM Rule)`;
    }

    // Save current computed values to draft
    AppState.bookingDraft.estimatedFareUpto = tariff.priceUpto;
    AppState.bookingDraft.pricingRule = tariff.ruleText;
  }

  function sendSimulatedOtp() {
    const phoneInput = document.getElementById("wizCustPhone");
    const phone = phoneInput?.value.trim();

    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number to receive OTP.");
      phoneInput?.focus();
      return;
    }

    AppState.generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    showToast(`📱 SMS: Your Rajputana verification code is: ${AppState.generatedOtp}`);

    const otpSection = document.getElementById("otpInputSection");
    if (otpSection) otpSection.style.display = "block";

    const otpField = document.getElementById("wizOtpField");
    if (otpField) {
      otpField.value = AppState.generatedOtp;
      otpField.focus();
    }
  }

  function verifySimulatedOtp() {
    const otpField = document.getElementById("wizOtpField");
    const entered = otpField?.value.trim();

    if (entered === AppState.generatedOtp) {
      AppState.bookingDraft.otpVerified = true;
      const statusBadge = document.getElementById("otpStatusBadge");
      if (statusBadge) {
        statusBadge.innerHTML = "✅ Verified Mobile Number";
        statusBadge.style.color = "#059669";
      }
      showToast("Mobile number verified successfully!");
    } else {
      alert("Invalid OTP code. Please enter the 4-digit code shown in the notification.");
    }
  }

  function handleStep3Validation() {
    const name = document.getElementById("wizCustName")?.value.trim();
    const phone = document.getElementById("wizCustPhone")?.value.trim();
    const email = document.getElementById("wizCustEmail")?.value.trim();
    const notes = document.getElementById("wizNotes")?.value.trim();

    if (!name) {
      alert("Please enter your full name.");
      return;
    }
    if (!phone || phone.length < 10) {
      alert("Please enter your 10-digit phone number.");
      return;
    }

    AppState.bookingDraft.otpVerified = true;
    AppState.bookingDraft.customerName = name;
    AppState.bookingDraft.phone = phone;
    AppState.bookingDraft.email = email || "guest@rajputanatour.com";
    AppState.bookingDraft.notes = notes || "";
    AppState.currentUserPhone = phone;
    localStorage.setItem(STORAGE_KEY_USER, phone);

    goToStep(4);
  }

  function updatePaymentDetailsDisplay() {
    const payMode = AppState.bookingDraft.payMode;
    const elAmount = document.getElementById("payDueAmountDisplay");
    const elSummary = document.getElementById("paySummaryText");

    if (payMode === "advance_20") {
      if (elAmount) elAmount.textContent = "Optional 20% Advance";
      if (elSummary) elSummary.textContent = "Lock your vehicle instantly via Razorpay online. Balance payable directly to your chauffeur upon arrival.";
    } else if (payMode === "full") {
      if (elAmount) elAmount.textContent = "100% Full Payment";
      if (elSummary) elSummary.textContent = "Pay full amount online for seamless cashless travel. Instant tax invoice voucher issued.";
    } else {
      if (elAmount) elAmount.textContent = "Pay to Driver (0 Advance)";
      if (elSummary) elSummary.textContent = "Zero advance needed! Pay comfortably in cash or UPI to your chauffeur upon vehicle pickup.";
    }
  }

  function handleBookingFinalization() {
    const payMode = AppState.bookingDraft.payMode;
    if (payMode === "cash") {
      completeBookingRecord("Cash / UPI on Arrival", "Pay to Driver on Arrival");
    } else {
      openRazorpaySimulator();
    }
  }

  function openRazorpaySimulator() {
    const modal = document.getElementById("razorpayModal");
    const amountSpan = document.getElementById("rzpAmountSpan");
    if (amountSpan) amountSpan.textContent = "Custom Tour Booking";
    if (modal) modal.classList.add("show");
  }

  window.closeRazorpayModal = () => {
    document.getElementById("razorpayModal")?.classList.remove("show");
  };

  window.simulateRazorpaySuccess = () => {
    window.closeRazorpayModal();
    const txnId = "pay_RTT" + Math.floor(100000 + Math.random() * 900000);
    const method = document.querySelector('input[name="rzp_method"]:checked')?.value || "UPI";
    const statusText = AppState.bookingDraft.payMode === "advance_20" 
      ? `Advance Confirmed (Razorpay: ${txnId})`
      : `Full Paid (Razorpay: ${txnId})`;

    completeBookingRecord(`Razorpay ${method}`, statusText);
  };

  // COMPLETE BOOKING AND PERSIST TO SQLITE DATABASE!
  async function completeBookingRecord(paymentMethod, paymentStatus) {
    const bookingId = `RTT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fleet = (AppState.fleet && AppState.fleet.length > 0) ? AppState.fleet : window.RTT_DATA.fleet;
    const veh = fleet.find(v => v.id === AppState.bookingDraft.vehicleId) || fleet[0];
    const driver = window.RTT_DATA?.drivers[0] || { id: "drv-01", name: "Kalu Singh Bankawat", phone: "9829837082", assignedVehicle: "Toyota Innova Crysta (RJ 14 TA 7890)" };

    const newBooking = {
      id: bookingId,
      customerName: AppState.bookingDraft.customerName,
      phone: AppState.bookingDraft.phone,
      email: AppState.bookingDraft.email,
      serviceType: AppState.bookingDraft.tripType,
      tripMode: AppState.bookingDraft.tripMode || "same_day",
      durationDays: AppState.bookingDraft.durationDays || 1,
      pickup: document.getElementById("wizPickup")?.value || "Jaipur City",
      drop: document.getElementById("wizDrop")?.value || "Outstation Trip",
      date: document.getElementById("wizDate")?.value || new Date().toISOString().slice(0, 10),
      time: document.getElementById("wizTime")?.value || "09:00 AM",
      passengers: document.getElementById("wizPax")?.value || 4,
      vehicleId: veh.id,
      vehicleName: veh.name,
      estimatedFareUpto: AppState.bookingDraft.estimatedFareUpto || "Custom Quote",
      pricingRule: AppState.bookingDraft.pricingRule || "",
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      tripStatus: "Driver Assigned",
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehiclePlate: driver.assigned_vehicle || driver.assignedVehicle || "RJ 14 TA 7890",
      notes: AppState.bookingDraft.notes || "",
      createdAt: new Date().toISOString()
    };

    // Save directly to SQLite Database!
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking)
      });
      if (res.ok) {
        showToast("Booking recorded successfully in SQLite database!");
      }
    } catch (e) {
      console.warn("API database save error, saving locally", e);
    }

    AppState.bookings.unshift(newBooking);

    // Show Success Modal
    showBookingSuccessModal(newBooking);

    // Refresh Admin & Driver portals
    if (window.refreshAdminPanel) window.refreshAdminPanel();
    if (window.refreshDriverApp) window.refreshDriverApp();
  }

  function showBookingSuccessModal(booking) {
    const modal = document.getElementById("bookingSuccessModal");
    const summaryBox = document.getElementById("successBookingDetails");

    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:16px; margin-bottom:16px;">
          <h4 style="color:#065f46; font-size:1.15rem; margin-bottom:6px;">Booking Confirmed! Reference: ${booking.id}</h4>
          <p style="font-size:0.85rem; color:#047857;">Saved to SQLite database. An instant WhatsApp notification has been prepared.</p>
        </div>
        <div style="font-size:0.88rem; line-height:1.6; color:#0f172a;">
          <div><strong>Passenger:</strong> ${booking.customerName} (${booking.phone})</div>
          <div><strong>Vehicle:</strong> ${booking.vehicleName} (${booking.vehiclePlate})</div>
          <div><strong>Route:</strong> ${booking.pickup} ➔ ${booking.drop}</div>
          <div><strong>Duration:</strong> ${booking.durationDays || 1} Day(s) • ${booking.tripMode === 'multi_day' ? 'Multi-Day (250 KM/day rule)' : 'Same Day Drop'}</div>
          <div><strong>Estimated Tariff:</strong> <span style="font-weight:700; color:#059669;">${booking.estimatedFareUpto || 'Guaranteed Best Rate'}</span></div>
          ${booking.pricingRule ? `<div style="font-size:0.78rem; color:#065f46; background:#f0fdf4; padding:4px 8px; border-radius:4px; margin:4px 0;"><strong>Rule:</strong> ${booking.pricingRule}</div>` : ''}
          <div><strong>Payment Status:</strong> ${booking.paymentStatus}</div>
          <div><strong>Assigned Chauffeur:</strong> ${booking.driverName} (📞 <a href="tel:${booking.driverPhone}">${booking.driverPhone}</a>)</div>
        </div>
      `;
    }

    const waText = encodeURIComponent(`Namaste Rajputana Tour & Travellers, I have booked ride ${booking.id} for ${booking.customerName} from ${booking.pickup} to ${booking.drop} on ${booking.date}. Please confirm.`);
    const waBtn = document.getElementById("btnSuccessWhatsApp");
    if (waBtn) waBtn.href = `https://wa.me/919829837082?text=${waText}`;

    if (modal) modal.classList.add("show");
  }

  window.closeSuccessModal = () => {
    document.getElementById("bookingSuccessModal")?.classList.remove("show");
    window.location.hash = "#my-bookings";
  };

  // Customer Portal & Live GPS Tracker (Queries SQLite DB)
  function setupCustomerPortal() {
    const btnSearchBookings = document.getElementById("btnCustomerSearchBookings");
    btnSearchBookings?.addEventListener("click", () => {
      const phone = document.getElementById("customerLoginPhone")?.value.trim();
      if (!phone || phone.length < 10) {
        alert("Please enter your registered 10-digit mobile number.");
        return;
      }
      AppState.currentUserPhone = phone;
      localStorage.setItem(STORAGE_KEY_USER, phone);
      updateCustomerPortalUI();
    });
  }

  async function updateCustomerPortalUI() {
    const listContainer = document.getElementById("customerBookingsList");
    const activeTrackingSection = document.getElementById("activeTripTrackerSection");
    if (!listContainer) return;

    const phone = AppState.currentUserPhone;
    if (!phone) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:#64748b;">
          <p>Please enter your 10-digit mobile number above to view your active bookings and live vehicle GPS tracking.</p>
        </div>
      `;
      if (activeTrackingSection) activeTrackingSection.style.display = "none";
      return;
    }

    // Query SQLite database for customer's bookings!
    let userBookings = [];
    try {
      const res = await fetch(`/api/bookings/my?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        userBookings = await res.json();
      } else {
        userBookings = AppState.bookings.filter(b => b.phone.includes(phone));
      }
    } catch (e) {
      userBookings = AppState.bookings.filter(b => b.phone.includes(phone));
    }

    if (userBookings.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:#64748b;">
          <p>No bookings found in database for mobile number <strong>${phone}</strong>.</p>
          <a href="#book" class="btn btn-primary" style="margin-top:10px;">Book a Cab Now</a>
        </div>
      `;
      if (activeTrackingSection) activeTrackingSection.style.display = "none";
      return;
    }

    const activeTrip = userBookings[0];

    if (activeTrackingSection && activeTrip) {
      activeTrackingSection.style.display = "block";
      renderActiveTripTracker(activeTrip);
    }

    listContainer.innerHTML = userBookings.map(b => `
      <div class="card portal-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h4 style="color:#0b2a55; font-size:1.15rem; margin-bottom:2px;">Booking ${b.id}</h4>
            <span style="font-size:0.8rem; color:#64748b;">Recorded in SQLite Database • ${b.createdAt ? b.createdAt.substring(0,10) : ''}</span>
          </div>
          <span style="background:#dbeafe; color:#1d4ed8; font-weight:700; padding:4px 12px; border-radius:999px; font-size:0.82rem;">
            ${b.tripStatus}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:0.85rem; margin-bottom:16px;">
          <div><strong>🚗 Vehicle:</strong> ${b.vehicleName} (${b.vehiclePlate})</div>
          <div><strong>📅 Date:</strong> ${b.date} at ${b.time || ''}</div>
          <div><strong>📍 Pickup:</strong> ${b.pickup}</div>
          <div><strong>🏁 Drop:</strong> ${b.drop}</div>
          <div><strong>🛡️ Booking Status:</strong> ${b.paymentStatus}</div>
          <div><strong>👤 Driver:</strong> ${b.driverName} (📞 ${b.driverPhone})</div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-outline" onclick="window.printBookingReceipt('${b.id}')">🖨️ Print Receipt Voucher</button>
          <a href="https://wa.me/919829837082?text=Trip%20inquiry%20for%20booking%20${b.id}" target="_blank" class="btn btn-sm btn-whatsapp">💬 Support on WhatsApp</a>
        </div>
      </div>
    `).join("");
  }

  function renderActiveTripTracker(trip) {
    const elId = document.getElementById("trackBookingId");
    const elDriver = document.getElementById("trackDriverName");
    const elPlate = document.getElementById("trackVehiclePlate");
    const elStatus = document.getElementById("trackStatusText");

    if (elId) elId.textContent = trip.id;
    if (elDriver) elDriver.textContent = `${trip.driverName} (📞 ${trip.driverPhone})`;
    if (elPlate) elPlate.textContent = trip.vehiclePlate;
    if (elStatus) elStatus.textContent = trip.tripStatus;

    const steps = ["Booked", "Driver Assigned", "Driver on Way", "Trip Started", "Completed"];
    const currentIndex = steps.indexOf(trip.tripStatus);

    steps.forEach((step, idx) => {
      const node = document.getElementById(`trackNode${idx + 1}`);
      if (node) {
        node.classList.toggle("done", idx < currentIndex);
        node.classList.toggle("current", idx === currentIndex);
      }
    });

    initOrUpdateLeafletMap(trip);
  }

  function initOrUpdateLeafletMap(trip) {
    const mapElement = document.getElementById("trackingMap");
    if (!mapElement || typeof L === "undefined") return;

    const jaipurCoords = [26.9124, 75.7873];

    if (!AppState.trackingMap) {
      AppState.trackingMap = L.map("trackingMap").setView(jaipurCoords, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap'
      }).addTo(AppState.trackingMap);

      const carIcon = L.divIcon({
        className: 'car-leaflet-marker',
        html: `<div style="background:#0b2a55; color:#fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid #f59e0b;">🚖</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      AppState.trackingMarker = L.marker(jaipurCoords, { icon: carIcon }).addTo(AppState.trackingMap)
        .bindPopup(`<b>${trip.vehicleName}</b><br>${trip.driverName}<br>Status: ${trip.tripStatus}`).openPopup();

      let lat = jaipurCoords[0];
      let lng = jaipurCoords[1];

      if (AppState.trackingInterval) clearInterval(AppState.trackingInterval);

      AppState.trackingInterval = setInterval(() => {
        lat += (Math.random() - 0.48) * 0.0006;
        lng += (Math.random() - 0.48) * 0.0006;
        if (AppState.trackingMarker) {
          AppState.trackingMarker.setLatLng([lat, lng]);
        }
      }, 3000);
    } else {
      setTimeout(() => {
        AppState.trackingMap.invalidateSize();
      }, 200);
    }
  }

  window.printBookingReceipt = (bookingId) => {
    const b = AppState.bookings.find(item => item.id === bookingId);
    if (!b) return;

    const printWin = window.open("", "_blank");
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${b.id}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 700px; margin: 0 auto; }
          .header { border-bottom: 2px solid #0b2a55; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          h2 { color: #0b2a55; margin: 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 14px; }
          .total { font-size: 16px; font-weight: bold; color: #0b2a55; text-align: right; margin-top: 24px; padding-top: 14px; border-top: 2px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>RAJPUTANA TOUR & TRAVELLERS</h2>
            <small>Jaipur, Rajasthan • Service Available All India • +91 9829837082</small>
          </div>
          <div>
            <strong>Booking Ref: ${b.id}</strong><br>
            <small>Database Status: Synchronized</small>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Customer Details</strong><br>
            Name: ${b.customerName}<br>
            Phone: ${b.phone}<br>
            Email: ${b.email}
          </div>
          <div class="box">
            <strong>Vehicle & Driver</strong><br>
            Car: ${b.vehicleName}<br>
            Plate: ${b.vehiclePlate}<br>
            Driver: ${b.driverName} (${b.driverPhone})
          </div>
        </div>

        <div class="box">
          <strong>Trip Itinerary &amp; Tariff Rule</strong><br>
          Pickup: ${b.pickup}<br>
          Drop / Destination: ${b.drop}<br>
          Travel Date: ${b.date} at ${b.time || ''} (${b.passengers} Passengers)<br>
          Duration: ${b.durationDays || 1} Day(s) • ${b.tripMode === 'multi_day' ? 'Multi-Day (250 KM/day rule)' : 'Same Day Drop'}<br>
          ${b.pricingRule ? `<small style="color:#047857; font-weight:600;">Pricing Rule: ${b.pricingRule}</small>` : ''}
        </div>

        <div class="total">
          Estimated Tariff: <span style="color: #059669; margin-right: 15px;">${b.estimatedFareUpto || 'Guaranteed Best Rate'}</span>
          Payment Status: <span style="color: #0b2a55;">${b.paymentStatus}</span>
        </div>

        <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #64748b;">
          Thank you for choosing Rajputana Tour & Travellers. Have a safe and royal journey!
        </p>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 250);
  };

  function showToast(message) {
    let toast = document.getElementById("toastNotification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotification";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }
  window.showToast = showToast;

  window.startBookingWithVehicle = (vehId) => {
    AppState.bookingDraft.vehicleId = vehId;
    window.location.hash = "#book";
    populateWizardFields();
    goToStep(2);
  };

  window.startBookingTour = (tourId) => {
    const pkg = (AppState.tours || window.RTT_DATA.tourPackages).find(p => p.id === tourId);
    if (pkg) {
      AppState.bookingDraft.tripType = "outstation";
      AppState.bookingDraft.tripMode = pkg.trip_mode || (pkg.days > 1 ? "multi_day" : "same_day");
      AppState.bookingDraft.durationDays = pkg.days || 1;
      AppState.bookingDraft.pickup = "Jaipur Hotel / Airport / Railway Station";
      AppState.bookingDraft.drop = pkg.title;
      AppState.bookingDraft.estimatedFareUpto = pkg.price_upto || "Best Quote";
      AppState.bookingDraft.pricingRule = pkg.pricing_rule || "";

      window.location.hash = "#book";
      populateWizardFields();
      goToStep(2);
    }
  };

  function setupQuickContactActions() {
    document.querySelectorAll(".btn-whatsapp").forEach(btn => {
      if (!btn.href) {
        btn.href = "https://wa.me/919829837082?text=Hello%20Rajputana%20Tour%20Travellers,%20I%20would%20like%20to%20request%20a%20taxi%20booking%20quote.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
