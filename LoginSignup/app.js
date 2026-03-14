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
        alert("Passwords do not match.");
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
        alert(error.message);
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
    } else {
        alert("Email not verified yet. Please check your inbox/spam.");
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
            alert("Please verify your email before logging in.");
            return;
        }

        // Redirect immediately to HomePage
        window.location.href = "../HomePage/index.html";

    } catch (error) {
        alert(error.message);
    }
}


/* -----------------------------------
   PASSWORD RESET
----------------------------------- */
function handlePasswordReset() {
    const email = document.getElementById("login-email").value.trim();

    if (!email) {
        alert("Enter your email first.");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent."))
        .catch(err => alert(err.message));
}