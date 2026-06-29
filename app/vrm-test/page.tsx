"use client";

import { useEffect, useRef, useState } from "react";

const vrmFrameHtml = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #071712;
    }

    body {
      background:
        radial-gradient(circle at 50% 18%, rgba(50, 200, 160, .24), transparent 32%),
        linear-gradient(180deg, rgba(255, 255, 255, .10), rgba(255, 255, 255, .03));
      color: #fff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    #live2dCanvas {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 2;
    }

    #notice {
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 18px;
      z-index: 3;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 18px;
      background: rgba(0, 0, 0, .34);
      color: rgba(255, 255, 255, .86);
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.6;
      backdrop-filter: blur(14px);
      pointer-events: none;
      white-space: pre-wrap;
    }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.177.0/examples/jsm/",
        "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3/lib/three-vrm.module.min.js",
        "@pixiv/three-vrm-animation": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm-animation@3/lib/three-vrm-animation.module.min.js"
      }
    }
  </script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <canvas id="live2dCanvas"></canvas>
  <div id="notice">Starting VRM renderer...</div>
  <script src="/vendor/live2d/pixi.min.js"></script>
  <script src="/vendor/live2d/live2dcubismcore.min.js"></script>
  <script src="/vendor/live2d/pixi-live2d-display-cubism4.min.js"></script>
  <script type="module">
    const canvas = document.getElementById("canvas");
    const live2dCanvas = document.getElementById("live2dCanvas");
    const notice = document.getElementById("notice");
    const models = {
      default: { label: "default_2963", url: "/assets/vrm/default_2963.vrm", fallbackSize: 5350040 },
      default2704: { label: "default_2704", url: "/assets/vrm/default_2704.vrm", fallbackSize: 5548212 },
      model7533: { label: "7533417284697534698", url: "/assets/vrm/7533417284697534698.vrm", fallbackSize: 15282092 },
      karmesi: { label: "Karmesi", url: "/assets/vrm/karmesi.vrm", fallbackSize: 18748576 }
    };
    const motions = {
      fullBody: { label: "展示全身", url: "/assets/vrm/animations/VRMA_01.vrma" },
      greeting: { label: "打招呼", url: "/assets/vrm/animations/VRMA_02.vrma" },
      vSign: { label: "比 V 手势", url: "/assets/vrm/animations/VRMA_03.vrma" },
      point: { label: "指物动作（不推荐）", url: "/assets/vrm/animations/VRMA_04.vrma" },
      turn: { label: "原地转圈", url: "/assets/vrm/animations/VRMA_05.vrma" },
      pose: { label: "模特摆拍", url: "/assets/vrm/animations/VRMA_06.vrma" },
      stretch: { label: "屈伸运动", url: "/assets/vrm/animations/VRMA_07.vrma" }
    };
    let activeModelKey = "default";
    let activeModel = models[activeModelKey];
    const live2dModelUrl = "/assets/live2d/tsubaki/runtime/tsubaki.model3.json";

    let THREE = null;
    let GLTFLoader = null;
    let OrbitControls = null;
    let VRMLoaderPlugin = null;
    let VRMUtils = null;
    let VRMAnimationLoaderPlugin = null;
    let createVRMAnimationClip = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let controls = null;
    let clock = null;
    let currentVrm = null;
    let mixer = null;
    let activeAction = null;
    let activeMotionKey = null;
    const motionClipCache = new Map();
    let mode = "idle";
    let blinkAt = 0;
    let testCube = null;

    function send(type, payload) {
      parent.postMessage({ source: "dg-vrm-test", type, payload }, "*");
    }

    function setStatus(text) {
      notice.textContent = text;
      send("status", text);
    }

    function errorText(error) {
      if (!error) return "unknown error";
      return error.message || error.type || String(error);
    }

    window.addEventListener("error", (event) => {
      setStatus("Runtime error: " + errorText(event.error || event.message));
    });

    window.addEventListener("unhandledrejection", (event) => {
      setStatus("Promise error: " + errorText(event.reason));
    });

    window.addEventListener("message", (event) => {
      if (event.data?.source !== "dg-vrm-test-host") return;
      if (event.data.type === "mode") mode = event.data.payload || "idle";
      if (event.data.type === "model") switchModel(event.data.payload);
      if (event.data.type === "motion") playMotion(event.data.payload);
    });

    async function importRuntime() {
      setStatus("Loading Three.js runtime...");
      const threeModule = await import("three");
      THREE = threeModule;

      setStatus("Loading Three.js helpers...");
      const gltfModule = await import("three/addons/loaders/GLTFLoader.js");
      const controlsModule = await import("three/addons/controls/OrbitControls.js");
      GLTFLoader = gltfModule.GLTFLoader;
      OrbitControls = controlsModule.OrbitControls;

      setStatus("Loading pixiv three-vrm...");
      const vrmModule = await import("@pixiv/three-vrm");
      VRMLoaderPlugin = vrmModule.VRMLoaderPlugin;
      VRMUtils = vrmModule.VRMUtils;

      if (!VRMLoaderPlugin || !VRMUtils) {
        throw new Error("three-vrm module loaded, but VRMLoaderPlugin or VRMUtils is missing");
      }

      try {
        setStatus("Loading pixiv VRMA animation runtime...");
        const vrmaModule = await import("@pixiv/three-vrm-animation");
        VRMAnimationLoaderPlugin = vrmaModule.VRMAnimationLoaderPlugin;
        createVRMAnimationClip = vrmaModule.createVRMAnimationClip;
      } catch (error) {
        console.warn("VRMA runtime unavailable; manual motions will be used.", error);
      }
    }

    async function checkModelFile() {
      setStatus("Checking local VRM file...");
      const response = await fetch(activeModel.url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Cannot read " + activeModel.url + " (" + response.status + ")");
      }
      const size = Number(response.headers.get("content-length") || 0);
      setStatus(size > 0 ? "Local VRM file is ready: " + Math.round(size / 1024 / 1024) + "MB" : "Local VRM file is reachable");
    }

    function createScene() {
      setStatus("Creating WebGL scene...");
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor(0x071712, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.set(0, 1.28, 3.25);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 1.18, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 1.4;
      controls.maxDistance = 8;

      scene.add(new THREE.AmbientLight(0xdfeee8, 0.58));
      scene.add(new THREE.HemisphereLight(0xf4fff9, 0x17352f, 0.92));

      const key = new THREE.DirectionalLight(0xffead2, 0.92);
      key.position.set(1.8, 2.8, 2.6);
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x8ee7ff, 0.55);
      rim.position.set(-2.5, 2, -1.4);
      scene.add(rim);

      const faceFill = new THREE.DirectionalLight(0xffffff, 0.36);
      faceFill.position.set(0, 1.6, 3.4);
      scene.add(faceFill);

      const grid = new THREE.GridHelper(2.8, 16, 0x5eead4, 0x23443b);
      grid.position.y = -0.01;
      grid.material.transparent = true;
      grid.material.opacity = 0.22;
      scene.add(grid);

      testCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.34, 0.34),
        new THREE.MeshStandardMaterial({ color: 0x10e0a0, emissive: 0x06382d, roughness: 0.42 })
      );
      testCube.position.set(0, 1.05, 0);
      scene.add(testCube);

      clock = new THREE.Clock();
      resize();
      animate();
      setStatus("WebGL scene is visible. Loading " + activeModel.label + " VRM...");
    }

    function resize() {
      if (!renderer || !camera) return;
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function bone(name) {
      return currentVrm?.humanoid?.getNormalizedBoneNode?.(name);
    }

    function setExpression(name, value) {
      currentVrm?.expressionManager?.setValue?.(name, value);
    }

    function resetExpressions() {
      ["happy", "aa", "ih", "ou", "blink", "relaxed", "surprised", "sad", "angry"].forEach((name) => setExpression(name, 0));
    }

    function setBoneRotation(name, x = 0, y = 0, z = 0) {
      const target = bone(name);
      if (!target) return;
      target.rotation.set(x, y, z);
    }

    function applyGuidePose(time) {
      const breathe = Math.sin(time * 1.4) * 0.018;
      setBoneRotation("hips", 0, Math.sin(time * 0.5) * 0.018, 0);
      setBoneRotation("spine", breathe, Math.sin(time * 0.45) * 0.026, 0);
      setBoneRotation("chest", breathe * 0.7, Math.sin(time * 0.55) * 0.022, 0);
      setBoneRotation("neck", 0, 0, 0);
      setBoneRotation("head", Math.sin(time * 1.1) * 0.025, Math.sin(time * 0.8) * 0.045, Math.sin(time * 0.7) * 0.012);

      setBoneRotation("leftUpperArm", 0.15, 0.02, 1.16 + Math.sin(time * 0.9) * 0.025);
      setBoneRotation("rightUpperArm", 0.18, -0.03, -1.04 + Math.cos(time * 0.85) * 0.025);
      setBoneRotation("leftLowerArm", -0.04, 0.08, 0.34);
      setBoneRotation("rightLowerArm", -0.03, -0.08, -0.34);
      setBoneRotation("leftHand", 0.02, 0.02, 0.08);
      setBoneRotation("rightHand", 0.02, -0.02, -0.08);

      setBoneRotation("leftUpperLeg", 0.02, 0, 0.035);
      setBoneRotation("rightUpperLeg", 0.02, 0, -0.035);
      setBoneRotation("leftLowerLeg", -0.02, 0, 0);
      setBoneRotation("rightLowerLeg", -0.02, 0, 0);
    }

    function normalizeAndFrame(vrm) {
      VRMUtils.rotateVRM0(vrm);
      if (currentVrm?.scene?.parent) {
        scene.remove(currentVrm.scene);
        currentVrm.scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose?.();
        });
      }
      currentVrm = vrm;
      scene.add(vrm.scene);
      mixer = new THREE.AnimationMixer(vrm.scene);
      activeAction = null;
      activeMotionKey = null;
      motionClipCache.clear();

      let meshCount = 0;
      vrm.scene.traverse((object) => {
        object.visible = true;
        object.frustumCulled = false;

        if (object.isMesh || object.isSkinnedMesh) {
          meshCount += 1;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material) => {
            const name = String(material.name || "").toLowerCase();
            if (material.map) {
              material.map.colorSpace = THREE.SRGBColorSpace;
              material.map.needsUpdate = true;
            }
            if (material.color && (name.includes("skin") || name.includes("face") || name.includes("body_mat"))) {
              material.color.setRGB(0.88, 0.84, 0.82);
            } else if (material.color) {
              material.color.setRGB(0.95, 0.95, 0.95);
            }
            const shouldBlend = material.transparent || name.includes("hairback") || name.includes("highlight");
            const shouldMask = !shouldBlend && (material.alphaTest > 0 || name.includes("hair") || name.includes("eyeline") || name.includes("eyelash") || name.includes("brow"));
            if (shouldBlend) {
              material.transparent = true;
              material.alphaTest = 0;
              material.depthWrite = false;
              material.depthTest = true;
            } else if (shouldMask) {
              material.transparent = false;
              material.alphaTest = Math.max(material.alphaTest || 0, 0.5);
              material.depthWrite = true;
            }
            material.needsUpdate = true;
          });
        }
      });

      vrm.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const targetHeight = 1.82;
      const scale = Number.isFinite(size.y) && size.y > 0 ? targetHeight / size.y : 1;
      vrm.scene.scale.setScalar(scale);
      vrm.scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      vrm.scene.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(vrm.scene);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      applyGuidePose(0);

      const viewDistance = Math.max(2.55, fittedSize.y * 1.45, fittedSize.x * 2.05);
      camera.position.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.08, fittedCenter.z + viewDistance);
      camera.near = 0.01;
      camera.far = 100;
      camera.updateProjectionMatrix();
      controls.target.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.03, fittedCenter.z);
      controls.update();

      if (testCube) testCube.visible = false;
      setStatus(activeModel.label + " VRM loaded. Meshes: " + meshCount + ", height: " + fittedSize.y.toFixed(2));
      playMotion(mode === "talk" ? "greeting" : mode === "happy" ? "vSign" : mode === "think" ? "pose" : "fullBody").catch(() => {});
    }

    async function loadModel() {
      if (!GLTFLoader || !VRMLoaderPlugin) return;
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      await new Promise((resolve, reject) => {
        loader.load(
          activeModel.url,
          (gltf) => {
            try {
              if (!gltf.userData?.vrm) {
                throw new Error("GLB loaded, but VRM metadata was not parsed");
              }
              normalizeAndFrame(gltf.userData.vrm);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          (progress) => {
            const total = progress.total || activeModel.fallbackSize;
            const percent = Math.min(99, Math.round((progress.loaded / total) * 100));
            setStatus("Loading " + activeModel.label + " model: " + percent + "%");
          },
          reject
        );
      });
    }

    async function switchModel(key) {
      if (!models[key] || key === activeModelKey) return;
      activeModelKey = key;
      activeModel = models[activeModelKey];
      try {
        setStatus("Switching to " + activeModel.label + "...");
        await checkModelFile();
        await loadModel();
      } catch (error) {
        setStatus("Switch model failed: " + errorText(error));
      }
    }

    async function loadMotionClip(key) {
      if (!currentVrm || !motions[key]) return null;
      if (!VRMAnimationLoaderPlugin || !createVRMAnimationClip) {
        throw new Error("VRMA runtime is unavailable");
      }
      const cacheKey = activeModelKey + ":" + key;
      if (motionClipCache.has(cacheKey)) return motionClipCache.get(cacheKey);

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
      const clip = await new Promise((resolve, reject) => {
        loader.load(
          motions[key].url,
          (gltf) => {
            try {
              const animation = gltf.userData?.vrmAnimations?.[0];
              if (!animation) throw new Error("No VRMA animation found in " + motions[key].url);
              resolve(createVRMAnimationClip(animation, currentVrm));
            } catch (error) {
              reject(error);
            }
          },
          undefined,
          reject
        );
      });
      motionClipCache.set(cacheKey, clip);
      return clip;
    }

    async function playMotion(key) {
      if (!motions[key]) return;
      activeMotionKey = key;
      mode = key === "greeting" || key === "vSign" ? "talk" : key === "pose" ? "think" : mode;
      try {
        const clip = await loadMotionClip(key);
        if (!clip || !mixer) return;
        const nextAction = mixer.clipAction(clip);
        nextAction.reset();
        nextAction.enabled = true;
        nextAction.setEffectiveWeight(1);
        nextAction.setEffectiveTimeScale(1);
        nextAction.fadeIn(0.24);
        nextAction.play();
        if (activeAction && activeAction !== nextAction) {
          activeAction.fadeOut(0.24);
        }
        activeAction = nextAction;
        setStatus(activeModel.label + " is playing " + motions[key].label);
      } catch (error) {
        activeAction = null;
        setStatus("VRMA motion failed: " + errorText(error) + "\nManual guide motion is still active.");
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.elapsedTime;

      if (testCube?.visible) {
        testCube.rotation.x += delta * 0.8;
        testCube.rotation.y += delta * 1.2;
      }

      if (currentVrm) {
        mixer?.update(delta);
        resetExpressions();
        if (!activeAction) applyGuidePose(time);
        const leftUpperArm = bone("leftUpperArm");
        const rightUpperArm = bone("rightUpperArm");
        const leftLowerArm = bone("leftLowerArm");
        const rightLowerArm = bone("rightLowerArm");

        if (mode === "talk") {
          setExpression("aa", 0.28 + Math.abs(Math.sin(time * 9)) * 0.58);
          setExpression("happy", 0.2);
          if (!activeAction) {
            if (leftUpperArm) leftUpperArm.rotation.z = 0.78 + Math.sin(time * 2.5) * 0.16;
            if (rightUpperArm) rightUpperArm.rotation.z = -0.52 + Math.cos(time * 2.1) * 0.14;
            if (leftLowerArm) leftLowerArm.rotation.z = 0.52 + Math.sin(time * 3.2) * 0.14;
            if (rightLowerArm) rightLowerArm.rotation.z = -0.48 + Math.cos(time * 2.8) * 0.14;
          }
        } else if (mode === "think") {
          setExpression("relaxed", 0.34);
          if (!activeAction) {
            setBoneRotation("head", 0.08, -0.06, 0.08);
            if (rightUpperArm) rightUpperArm.rotation.z = -0.72;
            if (rightLowerArm) rightLowerArm.rotation.z = -0.62;
          }
        } else if (mode === "happy") {
          setExpression("happy", 0.86);
          if (!activeAction) {
            if (leftUpperArm) leftUpperArm.rotation.z = 0.52 + Math.sin(time * 3) * 0.18;
            if (rightUpperArm) rightUpperArm.rotation.z = -0.52 + Math.cos(time * 3) * 0.18;
          }
        } else if (mode === "outfit") {
          setExpression("surprised", 0.3);
          currentVrm.scene.traverse((object) => {
            if (object.isMesh && object.material?.color) {
              object.material.color.offsetHSL(Math.sin(time * 0.8) * 0.0006, 0, 0);
            }
          });
        }

        if (time > blinkAt) {
          setExpression("blink", 1);
          if (time > blinkAt + 0.12) blinkAt = time + 2.4 + Math.random() * 2.2;
        }

        currentVrm.update(delta);
      }

      controls?.update();
      renderer?.render(scene, camera);
    }

    async function boot() {
      try {
        await importRuntime();
        await checkModelFile();
        createScene();
        await loadModel();
      } catch (error) {
        console.error(error);
        setStatus("VRM renderer failed: " + errorText(error) + "\nSwitching to local Live2D fallback...");
        await startLive2DFallback(error);
      }
    }

    async function startLive2DFallback(originalError) {
      try {
        if (!window.PIXI?.live2d?.Live2DModel) {
          throw new Error("Local Live2D runtime is unavailable");
        }

        canvas.style.display = "none";
        live2dCanvas.style.display = "block";

        const app = new PIXI.Application({
          view: live2dCanvas,
          width: 720,
          height: 900,
          autoStart: true,
          transparent: true,
          antialias: true,
          autoDensity: false,
          resolution: 1,
        });

        const model = await PIXI.live2d.Live2DModel.from(live2dModelUrl);
        model.anchor.set(0.5, 0.5);
        app.stage.addChild(model);

        function layoutLive2D() {
          const width = Math.max(window.innerWidth, 1);
          const height = Math.max(window.innerHeight, 1);
          app.renderer.resize(width, height);
          const bounds = model.getLocalBounds();
          const naturalWidth = Math.max(1, bounds.width);
          const naturalHeight = Math.max(1, bounds.height);
          const scale = Math.min(width / naturalWidth, height / naturalHeight) * 1.32;
          model.x = width * 0.5;
          model.y = height * 0.88;
          model.scale.set(scale);
          model.rotation = 0;
          model.alpha = 1;
          app.renderer.render(app.stage);
        }

        window.addEventListener("resize", layoutLive2D);
        layoutLive2D();
        model.motion?.("Idle", 0);

        let talkTicker = 0;
        app.ticker.add(() => {
          talkTicker += 1;
          if (mode === "talk") {
            if (talkTicker % 90 === 0) model.motion?.("Idle", 0);
            model.internalModel.coreModel.setParameterValueById?.("ParamMouthOpenY", 0.35 + Math.abs(Math.sin(talkTicker / 5)) * 0.55);
          } else if (mode === "happy") {
            model.expression?.("blush");
          } else if (mode === "think") {
            model.expression?.("calm");
          }
        });

        setStatus("Local Live2D digital human is visible. VRM is waiting for local three-vrm dependencies.\nOriginal VRM error: " + errorText(originalError));
      } catch (fallbackError) {
        setStatus("VRM failed: " + errorText(originalError) + "\nLive2D fallback also failed: " + errorText(fallbackError));
      }
    }

    window.addEventListener("resize", resize);
    boot();
  </script>
</body>
</html>`;

export default function VRMTestPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Starting VRM renderer...");
  const [modeLabel, setModeLabel] = useState("Ready");
  const [modelLabel, setModelLabel] = useState("default_2963");

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.source !== "dg-vrm-test") return;
      if (event.data.type === "status") setStatus(String(event.data.payload || ""));
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function sendMode(mode: string, label: string) {
    frameRef.current?.contentWindow?.postMessage({ source: "dg-vrm-test-host", type: "mode", payload: mode }, "*");
    const motion = mode === "talk" ? "greeting" : mode === "happy" ? "vSign" : mode === "think" ? "pose" : mode === "idle" ? "fullBody" : "";
    if (motion) frameRef.current?.contentWindow?.postMessage({ source: "dg-vrm-test-host", type: "motion", payload: motion }, "*");
    setModeLabel(label);
  }

  function sendModel(model: string, label: string) {
    frameRef.current?.contentWindow?.postMessage({ source: "dg-vrm-test-host", type: "model", payload: model }, "*");
    setModelLabel(label);
  }

  function sendMotion(motion: string, label: string) {
    frameRef.current?.contentWindow?.postMessage({ source: "dg-vrm-test-host", type: "motion", payload: motion }, "*");
    setModeLabel(label);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#071712] text-white">
      <section className="grid min-h-screen grid-cols-[minmax(340px,0.55fr)_minmax(0,1fr)] gap-8 p-8">
        <VRMControlPanel modeLabel={modeLabel} modelLabel={modelLabel} status={status} onMode={sendMode} onModel={sendModel} onMotion={sendMotion} />
        <section className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#071712] shadow-2xl">
          <iframe
            ref={frameRef}
            title="Karmesi VRM preview"
            srcDoc={vrmFrameHtml}
            className="h-full min-h-screen w-full border-0"
            allow="autoplay"
          />
        </section>
      </section>
    </main>
  );
}

function VRMControlPanel({
  modeLabel,
  modelLabel,
  status,
  onMode,
  onModel,
  onMotion,
}: {
  modeLabel: string;
  modelLabel: string;
  status: string;
  onMode: (mode: string, label: string) => void;
  onModel: (model: string, label: string) => void;
  onMotion: (motion: string, label: string) => void;
}) {
  return (
    <aside className="flex flex-col justify-between rounded-[28px] border border-white/12 bg-white/8 p-7 shadow-2xl backdrop-blur-xl">
      <div>
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
          three-vrm prototype
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Karmesi 数字人试验</h1>
        <p className="mt-4 text-sm leading-7 text-white/68">
          当前页面使用 Three.js + @pixiv/three-vrm 从本地加载 VRM 模型。先验证四肢动作、表情、讲解状态和换装预留，再接入游客端问答。
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <span className="text-xs text-white/50">状态</span>
          <strong className="mt-1 block text-lg">{modelLabel} / {modeLabel}</strong>
          <p className="mt-2 whitespace-pre-wrap text-xs text-emerald-200">{status}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            className="rounded-full border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/16"
            type="button"
            onClick={() => onModel("default", "default_2963")}
          >
            default_2963
          </button>
          <button
            className="rounded-full border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/16"
            type="button"
            onClick={() => onModel("default2704", "default_2704")}
          >
            default_2704
          </button>
          <button
            className="rounded-full border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/16"
            type="button"
            onClick={() => onModel("model7533", "7533417284697534698")}
          >
            7533417284697534698
          </button>
          <button
            className="rounded-full border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/16"
            type="button"
            onClick={() => onModel("karmesi", "Karmesi")}
          >
            Karmesi
          </button>
        </div>
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">VRMA motions</span>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              ["fullBody", "展示全身"],
              ["greeting", "打招呼"],
              ["vSign", "比 V 手势"],
              ["point", "指物动作"],
              ["turn", "原地转圈"],
              ["pose", "模特摆拍"],
              ["stretch", "屈伸运动"],
            ].map(([motion, label]) => (
              <button
                key={motion}
                className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                  motion === "point"
                    ? "border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/16"
                    : "border-white/12 bg-white/10 hover:bg-white/16"
                }`}
                type="button"
                onClick={() => onMotion(motion, label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VRMButtons onMode={onMode} />
    </aside>
  );
}

function VRMButtons({ onMode }: { onMode: (mode: string, label: string) => void }) {
  const modes = [
    ["idle", "待命"],
    ["talk", "讲解"],
    ["think", "思考"],
    ["happy", "开心"],
    ["outfit", "换装预留"],
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map(([mode, label]) => (
        <button
          key={mode}
          className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
            mode === "talk"
              ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              : mode === "outfit"
                ? "col-span-2 border border-white/12 bg-white/10 hover:bg-white/16"
                : "border border-white/12 bg-white/10 hover:bg-white/16"
          }`}
          type="button"
          onClick={() => onMode(mode, label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
