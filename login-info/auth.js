(function (global) {
  "use strict";

  const ACCOUNTS_KEY = "kahoot-secret-accounts-v1";
  const SESSION_KEY = "kahoot-secret-current-user";
  const ITERATIONS = 120000;
  const encoder = new TextEncoder();

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return global.btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = global.atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }

  function loadAccounts() {
    try {
      const accounts = JSON.parse(global.localStorage.getItem(ACCOUNTS_KEY) || "[]");
      return Array.isArray(accounts) ? accounts : [];
    } catch {
      return [];
    }
  }

  function saveAccounts(accounts) {
    global.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function normalizeUsername(username) {
    return String(username || "").trim().toLowerCase();
  }

  async function hashPassword(password, salt) {
    if (!global.crypto || !global.crypto.subtle) throw new Error("Secure password storage is not supported in this browser.");
    const keyMaterial = await global.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await global.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return new Uint8Array(bits);
  }

  function hashesMatch(first, second) {
    if (first.length !== second.length) return false;
    let difference = 0;
    for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
    return difference === 0;
  }

  function init(root, options = {}) {
    if (!root) return null;
    if (root.authController) return root.authController;

    root.innerHTML = `
      <section class="ka-auth-card" aria-labelledby="kaAuthTitle">
        <h1 class="ka-auth-brand" id="kaAuthTitle">Kahoot! ID</h1>
        <p class="ka-auth-copy">Log in to open Browser, Messaging, and Games.</p>
        <div class="ka-auth-tabs" role="tablist" aria-label="Account action">
          <button class="ka-auth-tab" type="button" role="tab" data-auth-mode="login" aria-selected="true">Log in</button>
          <button class="ka-auth-tab" type="button" role="tab" data-auth-mode="signup" aria-selected="false">Sign up</button>
        </div>
        <form class="ka-auth-form">
          <div class="ka-auth-field">
            <label for="kaUsername">Username</label>
            <input class="ka-auth-input" id="kaUsername" name="username" minlength="3" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false" required />
          </div>
          <div class="ka-auth-field">
            <label for="kaPassword">Password</label>
            <input class="ka-auth-input" id="kaPassword" name="password" type="password" minlength="6" maxlength="128" autocomplete="current-password" required />
          </div>
          <div class="ka-auth-field ka-confirm-field" hidden>
            <label for="kaConfirm">Confirm password</label>
            <input class="ka-auth-input" id="kaConfirm" name="confirmPassword" type="password" minlength="6" maxlength="128" autocomplete="new-password" />
          </div>
          <button class="ka-auth-submit" type="submit">Log in</button>
          <p class="ka-auth-status" role="alert" aria-live="polite"></p>
        </form>
        <p class="ka-auth-note">Device-local account: your username and a salted password hash are saved in this browser. Your readable password is never stored or sent anywhere.</p>
      </section>`;

    const tabs = [...root.querySelectorAll("[data-auth-mode]")];
    const form = root.querySelector(".ka-auth-form");
    const usernameInput = root.querySelector("#kaUsername");
    const passwordInput = root.querySelector("#kaPassword");
    const confirmInput = root.querySelector("#kaConfirm");
    const confirmField = root.querySelector(".ka-confirm-field");
    const submitButton = root.querySelector(".ka-auth-submit");
    const status = root.querySelector(".ka-auth-status");
    let mode = "login";

    function setStatus(message, success = false) {
      status.textContent = message;
      status.classList.toggle("ka-success", success);
    }

    function setMode(nextMode) {
      mode = nextMode === "signup" ? "signup" : "login";
      tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.authMode === mode)));
      confirmField.hidden = mode !== "signup";
      confirmInput.required = mode === "signup";
      passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
      submitButton.textContent = mode === "signup" ? "Create account" : "Log in";
      form.reset();
      setStatus("");
      usernameInput.focus();
    }

    function getCurrentUser() {
      try { return global.sessionStorage.getItem(SESSION_KEY); }
      catch { return null; }
    }

    function setCurrentUser(username) {
      global.sessionStorage.setItem(SESSION_KEY, username);
      if (typeof options.onAuthenticated === "function") options.onAuthenticated(username);
    }

    function logout() {
      try { global.sessionStorage.removeItem(SESSION_KEY); } catch {}
      setMode("login");
      if (typeof options.onLoggedOut === "function") options.onLoggedOut();
    }

    tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.authMode)));

    form.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("");
      const username = usernameInput.value.trim();
      const usernameKey = normalizeUsername(username);
      const password = passwordInput.value;

      if (!/^[a-z0-9_-]{3,20}$/i.test(username)) {
        setStatus("Username must be 3–20 letters, numbers, underscores, or dashes.");
        return;
      }
      if (password.length < 6) {
        setStatus("Password must be at least 6 characters.");
        return;
      }
      if (mode === "signup" && password !== confirmInput.value) {
        setStatus("The passwords do not match.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = mode === "signup" ? "Creating…" : "Checking…";

      try {
        const accounts = loadAccounts();
        const existing = accounts.find(account => account.usernameKey === usernameKey);

        if (mode === "signup") {
          if (existing) {
            setStatus("That username already exists on this device.");
            return;
          }

          const salt = global.crypto.getRandomValues(new Uint8Array(16));
          const hash = await hashPassword(password, salt);
          accounts.push({
            username,
            usernameKey,
            salt: bytesToBase64(salt),
            passwordHash: bytesToBase64(hash),
            createdAt: new Date().toISOString()
          });
          saveAccounts(accounts);
          setStatus("Account created! Opening your portal…", true);
          setCurrentUser(username);
          return;
        }

        if (!existing) {
          setStatus("Username or password is incorrect.");
          return;
        }

        const attemptedHash = await hashPassword(password, base64ToBytes(existing.salt));
        if (!hashesMatch(attemptedHash, base64ToBytes(existing.passwordHash))) {
          setStatus("Username or password is incorrect.");
          return;
        }

        setStatus("Login successful!", true);
        setCurrentUser(existing.username);
      } catch (error) {
        setStatus(error && error.message ? error.message : "Login could not be completed in this browser.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = mode === "signup" ? "Create account" : "Log in";
      }
    });

    const controller = { getCurrentUser, logout, showLogin: () => setMode("login"), focus: () => usernameInput.focus() };
    root.authController = controller;
    return controller;
  }

  global.KahootAuth = { init };
})(window);
