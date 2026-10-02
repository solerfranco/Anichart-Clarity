# Anichart Clarity

Anichart Clarity is a lightweight Chrome Extension designed to declutter and enhance your experience on [Anichart.net](https://anichart.net/). If you use Anichart to track seasonal anime, this extension helps you focus strictly on what you're watching by filtering out the noise and adding helpful visual cues.

## ✨ Features

- **Watchlist Filtering:** Neatly hides all anime you haven't highlighted/marked, allowing you to focus only on your personal watchlist.
- **Sleek UI Toggle:** Adds a native-looking iOS-style toggle switch directly into Anichart's filter bar, letting you seamlessly switch between viewing your watchlist and viewing all seasonal anime.
- **Smooth Layout Animations:** Utilizes Chrome's native View Transitions API to ensure that when you filter your list, the remaining anime cards glide smoothly into place without rigid snapping.
- **Clearer Highlighting:** Applies a distinct dark green background to the footer of anime you have marked, making them pop out instantly when browsing the full seasonal list.
- **Emission Tags:** Adds convenient, color-coded tags right next to the episode text:
  - 🟢 **EMITTING:** The anime has started airing (Episode 2+).
  - 🟠 **UPCOMING:** The anime has yet to start (Episode 1).

## 🚀 Installation (Unpacked)

Since this extension is not currently published on the Chrome Web Store, you can install it manually by loading it as an unpacked extension:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the `Anichart Clarity` folder that contains the `manifest.json` file.
6. Open or refresh [Anichart](https://anichart.net/) and enjoy!

## 🛠️ Built With

- **Manifest V3:** The latest standard for Chrome Extensions.
- **Vanilla JavaScript:** Fast, lightweight DOM manipulation with `MutationObserver` to ensure it works flawlessly with Anichart's dynamic Vue.js frontend.
- **View Transitions API:** For buttery smooth layout reflows and CSS grid animations.

## 🤝 Contributing

Feel free to check the issues page or submit a pull request if you have ideas to make the extension even better.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
