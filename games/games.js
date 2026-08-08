(function (global) {
  "use strict";

  const COLORS = [
    { id: "red", label: "Red", symbol: "◆" },
    { id: "blue", label: "Blue", symbol: "●" },
    { id: "yellow", label: "Yellow", symbol: "▲" },
    { id: "green", label: "Green", symbol: "■" }
  ];

  function init(root) {
    if (!root || root.dataset.gamesReady === "true") return;
    root.dataset.gamesReady = "true";

    root.innerHTML = `
      <section class="kg-shell" aria-labelledby="kgTitle">
        <header class="kg-header">
          <div>
            <h2 id="kgTitle">Kahoot! Arcade</h2>
            <p>Two quick games · no downloads needed</p>
          </div>
        </header>
        <div class="kg-content">
          <div class="kg-menu">
            <button class="kg-game-card" type="button" data-game="colors">
              <span class="kg-icon" aria-hidden="true">◆ ● ▲ ■</span>
              <strong>Color Quiz</strong>
              <small>Choose the correct Kahoot color. Ten questions—answer fast!</small>
            </button>
            <button class="kg-game-card" type="button" data-game="tap">
              <span class="kg-icon" aria-hidden="true">⚡</span>
              <strong>Tap Rush</strong>
              <small>How many times can you hit the button before ten seconds run out?</small>
            </button>
          </div>
          <div class="kg-stage" hidden></div>
        </div>
      </section>`;

    const menu = root.querySelector(".kg-menu");
    const stage = root.querySelector(".kg-stage");
    let activeTimer = null;
    let nextRoundTimer = null;

    function clearTimers() {
      if (activeTimer) global.clearInterval(activeTimer);
      if (nextRoundTimer) global.clearTimeout(nextRoundTimer);
      activeTimer = null;
      nextRoundTimer = null;
    }

    function showMenu() {
      clearTimers();
      stage.hidden = true;
      menu.hidden = false;
      stage.replaceChildren();
      menu.querySelector("button")?.focus();
    }

    function stageHeader(label, scoreText) {
      stage.innerHTML = `
        <div class="kg-stage-bar">
          <button class="kg-back" type="button">← All games</button>
          <strong class="kg-score">${scoreText}</strong>
        </div>
        <h3 class="kg-prompt">${label}</h3>`;
      stage.querySelector(".kg-back").addEventListener("click", showMenu);
    }

    function showResult(title, score, detail) {
      clearTimers();
      stageHeader(title, score);
      const result = document.createElement("div");
      result.innerHTML = `
        <p style="font-size:1.05rem;color:#655a70;margin:0 0 24px">${detail}</p>
        <button class="kg-answer" data-color="green" type="button" style="width:min(420px,100%)">Play again</button>`;
      result.querySelector("button").addEventListener("click", () => {
        if (title.includes("Color")) startColorQuiz();
        else startTapRush();
      });
      stage.appendChild(result);
    }

    function startColorQuiz() {
      clearTimers();
      menu.hidden = true;
      stage.hidden = false;
      let round = 0;
      let score = 0;
      let target = null;

      function nextQuestion() {
        if (round >= 10) {
          showResult("Color Quiz complete!", `${score} points`, `You answered ${score / 100} of 10 correctly.`);
          return;
        }

        round += 1;
        target = COLORS[Math.floor(Math.random() * COLORS.length)];
        stageHeader(`Choose ${target.label.toUpperCase()}`, `Round ${round}/10 · ${score} pts`);

        const answers = document.createElement("div");
        answers.className = "kg-answers";
        COLORS.forEach(color => {
          const button = document.createElement("button");
          button.className = "kg-answer";
          button.type = "button";
          button.dataset.color = color.id;
          button.textContent = `${color.symbol} ${color.label}`;
          button.addEventListener("click", () => {
            const correct = color.id === target.id;
            if (correct) score += 100;
            answers.querySelectorAll("button").forEach(answer => { answer.disabled = true; });
            stage.querySelector(".kg-prompt").textContent = correct ? "Correct! +100" : `Not quite—${target.label} was correct`;
            nextRoundTimer = global.setTimeout(nextQuestion, 650);
          });
          answers.appendChild(button);
        });
        stage.appendChild(answers);
      }

      nextQuestion();
    }

    function startTapRush() {
      clearTimers();
      menu.hidden = true;
      stage.hidden = false;
      let taps = 0;
      let startedAt = null;

      stageHeader("Tap to start!", "10.0 seconds");
      const tapButton = document.createElement("button");
      tapButton.className = "kg-tap";
      tapButton.type = "button";
      tapButton.textContent = "START";
      stage.appendChild(tapButton);

      tapButton.addEventListener("click", () => {
        if (!startedAt) {
          startedAt = performance.now();
          tapButton.textContent = "TAP!";
          activeTimer = global.setInterval(() => {
            const remaining = Math.max(0, 10 - (performance.now() - startedAt) / 1000);
            const score = stage.querySelector(".kg-score");
            if (score) score.textContent = `${remaining.toFixed(1)} seconds · ${taps} taps`;
            if (remaining <= 0) showResult("Tap Rush complete!", `${taps} taps`, taps >= 60 ? "Lightning fast!" : taps >= 35 ? "Great speed!" : "Nice run—try again and beat it!");
          }, 80);
          return;
        }
        taps += 1;
      });

      tapButton.focus();
    }

    menu.querySelectorAll("[data-game]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.game === "colors") startColorQuiz();
        else startTapRush();
      });
    });
  }

  global.KahootGames = { init };
})(window);
