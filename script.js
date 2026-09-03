let games = [];

async function loadGames() {
    const container = document.getElementById("games");

    try {
        const response = await fetch("games.json");

        if (!response.ok) {
            throw new Error("games.json could not be loaded");
        }

        games = await response.json();

        renderGames();

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="loading">
                ❌ Failed to load games.
                <br><br>
                Make sure games.json exists in the main folder.
            </div>
        `;
    }
}

function renderGames() {

    const container = document.getElementById("games");

    if (!games.length) {
        container.innerHTML = `
            <div class="loading">
                No games have been added yet.
            </div>
        `;
        return;
    }

    container.innerHTML = games.map(game => `
        <div class="game-card">

            <div class="game-icon">
                ${escapeHTML(game.icon || "🎮")}
            </div>

            <h2>
                ${escapeHTML(game.name)}
            </h2>

            <p>
                ${escapeHTML(game.description || "")}
            </p>

            <div class="category">
                ${escapeHTML(game.category || "Other")}
            </div>

            <br>

            <button
                class="play-button"
                onclick="playGame('${escapeQuotes(game.file)}')">

                ▶ PLAY NOW

            </button>

        </div>
    `).join("");
}

function playGame(file) {

    if (!file) {
        alert("Game file not found.");
        return;
    }

    window.location.href = file;
}

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeQuotes(text) {

    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

loadGames();
