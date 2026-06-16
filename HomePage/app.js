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

const recordBtn = document.getElementById("recordBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");

const englishText = document.getElementById("englishText");
const translatedText = document.getElementById("translatedText");

const languageSelect = document.getElementById("languageSelect");
const translationToggle = document.getElementById("translationToggle");

const namePopup = document.getElementById("namePopup");
const nameInput = document.getElementById("nameInput");
const confirmNameBtn = document.getElementById("confirmNameBtn");
const cancelNameBtn = document.getElementById("cancelNameBtn");

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
// SPEECH RECOGNITION
// --------------------------------------
let recognition;
let isRecording = false;
let savedEnglish = "";
let savedTranslated = "";

const QUESTION_WORDS = new Set([
    "who","what","where","when","why","which","how",
    "do","does","did","is","are","am","was","were",
    "have","has","had","can","could","will","would",
    "should","must","may","might"
]);

function finalizeSentence(text) {
    const cleaned = cleanText(text);
    if (!cleaned) return "";

    const sentence = cleaned.replace(/[.!?]+$/g, "").trim();
    const firstWord = sentence.split(/\s+/)[0]?.toLowerCase() || "";
    const ending = QUESTION_WORDS.has(firstWord) ? "?" : ".";

    return sentence + ending + " ";
}

if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-GB"; // British English
    recognition.continuous = true;
    recognition.interimResults = true;
} else {
    showToast("Speech recognition not supported", "error");
}

// --------------------------------------
// AUTOCORRECT CLEANUP
// --------------------------------------
function cleanText(text) {
    if (!text) return "";

    text = text.trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);

    return text.replace(/\s+/g, " ");
}

// --------------------------------------
// LIVE TRANSLATION (LIBRETRANSLATE)
// --------------------------------------
async function translateLive(text, targetLang) {
    if (targetLang === "none") return "";

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
            return "";
        }

        return cleanText(data.translatedText);

    } catch (err) {
        console.error("LibreTranslate error:", err);
        showToast("Translation error", "error");
        return "";
    }
}

// --------------------------------------
// SHOW/HIDE TRANSLATED COLUMN
// --------------------------------------
function updateTranslationVisibility() {
    const translatedBox = document.querySelector(".text-columns .text-box:last-child");

    if (!translationToggle.checked || languageSelect.value === "none") {
        translatedBox.classList.add("hidden");
    } else {
        translatedBox.classList.remove("hidden");
    }
}

translationToggle.onchange = updateTranslationVisibility;
languageSelect.onchange = updateTranslationVisibility;
updateTranslationVisibility();

// --------------------------------------
// START / STOP RECORDING
// --------------------------------------
recordBtn.onclick = () => {
    if (!recognition) return;

    if (!isRecording) {
        recognition.start();
        isRecording = true;
        recordBtn.textContent = "🛑 Stop Recording";
        showToast("Recording started");
    } else {
        recognition.stop();
        isRecording = false;
        recordBtn.textContent = "🎤 Start Recording";
        showToast("Recording stopped");
    }
};

// --------------------------------------
// HANDLE SPEECH RESULTS
// --------------------------------------
recognition.onresult = async (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
        } else {
            interimTranscript += transcript + " ";
        }
    }

    // 1. HANDLE FINAL ENGLISH + FINAL TRANSLATION
    if (finalTranscript.trim().length > 0) {
        const finalized = finalizeSentence(finalTranscript);
        savedEnglish += finalized;

        if (translationToggle.checked && languageSelect.value !== "none") {
            const translated = await translateLive(finalized.trim(), languageSelect.value);
            savedTranslated += translated + "\n";
        }
    }

    // 2. BUILD ENGLISH DISPLAY (final + interim)
    let displayEnglish = savedEnglish;
    const interimTrim = interimTranscript.trim();

    if (interimTrim.length > 0) {
        if (displayEnglish && !/\s$/.test(displayEnglish)) {
            displayEnglish += " ";
        }
        displayEnglish += interimTrim;
    }

    englishText.value = displayEnglish;

    // 3. BUILD TRANSLATION DISPLAY (final + interim)
    if (translationToggle.checked && languageSelect.value !== "none") {
        if (interimTrim.length > 0) {
            const liveTranslated = await translateLive(interimTrim, languageSelect.value);
            translatedText.value = savedTranslated + liveTranslated;
        } else {
            translatedText.value = savedTranslated;
        }
    }
};


// --------------------------------------
// CLEAR BUTTON
// --------------------------------------
clearBtn.onclick = () => {
    englishText.value = "";
    translatedText.value = "";

    // These are the important ones
    savedEnglish = "";
    savedTranslated = "";

    showToast("Cleared");
};

// --------------------------------------
// SAVE TRANSCRIPT (POPUP)
// --------------------------------------
saveBtn.onclick = () => {
    namePopup.classList.remove("hidden");
    nameInput.value = "";
    nameInput.focus();
};

cancelNameBtn.onclick = () => {
    namePopup.classList.add("hidden");
    nameInput.value = "";
};

confirmNameBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const english = englishText.value.trim();
    const translated = translatedText.value.trim();
    const lang = languageSelect.value;

    if (!name) {
        showToast("Please enter a name", "error");
        return;
    }

    if (!english) {
        showToast("Nothing to save", "error");
        return;
    }

    try {
        await db.collection("transcripts").add({
            uid: auth.currentUser.uid,
            name: name,
            text: english,
            translated: translated || "",
            language: lang,
            timestamp: new Date()
        });

        showToast("Transcript saved");
        namePopup.classList.add("hidden");
        nameInput.value = "";

    } catch (err) {
        console.error(err);
        showToast("Failed to save", "error");
    }
};