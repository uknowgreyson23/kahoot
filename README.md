# Kahoot Secret Web Portal

This package uses the original downloaded frontend files and adds a hidden Kahoot-styled web portal through `index.html`.

## Required structure

Keep these items together at the top level of the repository:

```text
index.html
controller/
googledatamanager/
shared-assets/
login-info/
messaging/
games/
```

Do not rename the folders because `index.html` uses their existing paths.

## Secret code

Enter `ub 22189` in the Game PIN field. It will show:

1. Loading
2. Connecting
3. The hidden Kahoot Web portal

Other PINs continue through the original Kahoot frontend.

## Login and sign up

After the secret code, visitors can create a username/password account or log in to an existing account on that browser.

- Accounts are device-local and do not synchronize between devices.
- Passwords are salted and hashed with PBKDF2/SHA-256 before being saved.
- Readable passwords are never stored or sent over the network.
- The login session lasts for the current browser tab and includes a **Log out** button.

## Web portal behavior

The secret area now has three apps:

- **Browser:** address/search bar, navigation controls, quick links, embedded viewer, and an **Open new tab** fallback.
- **Messaging:** same-device messages saved in local browser storage and synchronized between tabs on that device.
- **Games:** playable **Color Quiz** and **Tap Rush** mini-games.

This is a static web portal, not a network proxy. GitHub Pages cannot relay traffic or bypass network restrictions. Websites may also block iframe embedding; use **Open new tab** for those sites.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html` and all three folders above.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.

The original frontend still relies on Kahoot's online services and CDN for live game functionality.
