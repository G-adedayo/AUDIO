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
const historyList = document.getElementById("historyList");

// --------------------------------------
// TOAST FUNCTION
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
// HAMBURGER MENU TOGGLE
// --------------------------------------
menuIcon.onclick = () => {
    sideMenu.classList.toggle("hidden");
};

// --------------------------------------
// LOAD TRANSCRIPTS
// --------------------------------------
auth.onAuthStateChanged(async user => {
    if (!user) {
        showToast("You must be logged in", "error");
        return;
    }

    try {
        const snapshot = await db.collection("transcripts")
            .where("uid", "==", user.uid)
            .orderBy("timestamp", "desc")
            .get();

        if (snapshot.empty) {
            historyList.innerHTML = `<p class="empty">No transcripts saved yet.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;

            const name = data.name || "Untitled";
            const text = data.text || "";
            const preview = text.substring(0, 40) + (text.length > 40 ? "..." : "");
            const timestamp = data.timestamp?.toDate().toLocaleString() || "Unknown time";

            const item = document.createElement("div");
            item.className = "history-item";

            item.innerHTML = `
                <div class="item-header">
                    <h3 class="transcript-name" contenteditable="true" data-id="${id}">
                        ${name}
                    </h3>
                    <p class="timestamp">${timestamp}</p>
                </div>

                <p class="preview">${preview}</p>

                <button class="view-btn" onclick="viewMore('${id}')">View More</button>
            `;

            historyList.appendChild(item);
        });

        enableNameEditing();

    } catch (error) {
        console.error(error);
        showToast("Failed to load transcripts", "error");
    }
});

// --------------------------------------
// ENABLE NAME EDITING
// --------------------------------------
function enableNameEditing() {
    const editableNames = document.querySelectorAll(".transcript-name");

    editableNames.forEach(el => {
        el.addEventListener("blur", async () => {
            const newName = el.textContent.trim();
            const id = el.getAttribute("data-id");

            if (!newName) {
                showToast("Name cannot be empty", "error");
                return;
            }

            try {
                await db.collection("transcripts").doc(id).update({
                    name: newName
                });
                showToast("Name updated");
            } catch (err) {
                console.error(err);
                showToast("Failed to update name", "error");
            }
        });
    });
}

// --------------------------------------
// VIEW MORE (GO TO VIEW PAGE)
// --------------------------------------
function viewMore(id) {
    window.location.href = `../ViewPage/index.html?id=${id}`;
}