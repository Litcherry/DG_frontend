export async function GET() {
  const html = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: transparent;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .avatar-stage {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 24px;
      background: #e8ebe8;
      isolation: isolate;
    }

    .stage-background,
    #canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }

    .stage-background {
      z-index: 0;
      pointer-events: none;
      filter: saturate(0.92) contrast(1.02);
    }

    #canvas {
      z-index: 1;
      display: block;
    }

    .status {
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 14px;
      z-index: 2;
      border: 1px solid rgba(20, 30, 28, 0.1);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.6);
      color: rgba(31, 41, 35, 0.68);
      padding: 8px 12px;
      font-size: 12px;
      text-align: center;
      backdrop-filter: blur(14px);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
    }

    .avatar-stage[data-debug="true"] .status {
      opacity: 1;
      transform: translateY(0);
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
  <div id="stage" class="avatar-stage">
    <iframe class="stage-background" src="/assets/vrm/background-interface.html" title="avatar background" aria-hidden="true"></iframe>
    <canvas id="canvas"></canvas>
    <div id="status" class="status">Loading digital human...</div>
  </div>
  <script type="module">
    const stage = document.getElementById("stage");
    const canvas = document.getElementById("canvas");
    const status = document.getElementById("status");
    const search = new URLSearchParams(location.search);
    const models = {
      default: { label: "default_2963", url: "/assets/vrm/default_2963.vrm", fallbackSize: 5350040 },
      default2704: { label: "default_2704", url: "/assets/vrm/default_2704.vrm", fallbackSize: 5548212 },
      model7533: { label: "7533417284697534698", url: "/assets/vrm/7533417284697534698.vrm", fallbackSize: 15282092 },
      karmesi: { label: "Karmesi", url: "/assets/vrm/karmesi.vrm", fallbackSize: 18748576 }
    };
    const motions = {
      fullBody: { label: "full body", url: "/assets/vrm/animations/VRMA_01.vrma" },
      greeting: { label: "greeting", url: "/assets/vrm/animations/VRMA_02.vrma" },
      vSign: { label: "v sign", url: "/assets/vrm/animations/VRMA_03.vrma" },
      turn: { label: "turn", url: "/assets/vrm/animations/VRMA_05.vrma" },
      pose: { label: "pose", url: "/assets/vrm/animations/VRMA_06.vrma" },
      stretch: { label: "stretch", url: "/assets/vrm/animations/VRMA_07.vrma" }
    };

    let activeModelKey = models[search.get("model")] ? search.get("model") : "model7533";
    let activeModel = models[activeModelKey];
    let THREE;
    let GLTFLoader;
    let OrbitControls;
    let VRMLoaderPlugin;
    let VRMUtils;
    let VRMAnimationLoaderPlugin;
    let createVRMAnimationClip;
    let renderer;
    let scene;
    let camera;
    let controls;
    let clock;
    let currentVrm;
    let mixer;
    let activeAction;
    let mode = "idle";
    let blinkAt = 0;
    const motionClipCache = new Map();

    function setStatus(text) {
      status.textContent = text;
      parent.postMessage({ source: "dg-vrm-avatar", type: "status", payload: text }, "*");
    }

    function errorText(error) {
      return error?.message || error?.type || String(error || "unknown error");
    }

    async function importRuntime() {
      setStatus("Loading VRM runtime...");
      THREE = await import("three");
      ({ GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js"));
      ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
      const vrmModule = await import("@pixiv/three-vrm");
      VRMLoaderPlugin = vrmModule.VRMLoaderPlugin;
      VRMUtils = vrmModule.VRMUtils;
      try {
        const vrmaModule = await import("@pixiv/three-vrm-animation");
        VRMAnimationLoaderPlugin = vrmaModule.VRMAnimationLoaderPlugin;
        createVRMAnimationClip = vrmaModule.createVRMAnimationClip;
      } catch (error) {
        console.warn("VRMA runtime unavailable", error);
      }
    }

    function createScene() {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor(0xffffff, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
      camera.position.set(0, 1.25, 3.45);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 1.05, 0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = false;

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

      clock = new THREE.Clock();
      resize();
      animate();
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
      if (target) target.rotation.set(x, y, z);
    }

    function applyGuidePose(time) {
      const breathe = Math.sin(time * 1.4) * 0.018;
      setBoneRotation("hips", 0, Math.sin(time * 0.5) * 0.018, 0);
      setBoneRotation("spine", breathe, Math.sin(time * 0.45) * 0.026, 0);
      setBoneRotation("chest", breathe * 0.7, Math.sin(time * 0.55) * 0.022, 0);
      setBoneRotation("head", Math.sin(time * 1.1) * 0.025, Math.sin(time * 0.8) * 0.045, Math.sin(time * 0.7) * 0.012);
      setBoneRotation("leftUpperArm", 0.15, 0.02, 1.16 + Math.sin(time * 0.9) * 0.025);
      setBoneRotation("rightUpperArm", 0.18, -0.03, -1.04 + Math.cos(time * 0.85) * 0.025);
      setBoneRotation("leftLowerArm", -0.04, 0.08, 0.34);
      setBoneRotation("rightLowerArm", -0.03, -0.08, -0.34);
      setBoneRotation("leftUpperLeg", 0.02, 0, 0.035);
      setBoneRotation("rightUpperLeg", 0.02, 0, -0.035);
    }

    function prepareMaterials(vrm) {
      vrm.scene.traverse((object) => {
        object.visible = true;
        object.frustumCulled = false;
        if (!object.isMesh && !object.isSkinnedMesh) return;
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
          const shouldBlend = material.transparent || name.includes("hairback") || name.includes("highlight") || name.includes("eyeline") || name.includes("eyelash") || name.includes("brow");
          const shouldMask = !shouldBlend && (material.alphaTest > 0 || name.includes("hair") || name.includes("eye") || name.includes("face") || name.includes("skin") || name.includes("cloth"));
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
      });
    }

    function normalizeAndFrame(vrm) {
      VRMUtils.rotateVRM0(vrm);
      if (currentVrm?.scene?.parent) scene.remove(currentVrm.scene);
      currentVrm = vrm;
      scene.add(vrm.scene);
      mixer = new THREE.AnimationMixer(vrm.scene);
      activeAction = null;
      motionClipCache.clear();
      prepareMaterials(vrm);

      vrm.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const targetHeight = 2.12;
      const scale = Number.isFinite(size.y) && size.y > 0 ? targetHeight / size.y : 1;
      vrm.scene.scale.setScalar(scale);
      vrm.scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      vrm.scene.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(vrm.scene);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      const viewDistance = Math.max(2.55, fittedSize.y * 1.28, fittedSize.x * 1.95);
      camera.position.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.08, fittedCenter.z + viewDistance);
      controls.target.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.02, fittedCenter.z);
      camera.updateProjectionMatrix();
      controls.update();
      setStatus(activeModel.label + " ready");
      playMotion("fullBody").catch(() => {});
    }

    async function loadModel() {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      await new Promise((resolve, reject) => {
        loader.load(activeModel.url, (gltf) => {
          try {
            if (!gltf.userData?.vrm) throw new Error("VRM metadata was not parsed");
            normalizeAndFrame(gltf.userData.vrm);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, (progress) => {
          const total = progress.total || activeModel.fallbackSize;
          setStatus("Loading " + activeModel.label + " " + Math.min(99, Math.round((progress.loaded / total) * 100)) + "%");
        }, reject);
      });
    }

    async function loadMotionClip(key) {
      if (!currentVrm || !motions[key] || !VRMAnimationLoaderPlugin || !createVRMAnimationClip) return null;
      const cacheKey = activeModelKey + ":" + key;
      if (motionClipCache.has(cacheKey)) return motionClipCache.get(cacheKey);
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
      const clip = await new Promise((resolve, reject) => {
        loader.load(motions[key].url, (gltf) => {
          try {
            const animation = gltf.userData?.vrmAnimations?.[0];
            if (!animation) throw new Error("No VRMA animation found");
            resolve(createVRMAnimationClip(animation, currentVrm));
          } catch (error) {
            reject(error);
          }
        }, undefined, reject);
      });
      motionClipCache.set(cacheKey, clip);
      return clip;
    }

    async function playMotion(key) {
      if (!motions[key]) return;
      try {
        const clip = await loadMotionClip(key);
        if (!clip || !mixer) {
          activeAction = null;
          return;
        }
        const nextAction = mixer.clipAction(clip);
        nextAction.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).fadeIn(0.24).play();
        if (activeAction && activeAction !== nextAction) activeAction.fadeOut(0.24);
        activeAction = nextAction;
      } catch (error) {
        activeAction = null;
        console.warn("Motion failed", error);
      }
    }

    async function switchModel(key) {
      if (!models[key] || key === activeModelKey) return;
      activeModelKey = key;
      activeModel = models[key];
      await loadModel();
    }

    function setMode(nextMode) {
      mode = nextMode || "idle";
      if (mode === "talk") playMotion("greeting").catch(() => {});
      else if (mode === "think") playMotion("pose").catch(() => {});
      else if (mode === "happy") playMotion("vSign").catch(() => {});
      else playMotion("fullBody").catch(() => {});
    }

    window.addEventListener("message", (event) => {
      if (event.data?.source !== "dg-vrm-avatar-host") return;
      if (event.data.type === "mode") setMode(event.data.payload);
      if (event.data.type === "motion") playMotion(event.data.payload).catch(() => {});
      if (event.data.type === "model") switchModel(event.data.payload).catch((error) => setStatus(errorText(error)));
    });

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.elapsedTime;
      if (currentVrm) {
        mixer?.update(delta);
        resetExpressions();
        if (!activeAction) applyGuidePose(time);
        if (mode === "talk") {
          setExpression("aa", 0.28 + Math.abs(Math.sin(time * 9)) * 0.58);
          setExpression("happy", 0.18);
        } else if (mode === "think") {
          setExpression("relaxed", 0.34);
        } else if (mode === "happy") {
          setExpression("happy", 0.86);
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
        createScene();
        await loadModel();
      } catch (error) {
        stage.dataset.debug = "true";
        setStatus("VRM failed: " + errorText(error));
      }
    }

    window.addEventListener("resize", resize);
    boot();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
