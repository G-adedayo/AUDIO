/* -----------------------------------
   Firebase Setup
----------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDKdJ6CsqOvtLUkg_7zr2LWAwM4XprQZ74",
  authDomain: "audio-8c5cb.firebaseapp.com",
  projectId: "audio-8c5cb",
  storageBucket: "audio-8c5cb.firebasestorage.app",
  messagingSenderId: "146695983243",
  appId: "1:146695983243:web:feb3508729d163c274c48e",
  measurementId: "G-CLZ78ZCDTP"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --------------------------------------
// TOAST
// --------------------------------------
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return; // prevents the null error

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Fade out after 3 seconds
    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/* -----------------------------------
   UI Switching
----------------------------------- */
function showLoginForm() {
    // Update header
    document.getElementById("auth-header").innerText = "Login";

    // Hide toggle buttons
    document.getElementById("auth-toggle").classList.add("hidden");

    // Show login form
    document.getElementById("login-form").classList.remove("hidden");

    // Hide signup form
    document.getElementById("signup-form").classList.add("hidden");
}

function showSignupForm() {
    // Update header
    document.getElementById("auth-header").innerText = "Sign Up";

    // Hide toggle buttons
    document.getElementById("auth-toggle").classList.add("hidden");

    // Show signup form
    document.getElementById("signup-form").classList.remove("hidden");

    // Hide login form
    document.getElementById("login-form").classList.add("hidden");
}

function goBackToAuthChoice() {
    // Reset header
    document.getElementById("auth-header").innerText = "Login or Sign Up";

    // Show toggle buttons again
    document.getElementById("auth-toggle").classList.remove("hidden");

    // Hide both forms
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("signup-form").classList.add("hidden");
}


/* -----------------------------------
   Password Visibility Toggle
----------------------------------- */
function togglePasswordVisibility(id) {
    const input = document.getElementById(id);
    if (!input) return;

    input.type = input.type === "password" ? "text" : "password";
}


/* -----------------------------------
   SIGN UP
----------------------------------- */
document.getElementById("signup-submit").onclick = async () => {
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirmPassword = document.getElementById("signup-confirm-password").value.trim();

    if (password !== confirmPassword) {
        showToast("Passwords do not match.", "warning");
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await user.sendEmailVerification();

        // Switch to verification screen
        document.getElementById("auth-screen").classList.add("hidden");
        document.getElementById("email-pending-screen").classList.remove("hidden");

    } catch (error) {
        showToast(error.message, "error");
    }
};


/* -----------------------------------
   CHECK EMAIL VERIFICATION
----------------------------------- */
async function checkVerification() {
    const user = auth.currentUser;
    if (!user) return;

    await user.reload();

    if (user.emailVerified) {
        window.location.href = "../HomePage/index.html";
        showToast("Email verified! Logging in...", "success");
    } else {
        showToast("Email not verified yet. Please check your inbox/spam.", "warning");
    }
}


/* -----------------------------------
   LOGIN
----------------------------------- */
async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            showToast("Please verify your email before logging in.", "warning");
            return;
        }

        // Redirect immediately to HomePage
        showToast("Login successful!", "success");
        window.location.href = "../HomePage/index.html";

    } catch (error) {
        showToast(error.message, "error");
    }
}


/* -----------------------------------
   PASSWORD RESET
----------------------------------- */
function handlePasswordReset() {
    const email = document.getElementById("login-email").value.trim();

    if (!email) {
        showToast("Enter your email first.", "warning");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => showToast("Password reset email sent.", "success"))
        .catch(err => showToast(err.message, "error"));
}