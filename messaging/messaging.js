(function (global) {
  "use strict";

  const MESSAGE_KEY = "kahoot-secret-messages-v1";
  const NAME_KEY = "kahoot-secret-display-name";
  const senderId = global.crypto && global.crypto.randomUUID
    ? global.crypto.randomUUID()
    : `sender-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function loadMessages() {
    try {
      const stored = JSON.parse(global.localStorage.getItem(MESSAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored.slice(-100) : [];
    } catch {
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      global.localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch {
      // The chat still works for the current page if storage is unavailable.
    }
  }

  function init(root) {
    if (!root || root.dataset.messagingReady === "true") return;
    root.dataset.messagingReady = "true";

    root.innerHTML = `
      <section class="km-shell" aria-labelledby="kmTitle">
        <header class="km-header">
          <div>
            <h2 id="kmTitle">Kahoot! Messages</h2>
            <p>Same-device chat · saved only in this browser</p>
          </div>
          <button class="km-clear" type="button">Clear chat</button>
        </header>
        <div class="km-list" role="log" aria-live="polite" aria-label="Messages"></div>
        <form class="km-form">
          <label for="kmName" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Display name</label>
          <input class="km-input km-name" id="kmName" maxlength="20" autocomplete="nickname" placeholder="Your name" />
          <label for="kmText" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Message</label>
          <input class="km-input km-text" id="kmText" maxlength="280" autocomplete="off" placeholder="Type a message…" required />
          <button class="km-send" type="submit">Send</button>
        </form>
      </section>`;

    const list = root.querySelector(".km-list");
    const form = root.querySelector(".km-form");
    const nameInput = root.querySelector(".km-name");
    const textInput = root.querySelector(".km-text");
    const clearButton = root.querySelector(".km-clear");
    let messages = loadMessages();
    let channel = null;

    try {
      nameInput.value = global.localStorage.getItem(NAME_KEY) || "Player";
    } catch {
      nameInput.value = "Player";
    }

    function render() {
      list.replaceChildren();

      if (messages.length === 0) {
        const empty = document.createElement("p");
        empty.className = "km-empty";
        empty.textContent = "No messages yet. Start the conversation!";
        list.appendChild(empty);
        return;
      }

      messages.forEach(message => {
        const item = document.createElement("article");
        item.className = `km-message${message.senderId === senderId ? " km-own" : ""}`;

        const bubble = document.createElement("div");
        bubble.className = "km-bubble";
        bubble.textContent = message.text;

        const meta = document.createElement("p");
        meta.className = "km-meta";
        const time = new Date(message.createdAt);
        meta.textContent = `${message.name} · ${Number.isNaN(time.valueOf()) ? "now" : time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

        item.append(bubble, meta);
        list.appendChild(item);
      });

      list.scrollTop = list.scrollHeight;
    }

    function sync(type) {
      saveMessages(messages);
      if (channel) channel.postMessage({ type });
      render();
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const name = nameInput.value.trim().slice(0, 20) || "Player";
      const text = textInput.value.trim().slice(0, 280);
      if (!text) return;

      try { global.localStorage.setItem(NAME_KEY, name); } catch {}

      messages.push({
        id: global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : `message-${Date.now()}`,
        senderId,
        name,
        text,
        createdAt: new Date().toISOString()
      });
      textInput.value = "";
      sync("messages-changed");
      textInput.focus();
    });

    clearButton.addEventListener("click", () => {
      messages = [];
      sync("messages-cleared");
      textInput.focus();
    });

    if ("BroadcastChannel" in global) {
      channel = new BroadcastChannel("kahoot-secret-messages");
      channel.addEventListener("message", () => {
        messages = loadMessages();
        render();
      });
    }

    global.addEventListener("storage", event => {
      if (event.key !== MESSAGE_KEY) return;
      messages = loadMessages();
      render();
    });

    render();
  }

  global.KahootMessaging = { init };
})(window);
