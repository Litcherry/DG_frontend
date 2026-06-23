import { createApp } from "vue";
import App from "./App.vue";
import "./styles/legacy.css";

function loadBrowserRuntime(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`运行库加载失败：${src}`));
    document.head.appendChild(script);
  });
}

async function bootstrapVueApp() {
  for (const src of [
    "/vendor/live2d/pixi.min.js",
    "/vendor/live2d/live2dcubismcore.min.js",
    "/vendor/live2d/pixi-live2d-display-cubism4.min.js",
  ]) {
    try {
      await loadBrowserRuntime(src);
    } catch (error) {
      console.warn(error);
    }
  }
  createApp(App).mount("#app");
}

bootstrapVueApp();
