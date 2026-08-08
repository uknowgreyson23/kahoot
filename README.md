# Kahoot Secret Room

This package uses the original downloaded frontend files and adds the hidden `ub 22189` behavior through `index.html`.

## Required structure

Keep these items together at the top level of the repository:

```text
index.html
controller/
googledatamanager/
shared-assets/
```

Do not rename the folders because `index.html` uses their existing paths.

## Secret code

Enter `ub 22189` in the Game PIN field. It will show:

1. Loading
2. Connecting
3. The hidden Secret Room

Other PINs continue through the original Kahoot frontend.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html` and all three folders above.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.

The original frontend still relies on Kahoot's online services and CDN for live game functionality.
