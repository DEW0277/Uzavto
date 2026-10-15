/**
 * UzAvto Motors Luxury Sales Platform
 * Motion, AOS, Interactive Configurator & Ambient Light Engine
 */

// Model Database
const VEHICLE_DATA = {
  Tahoe: {
    fullName: "Chevrolet Tahoe High Country",
    family: "TO'LIQ O'LCHAMLI LUXURY SUV",
    basePrice: 1109250000,
    usdPrice: "~$88,000 USD",
    img: "assets/images/tahoe.jpg",
    specs: { engine: "6.2L V8 EcoTec3", hp: "420 HP", accel: "5.7 sek", trans: "10-speed Avtomat" }
  },
  Traverse: {
    fullName: "Chevrolet Traverse Premier",
    family: "PREMIER AEROSPORT CROSSOVER",
    basePrice: 760000000,
    usdPrice: "~$60,300 USD",
    img: "assets/images/traverse.jpg",
    specs: { engine: "3.6L V6 SIDI", hp: "318 HP", accel: "6.9 sek", trans: "9-speed Avtomat" }
  },
  Malibu: {
    fullName: "Chevrolet Malibu XL 2.0 Turbo",
    family: "BIZNES KLASS SPORT SEDAN",
    basePrice: 420000000,
    usdPrice: "~$33,300 USD",
    img: "assets/images/malibu.jpg",
    specs: { engine: "2.0L Turbo DOHC", hp: "253 HP", accel: "6.7 sek", trans: "9-speed Avtomat" }
  },
  Tracker: {
    fullName: "Chevrolet Tracker Redline",
    family: "ZAMONAVIY SHAHAR KROSSOVERI",
    basePrice: 245000000,
    usdPrice: "~$19,400 USD",
    img: "assets/images/tracker.jpg",
    specs: { engine: "1.2L E-Turbo", hp: "132 HP", accel: "8.9 sek", trans: "6-speed Avtomat" }
  }
};

// Configurator State
let currentConfig = {
  modelKey: "Tahoe",
  colorName: "TUXEDO BLACK",
  colorFilter: "brightness(0.9) contrast(1.1)",
  trimName: "High Country (Premier)",
  trimAddon: 0,
  downPaymentPercent: 30,
  termMonths: 36,
  interestRateAnnual: 0.18
};

// Web Audio API Ambient Sound Generator
let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let isAudioPlaying = false;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize AOS (Animate On Scroll)
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 850,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      once: true,
      offset: 50
    });
  }

  // 2. Setup Navbar Scroll State
  const topNav = document.getElementById("topNav");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      topNav.classList.add("scrolled");
    } else {
      topNav.classList.remove("scrolled");
    }
  });

  // 3. Menu Drawer Toggle
  const menuOpenBtn = document.getElementById("menuOpenBtn");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const menuCloseBtn = document.getElementById("menuCloseBtn");
  const menuDrawer = document.getElementById("menuDrawer");
  const drawerLinks = document.querySelectorAll(".drawer-nav-item");

  function openMenu() {
    menuDrawer.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    menuDrawer.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (menuOpenBtn) menuOpenBtn.addEventListener("click", openMenu);
  if (mobileMenuToggle) mobileMenuToggle.addEventListener("click", openMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener("click", closeMenu);

  drawerLinks.forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // 4. Ambient Canvas Particles & Light Engine
  initAmbientHeroCanvas();

  // 5. Configurator Sliders Setup
  const downPaymentSlider = document.getElementById("downPaymentSlider");
  const termSlider = document.getElementById("termSlider");

  if (downPaymentSlider) {
    downPaymentSlider.addEventListener("input", (e) => {
      currentConfig.downPaymentPercent = parseInt(e.target.value, 10);
      recalculateFinancing();
    });
  }

  if (termSlider) {
    termSlider.addEventListener("input", (e) => {
      currentConfig.termMonths = parseInt(e.target.value, 10);
      document.getElementById("termMonthsDisplay").textContent = `${currentConfig.termMonths} OY (${currentConfig.termMonths / 12} YIL)`;
      recalculateFinancing();
    });
  }

  // Initial Calculation
  recalculateFinancing();

  // 6. Sound Toggle
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener("click", toggleAmbientSound);
  }

  // 7. Motion Library Smooth Entry for Hero
  initMotionAnimations();
});

// Format Numbers with Spacing (Uzbek Sum)
function formatSum(number) {
  return Math.round(number).toLocaleString("ru-RU") + " UZS";
}

// -------------------------------------------------------------
// Interactive Car Configurator Logic
// -------------------------------------------------------------

function selectModel(modelKey) {
  if (!VEHICLE_DATA[modelKey]) return;
  currentConfig.modelKey = modelKey;

  // Update Model pick buttons
  document.querySelectorAll(".model-pick-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-model") === modelKey);
  });

  const car = VEHICLE_DATA[modelKey];

  // Update visual elements with Motion animation
  const carImg = document.getElementById("configCarImg");
  const sheen = document.getElementById("configSheen");

  if (window.Motion && Motion.animate) {
    Motion.animate(carImg, { opacity: [1, 0.3], transform: ["scale(1)", "scale(0.97)"] }, { duration: 0.25 }).finished.then(() => {
      carImg.src = car.img;
      carImg.style.filter = currentConfig.colorFilter;
      Motion.animate(carImg, { opacity: [0.3, 1], transform: ["scale(0.97)", "scale(1)"] }, { duration: 0.35 });
    });
  } else {
    carImg.src = car.img;
    carImg.style.filter = currentConfig.colorFilter;
  }

  document.getElementById("configFamilyLabel").textContent = car.family;
  document.getElementById("configCarTitle").textContent = car.fullName;
  document.getElementById("selectedModelName").textContent = modelKey.toUpperCase();

  // Sync select input in form
  const selectElem = document.getElementById("selectModelInput");
  if (selectElem) {
    for (let opt of selectElem.options) {
      if (opt.value.includes(modelKey)) {
        selectElem.value = opt.value;
        break;
      }
    }
  }

  recalculateFinancing();
  showToast(`${car.fullName} tanlandi`);
}

function selectColor(btn, colorName, filterCss) {
  document.querySelectorAll(".swatch-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  currentConfig.colorName = colorName.toUpperCase();
  currentConfig.colorFilter = filterCss;

  const carImg = document.getElementById("configCarImg");
  carImg.style.filter = filterCss;

  document.getElementById("configColorLabel").textContent = `${currentConfig.colorName}`;
  document.getElementById("selectedColorName").textContent = currentConfig.colorName;

  // Flash sheen layer
  const sheen = document.getElementById("configSheen");
  if (window.Motion && Motion.animate) {
    Motion.animate(sheen, { opacity: [0, 0.4, 0] }, { duration: 0.6 });
  }
}

function selectTrim(btn, trimName, addonPrice) {
  document.querySelectorAll(".trim-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  currentConfig.trimName = trimName;
  currentConfig.trimAddon = addonPrice;
  document.getElementById("selectedTrimName").textContent = trimName.toUpperCase();

  recalculateFinancing();
}

function recalculateFinancing() {
  const car = VEHICLE_DATA[currentConfig.modelKey];
  const totalPrice = car.basePrice + currentConfig.trimAddon;

  const downPaymentSum = totalPrice * (currentConfig.downPaymentPercent / 100);
  const loanPrincipal = totalPrice - downPaymentSum;

  // Monthly loan formula: P * (r / 12) / (1 - (1 + r / 12)^(-n))
  const monthlyRate = currentConfig.interestRateAnnual / 12;
  const n = currentConfig.termMonths;
  let monthlyPayment = 0;

  if (loanPrincipal > 0) {
    monthlyPayment = (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  }

  // Update displays
  document.getElementById("downPaymentPercentDisplay").innerHTML = 
    `${currentConfig.downPaymentPercent}% (<span id="downPaymentSumDisplay">${formatSum(downPaymentSum)}</span>)`;
  
  document.getElementById("calcTotalVehiclePrice").textContent = formatSum(totalPrice);

  const monthlyElem = document.getElementById("calcMonthlyPayment");
  monthlyElem.textContent = `${formatSum(monthlyPayment)} / OY`;

  // Gentle pulse animation via Motion
  if (window.Motion && Motion.animate) {
    Motion.animate(monthlyElem, { opacity: [0.7, 1], transform: ["scale(1.03)", "scale(1)"] }, { duration: 0.3 });
  }
}

function quickConfigure(modelKey) {
  selectModel(modelKey);
  const section = document.getElementById("configurator");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

function proceedFromConfigurator() {
  const car = VEHICLE_DATA[currentConfig.modelKey];
  const bookingSec = document.getElementById("booking");

  const selectModelInput = document.getElementById("selectModelInput");
  if (selectModelInput) {
    for (let opt of selectModelInput.options) {
      if (opt.value.includes(currentConfig.modelKey)) {
        selectModelInput.value = opt.value;
        break;
      }
    }
  }

  bookingSec.scrollIntoView({ behavior: "smooth" });
  showToast(`${car.fullName} buyurtma maydoniga biriktirildi`);
}

function syncModelSelection(val) {
  for (let key in VEHICLE_DATA) {
    if (val.includes(key)) {
      selectModel(key);
      break;
    }
  }
}

// -------------------------------------------------------------
// Official Booking & Contract Form Handler
// -------------------------------------------------------------

function handleOrderSubmit(e) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phoneNumber").value.trim();
  const model = document.getElementById("selectModelInput").value;
  const dealer = document.getElementById("selectDealerInput").value;

  if (!fullName || !phone) {
    showToast("Iltimos, barcha majburiy maydonlarni to'ldiring!");
    return;
  }

  // Generate Electronic Contract Code
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const contractCode = `UZM-2026-${randomSuffix}-${currentConfig.modelKey.substring(0, 2).toUpperCase()}`;

  document.getElementById("modalClientName").textContent = fullName;
  document.getElementById("modalVehicleName").textContent = model;
  document.getElementById("modalContractCode").textContent = contractCode;
  document.getElementById("modalDealerName").textContent = dealer;

  const modal = document.getElementById("orderSuccessModal");
  modal.classList.add("active");
}

function openOrderModal(modelName, price) {
  syncModelSelection(modelName);
  const bookingSec = document.getElementById("booking");
  bookingSec.scrollIntoView({ behavior: "smooth" });
  showToast(`${modelName} tanlandi. Ma'lumotlaringizni kiriting.`);
}

function closeOrderModal() {
  const modal = document.getElementById("orderSuccessModal");
  modal.classList.remove("active");
}

function printContractSimulation() {
  window.print();
}

// -------------------------------------------------------------
// Dealership Network Filter
// -------------------------------------------------------------

function filterDealers(region, btn) {
  document.querySelectorAll(".dealer-tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const cards = document.querySelectorAll(".dealer-card");
  cards.forEach(card => {
    const cardRegion = card.getAttribute("data-region");
    if (region === "all" || cardRegion === region) {
      card.style.display = "flex";
      if (window.Motion && Motion.animate) {
        Motion.animate(card, { opacity: [0, 1], transform: ["translateY(15px)", "translateY(0)"] }, { duration: 0.4 });
      }
    } else {
      card.style.display = "none";
    }
  });
}

// -------------------------------------------------------------
// Toast Notification
// -------------------------------------------------------------

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toastNotice");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// -------------------------------------------------------------
// Motion One Animations
// -------------------------------------------------------------

function initMotionAnimations() {
  if (typeof Motion === "undefined") return;

  try {
    // Subtle float animation on hero title
    Motion.animate(
      ".hero-title",
      { opacity: [0, 1], transform: ["translateY(30px)", "translateY(0px)"] },
      { duration: 1.2, easing: [0.16, 1, 0.3, 1] }
    );

    // Stagger buttons
    Motion.animate(
      ".hero-actions .btn-primary",
      { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
      { duration: 1, delay: Motion.stagger(0.15) }
    );
  } catch (err) {
    console.warn("Motion animation notice:", err);
  }
}

// -------------------------------------------------------------
// Ambient Hero Canvas Particle & Drift Light Engine
// -------------------------------------------------------------

function initAmbientHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 45;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  // Create particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2,
      opacity: Math.random() * 0.4 + 0.1
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Subtle soft light reflection at bottom center
    const radial = ctx.createRadialGradient(
      width / 2 + (mouseX - width / 2) * 0.05,
      height * 0.75,
      10,
      width / 2,
      height * 0.75,
      width * 0.55
    );
    radial.addColorStop(0, "rgba(255, 255, 255, 0.04)");
    radial.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Drift particles
    ctx.fillStyle = "#ffffff";
    for (let p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

// -------------------------------------------------------------
// Web Audio API Ambient Engine (Synthetic Luxury Hum)
// -------------------------------------------------------------

function toggleAmbientSound() {
  const audioIcon = document.getElementById("audioIcon");
  const audioBtn = document.getElementById("audioToggleBtn");

  if (!isAudioPlaying) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // Create low frequency deep luxury engine drone
      ambientOsc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      ambientGain = audioCtx.createGain();

      ambientOsc.type = "sine";
      ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // A1 note low rumble

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(110, audioCtx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, audioCtx.currentTime);

      ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + 2); // Soft volume

      ambientOsc.connect(filter);
      osc2.connect(filter);
      filter.connect(ambientGain);
      ambientGain.connect(audioCtx.destination);

      ambientOsc.start();
      osc2.start();

      isAudioPlaying = true;
      audioIcon.textContent = "OVOZ: YONIQ";
      audioBtn.classList.add("active");
      showToast("Atmosfera ovozi yoqildi");
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  } else {
    if (ambientGain && audioCtx) {
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (ambientOsc) ambientOsc.stop();
        isAudioPlaying = false;
      }, 500);
    } else {
      isAudioPlaying = false;
    }
    audioIcon.textContent = "OVOZ: O'CHIQ";
    audioBtn.classList.remove("active");
    showToast("Atmosfera ovozi o'chirildi");
  }
}
