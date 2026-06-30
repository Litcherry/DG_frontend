"use client"

import { useEffect, useRef, useState } from "react"

type AvatarMode = "idle" | "talk" | "think" | "happy"

type VrmAvatarStageProps = {
  mode?: AvatarMode
  model?: string
  className?: string
}

const MODEL_OPTIONS = [
  { label: "小号", value: "/assets/vrm/7533417284697534698.vrm" },
  { label: "Karmesi", value: "/assets/vrm/karmesi.vrm" },
  { label: "导览员 A", value: "/assets/vrm/default_2963.vrm" },
  { label: "导览员 B", value: "/assets/vrm/default_2704.vrm" },
]

const MOTIONS = {
  idle: "/assets/vrm/animations/VRMA_01.vrma",
  talk: "/assets/vrm/animations/VRMA_02.vrma",
  think: "/assets/vrm/animations/VRMA_07.vrma",
  happy: "/assets/vrm/animations/VRMA_03.vrma",
}

function browserImport<T = any>(url: string): Promise<T> {
  return new Function("url", "return import(url)")(
    url,
  ) as Promise<T>
}

export function VrmAvatarStage({ mode = "idle", model = MODEL_OPTIONS[0].value, className = "" }: VrmAvatarStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const runtimeRef = useRef<any>(null)
  const [selectedModel, setSelectedModel] = useState(model)
  const [status, setStatus] = useState("正在加载数字人")

  useEffect(() => {
    setSelectedModel(model)
  }, [model])

  useEffect(() => {
    let disposed = false
    let frame = 0

    async function init() {
      const canvas = canvasRef.current
      if (!canvas) return

      try {
        setStatus("正在准备 3D 场景")
        const THREE = await browserImport<any>("https://esm.sh/three@0.160.0")
        const { GLTFLoader } = await browserImport<any>("https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?deps=three@0.160.0")
        const { OrbitControls } = await browserImport<any>("https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js?deps=three@0.160.0")
        const { VRMLoaderPlugin, VRMUtils } = await browserImport<any>("https://esm.sh/@pixiv/three-vrm@3.4.2?deps=three@0.160.0")
        const { createVRMAnimationClip, VRMAnimationLoaderPlugin } = await browserImport<any>("https://esm.sh/@pixiv/three-vrm-animation@3.4.2?deps=three@0.160.0,@pixiv/three-vrm@3.4.2")

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.14

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
        camera.position.set(0, 1.28, 4.1)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.enablePan = false
        controls.minDistance = 2.35
        controls.maxDistance = 5.4
        controls.target.set(0, 1.15, 0)

        scene.add(new THREE.HemisphereLight(0xffffff, 0x345a45, 1.55))
        const key = new THREE.DirectionalLight(0xffffff, 2.0)
        key.position.set(2.1, 3.2, 3.8)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0x9fe7c6, 0.95)
        fill.position.set(-2.8, 2.1, 2.2)
        scene.add(fill)

        const loader = new GLTFLoader()
        loader.register((parser: any) => new VRMLoaderPlugin(parser))
        loader.register((parser: any) => new VRMAnimationLoaderPlugin(parser))

        const clock = new THREE.Clock()
        const mixerHolder: { mixer: any; actions: Record<string, any> } = { mixer: null, actions: {} }
        const runtime = {
          THREE,
          scene,
          camera,
          renderer,
          controls,
          loader,
          currentVrm: null as any,
          mixerHolder,
          activeAction: null as any,
          currentMode: "idle" as AvatarMode,
          disposed: false,
          async loadMotion(name: keyof typeof MOTIONS, vrm: any) {
            if (mixerHolder.actions[name]) return mixerHolder.actions[name]
            try {
              const gltf = await loader.loadAsync(MOTIONS[name])
              const animation = gltf.userData?.vrmAnimations?.[0]
              if (!animation) return null
              const clip = createVRMAnimationClip(animation, vrm)
              const action = mixerHolder.mixer.clipAction(clip)
              action.clampWhenFinished = false
              action.loop = name === "idle" ? THREE.LoopRepeat : THREE.LoopOnce
              mixerHolder.actions[name] = action
              return action
            } catch {
              return null
            }
          },
          async play(nextMode: AvatarMode) {
            const vrm = runtime.currentVrm
            if (!vrm || !mixerHolder.mixer) return
            runtime.currentMode = nextMode
            const motionName = nextMode === "talk" ? "talk" : nextMode === "think" ? "think" : nextMode === "happy" ? "happy" : "idle"
            const action = await runtime.loadMotion(motionName, vrm)
            if (!action) return
            action.reset().fadeIn(0.22).play()
            if (runtime.activeAction && runtime.activeAction !== action) runtime.activeAction.fadeOut(0.22)
            runtime.activeAction = action
          },
          updateMouth(elapsed: number) {
            const vrm = runtime.currentVrm
            const manager = vrm?.expressionManager
            if (!manager) return
            const value = runtime.currentMode === "talk" ? 0.18 + Math.abs(Math.sin(elapsed * 13)) * 0.72 : 0
            try {
              manager.setValue("aa", value)
              manager.setValue("ih", value * 0.35)
              manager.setValue("ou", value * 0.18)
            } catch {}
          },
          async loadModel(url: string) {
            setStatus("正在加载数字人模型")
            if (runtime.currentVrm) {
              scene.remove(runtime.currentVrm.scene)
              VRMUtils.deepDispose(runtime.currentVrm.scene)
              runtime.currentVrm = null
            }
            mixerHolder.actions = {}
            const gltf = await loader.loadAsync(url)
            const vrm = gltf.userData.vrm
            VRMUtils.removeUnnecessaryVertices(gltf.scene)
            VRMUtils.combineSkeletons(gltf.scene)
            vrm.scene.rotation.y = Math.PI
            vrm.scene.position.set(0, 0, 0)
            vrm.scene.traverse((object: any) => {
              object.frustumCulled = false
              const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
              materials.forEach((material: any) => {
                if (material.map) {
                  material.map.colorSpace = THREE.SRGBColorSpace
                  material.map.needsUpdate = true
                }
                material.needsUpdate = true
              })
            })
            scene.add(vrm.scene)
            runtime.currentVrm = vrm
            mixerHolder.mixer = new THREE.AnimationMixer(vrm.scene)
            controls.target.set(0, 1.15, 0)
            camera.position.set(0, 1.3, 4.1)
            await runtime.play(mode)
            setStatus("数字人已就绪")
          },
        }

        runtimeRef.current = runtime

        function resize() {
          const rect = canvas.getBoundingClientRect()
          const width = Math.max(1, Math.floor(rect.width))
          const height = Math.max(1, Math.floor(rect.height))
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(canvas)
        resize()

        await runtime.loadModel(selectedModel)

        const animate = () => {
          if (disposed || runtime.disposed) return
          const delta = clock.getDelta()
          runtime.updateMouth(clock.elapsedTime)
          runtime.currentVrm?.update(delta)
          mixerHolder.mixer?.update(delta)
          controls.update()
          renderer.render(scene, camera)
          frame = window.requestAnimationFrame(animate)
        }
        animate()

        runtime.cleanup = () => {
          runtime.disposed = true
          resizeObserver.disconnect()
          window.cancelAnimationFrame(frame)
          renderer.dispose()
          if (runtime.currentVrm) VRMUtils.deepDispose(runtime.currentVrm.scene)
        }
      } catch (error: any) {
        setStatus(error?.message ? `数字人加载失败：${error.message}` : "数字人加载失败")
      }
    }

    init()

    return () => {
      disposed = true
      runtimeRef.current?.cleanup?.()
      runtimeRef.current = null
    }
  }, [selectedModel])

  useEffect(() => {
    runtimeRef.current?.play?.(mode)
  }, [mode])

  return (
    <div className={`relative isolate overflow-hidden rounded-[26px] border border-emerald-900/10 bg-[#f3f6f3] shadow-[0_18px_60px_rgba(15,38,25,0.10)] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,148,0.20),transparent_30%),linear-gradient(180deg,#f8faf7_0%,#eef3ee_100%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden text-[6.5rem] font-black uppercase leading-none tracking-[-0.08em] text-emerald-950/[0.10]">
        <span className="absolute left-6 top-14 whitespace-nowrap">SCENIC GUIDE</span>
        <span className="absolute bottom-8 left-20 whitespace-nowrap">DISCOVER</span>
      </div>
      <canvas ref={canvasRef} className="relative z-10 h-full w-full" />
      <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {status}
      </div>
      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm shadow-lg backdrop-blur-xl">
        <div>
          <strong className="block text-emerald-950">AI 导览员</strong>
          <span className="text-xs text-muted-foreground">数字人实时陪伴讲解</span>
        </div>
        <select
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
          className="h-9 rounded-full border border-emerald-900/10 bg-white/80 px-3 text-xs font-semibold outline-none"
        >
          {MODEL_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
