const title = document.getElementById("title");
const text = document.getElementById("text");
const spinner = document.getElementById("spinner");
const successIcon = document.getElementById("successIcon");
const closeBtn = document.getElementById("closeBtn");
const confirmBox = document.getElementById("confirmBox");

// Prevent direct access (optional but good UX)
const submitted = sessionStorage.getItem("payment_submitted");
if (!submitted) {
  window.location.href = "index.html";
}

// ✅ Get the SAME transaction ID created on the payment page
// (If missing for any reason, generate a fallback)
function generateTransactionId(){
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${year}-${rand}`;
}

const transactionId = sessionStorage.getItem("txn_id") || generateTransactionId();

function showStep(t, p){
  title.textContent = t;
  text.textContent = p;
}

function showSuccess(){
  spinner.style.display = "none";
  confirmBox.classList.add("successVibe");
  successIcon.classList.add("show");

  // ✅ Client sees the transaction ID ONLY after success
  title.textContent = "Payment successful!";
  text.textContent =
    "Your charge may appear on your statement within 5-10 business days\n\n" +
    `Transaction ID: ${transactionId}\n\n` +
    "You may now close this window.";

  closeBtn.classList.add("show");
}

// Realistic flow timing
setTimeout(() => {
  showStep("Verification…", "Checking card number and expiry date.");
}, 900);

setTimeout(() => {
  showStep("Authorization…", "Contacting your bank to approve the transaction.");
}, 2300);

setTimeout(() => {
  showStep("Processing transaction…", "Finalizing and confirming payment.");
}, 4200);

setTimeout(() => {
  showSuccess();
}, 5600);

// Close → reset flow
closeBtn.addEventListener("click", () => {
  sessionStorage.removeItem("payment_submitted");
  sessionStorage.removeItem("txn_id"); // ✅ clear ID too
  window.location.href = "index.html";
});