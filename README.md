# No Suggestions & No Infinite Scroll (Brave / Chromium Extension)

A strict, always-on Manifest V3 browser extension for Brave / Chromium that blocks algorithmic feeds, video suggestions, and infinite scrolling across **YouTube**, **Instagram**, **X (Twitter)**, and **Reddit** while keeping essential utility working.

## Features

- **No Popup / No Quick Toggle**: There is no popup menu to tempt you into turning feeds back on. The only way to disable it is through `brave://extensions`.
- **YouTube**:
  - Hides the homepage recommendation feed while keeping the Search bar and Subscriptions accessible.
  - Hides all in-player video suggestions (endscreen grids, modern fullscreen grids, creator endscreen cards, pause overlays, info cards, and Autoplay "Up Next" overlays) and automatically turns off Autoplay.
  - Hides the watch-page related videos sidebar (`#related`) and Shorts shelves/tabs across YouTube.
  - **Direct Shorts URLs (`/shorts/<id>`)**: Allows a directly opened Short video to load and play, but strips all subsequent queued Shorts and blocks mouse wheel, touch swipe, and arrow keys from scrolling to another Short.
- **Instagram**:
  - Keeps your friends' **Stories tray** at the top of the home screen and **Direct Messages** (`/direct/`) working.
  - Pushes the home post feed and loading sentinels `10,000vh` offscreen so `IntersectionObserver` never triggers background pagination requests, and blocks `/reels/` and `/explore/`.
- **X (Twitter)**:
  - Keeps Search, Notifications, Direct Messages, and direct post links (`/status/...`) working.
  - Blocks the Home timeline ("For you" / "Following"), Explore feed, and sidebar Trends / "Who to follow".
- **Reddit**:
  - Keeps Search, Messages/Chat, and specific post comment threads (`/r/.../comments/...`) working.
  - Blocks infinite feeds on Home, Popular, All, and subreddit pages, plus the "More posts you may like" feed below comment threads.

## Installation (Brave / Chrome / Edge)

1. Clone this repository:
   ```bash
   git clone https://github.com/Zal2024/no-suggestions-extension.git
   ```
   *(Note for Linux Flatpak Brave users: clone the folder inside `~/Downloads` or `~/Desktop` so the Flatpak sandbox can resolve the path natively.)*
2. Open `brave://extensions` (or `chrome://extensions`).
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the cloned folder.
