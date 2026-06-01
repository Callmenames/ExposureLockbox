let gameData = null;

let currentStage = 0;
let currentGuess = "";

const STORAGE_KEY = "mastermind-progress";

const wheelOutcomes = [
    "UNLOCK",
    "UNLOCK",
    "SPIN AGAIN",
    "SPIN AGAIN",
    "SPIN AGAIN",
    "FAIL"
];

document.addEventListener("DOMContentLoaded", init);

function init() {

    const hash = window.location.hash.replace("#", "");

    if (!hash) {
        document.getElementById("loading").innerHTML =
            "<h2>No game data found.</h2>";
        return;
    }

    try {

        const json =
            LZString.decompressFromEncodedURIComponent(hash);

        gameData = JSON.parse(json);

        loadProgress();

    } catch (err) {

        console.error(err);

        document.getElementById("loading").innerHTML =
            "<h2>Invalid puzzle link.</h2>";

    }

}

function loadProgress() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (saved) {

        try {

            const progress =
                JSON.parse(saved);

            if (progress.hash === window.location.hash) {

                currentStage =
                    progress.currentStage || 0;

            }

        } catch (e) {}

    }

    document.getElementById("loading")
        .classList.add("hidden");

    if (currentStage === 0) {
        showCover();
    } else {
        loadStage();
    }

}

function saveProgress() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            hash: window.location.hash,
            currentStage: currentStage
        })
    );

}

function showCover() {

    document.getElementById("coverScreen")
        .classList.remove("hidden");

    document.getElementById("coverImage")
        .src = gameData.cover;

}

function startGame() {

    document.getElementById("coverScreen")
        .classList.add("hidden");

    currentStage = 1;

    saveProgress();

    loadStage();

}

function loadStage() {

    if (currentStage > 5) {
        showVictory();
        return;
    }

    currentGuess = "";

    const stage =
        gameData.stages[currentStage - 1];

    stage.remainingAttempts =
        stage.remainingAttempts ??
        stage.attempts;

    document.getElementById("gameScreen")
        .classList.remove("hidden");

    document.getElementById("wheelScreen")
        .classList.add("hidden");

    document.getElementById("stageTitle")
        .textContent =
        "Stage " + currentStage;

    document.getElementById("attempts")
        .textContent =
        stage.remainingAttempts;

    const img =
        document.getElementById("stageImage");

    img.src = stage.image;
    img.classList.add("blurred");

    document.getElementById("history")
        .innerHTML = "";

    updateGuessDisplay();

}

function updateGuessDisplay() {

    let display = currentGuess
        .split("")
        .join(" ");

    while (display.replace(/\s/g, "").length < 4) {
        display += " _";
    }

    document.getElementById("currentGuess")
        .textContent = display.trim();

}

function pressDigit(num) {

    if (currentGuess.length >= 4)
        return;

    currentGuess += num.toString();

    updateGuessDisplay();

}

function backspace() {

    currentGuess =
        currentGuess.slice(0, -1);

    updateGuessDisplay();

}

function clearGuess() {

    currentGuess = "";

    updateGuessDisplay();

}

function submitGuess() {

    if (currentGuess.length !== 4) {
        alert("Enter a 4 digit code.");
        return;
    }

    const stage =
        gameData.stages[currentStage - 1];

    const result =
        evaluateGuess(
            currentGuess,
            stage.code
        );

    addHistory(currentGuess, result);

    if (currentGuess === stage.code) {

        document.getElementById("gameScreen")
            .classList.add("hidden");

        document.getElementById("wheelScreen")
            .classList.remove("hidden");

        document.getElementById("wheelResult")
            .innerHTML = "";

        currentGuess = "";

        return;
    }

    stage.remainingAttempts--;

    document.getElementById("attempts")
        .textContent =
        stage.remainingAttempts;

    currentGuess = "";

    updateGuessDisplay();

    if (stage.remainingAttempts <= 0) {

        alert(
            "No attempts remaining. Restarting puzzle."
        );

        resetPuzzle();

    }

}

function evaluateGuess(
    guess,
    answer
) {

    const result =
        ["⬜", "⬜", "⬜", "⬜"];

    const answerUsed =
        [false, false, false, false];

    const guessUsed =
        [false, false, false, false];

    for (let i = 0; i < 4; i++) {

        if (guess[i] === answer[i]) {

            result[i] = "🟩";

            answerUsed[i] = true;
            guessUsed[i] = true;

        }

    }

    for (let i = 0; i < 4; i++) {

        if (guessUsed[i])
            continue;

        for (let j = 0; j < 4; j++) {

            if (answerUsed[j])
                continue;

            if (guess[i] === answer[j]) {

                result[i] = "🟨";

                answerUsed[j] = true;

                break;

            }

        }

    }

    return result;

}

function addHistory(
    guess,
    result
) {

    const row =
        document.createElement("div");

    row.className = "guess";

    row.textContent =
        guess + "   " +
        result.join(" ");

    document.getElementById("history")
        .prepend(row);

}

function spinWheel() {

    const outcome =
        wheelOutcomes[
            Math.floor(
                Math.random() *
                wheelOutcomes.length
            )
        ];

    document.getElementById("wheelResult")
        .innerHTML =
        "<strong>" +
        outcome +
        "</strong>";

    if (outcome === "SPIN AGAIN") {
        return;
    }

    if (outcome === "FAIL") {

        setTimeout(() => {

            alert(
                "Wheel failed. Re-solve the mastermind."
            );

            document.getElementById("wheelScreen")
                .classList.add("hidden");

            document.getElementById("gameScreen")
                .classList.remove("hidden");

        }, 1000);

        return;
    }

    if (outcome === "UNLOCK") {

        setTimeout(() => {

            revealStage();

        }, 1000);

    }

}

function revealStage() {

    const img =
        document.getElementById("stageImage");

    img.classList.remove("blurred");

    const stage =
        gameData.stages[currentStage - 1];

    document.getElementById("wheelScreen")
        .innerHTML =
        `
        <h2>Unlocked!</h2>

        <br>

        <img
            src="${stage.image}"
            style="
                max-width:100%;
                border-radius:10px;
            "
        >

        <br><br>

        <button
            class="primary"
            onclick="nextStage()"
        >
            Continue
        </button>
        `;

}

function nextStage() {

    currentStage++;

    saveProgress();

    document.getElementById("wheelScreen")
        .innerHTML =
        `
        <h2>Lock Solved</h2>
        <p>Spin the wheel</p>
        <br>
        <button
            class="primary"
            onclick="spinWheel()"
        >
            SPIN
        </button>
        <div id="wheelResult"></div>
        `;

    loadStage();

}

function showVictory() {

    localStorage.removeItem(STORAGE_KEY);

    document.getElementById("gameScreen")
        .classList.add("hidden");

    document.getElementById("wheelScreen")
        .classList.add("hidden");

    document.getElementById("victoryScreen")
        .classList.remove("hidden");

    document.getElementById("finalImage")
        .src =
        gameData.stages[4].image;

    const gallery =
        document.getElementById("gallery");

    gallery.innerHTML = "";

    gameData.stages.forEach(stage => {

        const img =
            document.createElement("img");

        img.src = stage.image;

        gallery.appendChild(img);

    });

}

function resetPuzzle() {

    localStorage.removeItem(STORAGE_KEY);

    location.reload();

}
