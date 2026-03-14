// --------------------------------------
// FIREBASE
// --------------------------------------
const db = firebase.firestore();
const auth = firebase.auth();

// --------------------------------------
// UI ELEMENTS
// --------------------------------------
const menuIcon = document.getElementById("menuIcon");
const sideMenu = document.getElementById("sideMenu");

const nameEl = document.getElementById("transcriptName");
const timestampEl = document.getElementById("timestamp");
const fullTextEl = document.getElementById("fullText");

const deleteBtn = document.getElementById("deleteBtn");
const translateBtn = document.getElementById("translateBtn");

// POPUPS
const deletePopup = document.getElementById("deletePopup");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const translatePopup = document.getElementById("translatePopup");
const confirmTranslateBtn = document.getElementById("confirmTranslateBtn");
const cancelTranslateBtn = document.getElementById("cancelTranslateBtn");
const languageSelect = document.getElementById("languageSelect");

// --------------------------------------
// LANGUAGE NAME MAP
// --------------------------------------
const languageNames = {
    es: "Spanish",
    fr: "French",
    de: "German",
    ar: "Arabic",
    zh: "Chinese",
    hi: "Hindi",
    pt: "Portuguese"
};

// --------------------------------------
// TOAST
// --------------------------------------
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast show " + type;

    setTimeout(() => {
        toast.className = "toast hidden";
    }, 2500);
}

// --------------------------------------
// MENU
// --------------------------------------
menuIcon.onclick = () => {
    sideMenu.classList.toggle("hidden");
};

// --------------------------------------
// GET TRANSCRIPT ID
// --------------------------------------
const params = new URLSearchParams(window.location.search);
const transcriptId = params.get("id");

// --------------------------------------
// LOAD TRANSCRIPT
// --------------------------------------
auth.onAuthStateChanged(async user => {
    if (!user) return showToast("You must be logged in", "error");

    try {
        const doc = await db.collection("transcripts").doc(transcriptId).get();
        if (!doc.exists) return showToast("Transcript not found", "error");

        const data = doc.data();

        nameEl.textContent = data.name;
        fullTextEl.value = data.text;
        timestampEl.textContent = data.timestamp.toDate().toLocaleString();

        enableNameEditing();

    } catch (err) {
        console.error(err);
        showToast("Failed to load transcript", "error");
    }
});

// --------------------------------------
// NAME EDITING
// --------------------------------------
function enableNameEditing() {
    nameEl.addEventListener("blur", async () => {
        const newName = nameEl.textContent.trim();
        if (!newName) return showToast("Name cannot be empty", "error");

        try {
            await db.collection("transcripts").doc(transcriptId).update({ name: newName });
            showToast("Name updated");
        } catch (err) {
            console.error(err);
            showToast("Failed to update name", "error");
        }
    });
}

// --------------------------------------
// DELETE POPUP
// --------------------------------------
deleteBtn.onclick = () => deletePopup.classList.remove("hidden");
cancelDeleteBtn.onclick = () => deletePopup.classList.add("hidden");

confirmDeleteBtn.onclick = async () => {
    try {
        await db.collection("transcripts").doc(transcriptId).delete();
        showToast("Deleted");

        setTimeout(() => {
        window.location.href = "../HistoryPage/index.html";
        }, 800);

    } catch (err) {
        console.error(err);
        showToast("Failed to delete", "error");
    }

    deletePopup.classList.add("hidden");
};

// --------------------------------------
// TRANSLATION POPUP
// --------------------------------------
translateBtn.onclick = () => translatePopup.classList.remove("hidden");
cancelTranslateBtn.onclick = () => translatePopup.classList.add("hidden");

// --------------------------------------
// LIBRETRANSLATE VERSION (NO LIMITS)
// --------------------------------------
confirmTranslateBtn.onclick = async () => {
    const targetLang = languageSelect.value;
    const text = fullTextEl.value.trim();

    if (!text) {
        showToast("Nothing to translate", "error");
        translatePopup.classList.add("hidden");
        return;
    }

    showToast("Translating...");

    try {
        const response = await fetch("https://libretranslate-production-b8d0.up.railway.app/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: text,
                source: "en",
                target: targetLang,
                format: "text"
            })
        });

        const data = await response.json();

        if (!data.translatedText) {
            console.error("Translation error:", data);
            showToast("Translation failed", "error");
            translatePopup.classList.add("hidden");
            return;
        }

        const translatedFullText = data.translatedText.trim();
        fullTextEl.value = translatedFullText;

        showToast("Translated successfully");

        // --------------------------------------
        // SAVE TRANSLATED VERSION AS NEW TRANSCRIPT
        // --------------------------------------
        try {
            const originalName = nameEl.textContent.trim();
            const langName = languageNames[targetLang] || targetLang;

            await db.collection("transcripts").add({
                uid: auth.currentUser.uid,
                name: `${originalName} (${langName})`,
                text: translatedFullText,
                timestamp: new Date()
            });

            showToast(`Saved as ${originalName} (${langName})`);
        } catch (err) {
            console.error(err);
            showToast("Failed to save translated version", "error");
        }

    } catch (err) {
        console.error(err);
        showToast("Translation failed", "error");
    }

    translatePopup.classList.add("hidden");
};