import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { TrackballControls, Bounds, Center, Environment, Lightformer, ContactShadows, useGLTF, useProgress, useBounds } from '@react-three/drei'
import * as THREE from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/** Procedural LGA-style CPU package used only by the dev demo entry. Not catalog data. */
function DemoCpu() {
  const pads = []
  for (let x = -9; x <= 9; x++) for (let z = -9; z <= 9; z++) if (Math.abs(x) > 2 || Math.abs(z) > 2)
    pads.push(<mesh key={`${x},${z}`} position={[x * 0.18, -0.07, z * 0.18]}><boxGeometry args={[0.1, 0.02, 0.1]} /><meshStandardMaterial color="#d4a84b" metalness={1} roughness={0.25} /></mesh>)
  return (
    <group>
      <mesh castShadow receiveShadow><boxGeometry args={[3.75, 0.12, 3.75]} /><meshStandardMaterial color="#1f5a2e" roughness={0.6} /></mesh>
      {pads}
      <mesh castShadow position={[0, 0.16, 0]}><boxGeometry args={[3.0, 0.2, 3.0]} /><meshStandardMaterial color="#c9ccd1" metalness={1} roughness={0.32} /></mesh>
      <mesh position={[0, 0.07, 0]}><boxGeometry args={[1.1, 0.04, 0.8]} /><meshStandardMaterial color="#222" roughness={0.3} /></mesh>
      {[[-1.6, -1.6], [1.6, 1.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.07, z]}><boxGeometry args={[0.25, 0.04, 0.12]} /><meshStandardMaterial color="#6b4a2b" /></mesh>)}
    </group>)
}
/** modelUrl may be absolute (https://cdn/x.glb) or relative (/models/x.glb, models/x.glb), resolved against the page. */
export const resolveModelUrl = (u: string) => new URL(u, document.baseURI).href
function Gltf({ url }: { url: string }) {
  const { scene } = useGLTF(resolveModelUrl(url), false, true, (l) => { l.setMeshoptDecoder(MeshoptDecoder) })
  const maxAniso = useThree(s => s.gl.capabilities.getMaxAnisotropy())
  scene.traverse(o => {
    const m = o as THREE.Mesh; if (!m.isMesh) return
    m.castShadow = m.receiveShadow = true
    for (const mat of ([] as THREE.Material[]).concat(m.material)) for (const v of Object.values(mat))
      if (v instanceof THREE.Texture) { v.anisotropy = maxAniso; v.needsUpdate = true } // full-res: GLTFLoader never downscales; we only raise filtering
  })
  return <primitive object={scene} />
}
function Loader() { const { active, progress } = useProgress(); return active ? <div role="status" className="absolute inset-0 grid place-items-center pointer-events-none"><div className="text-xs font-mono text-muted bg-card/80 px-3 py-1.5 rounded border border-border">Loading {progress.toFixed(0)}%</div></div> : null }
function ResetHook({ api }: { api: React.MutableRefObject<(() => void) | null> }) { const b = useBounds(); api.current = () => b.refresh().clip().fit(); return null }

export const NO_WEBGL_MSG = "3D needs WebGL, which isn't available in this browser. Showing the diagram instead."
/** Quick probe so we never even mount a Canvas when WebGL is missing. */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const ctx = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!ctx) return false
    ctx.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}
export class NoWebGLError extends Error { name = "NoWebGLError" }

/** Free every GPU resource held by a scene graph. */
function disposeScene(root: THREE.Object3D) {
  root.traverse(o => {
    const m = o as THREE.Mesh
    m.geometry?.dispose?.()
    const mats = ([] as THREE.Material[]).concat((m.material as THREE.Material | THREE.Material[]) ?? [])
    for (const mat of mats) { for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose(); mat.dispose() }
  })
}

/** Error boundary: a failing viewer never takes down the list or diagrams. */
export class ViewerBoundary extends Component<{ children: ReactNode; onError?: (e: Error) => void; resetKey?: string }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error) { this.props.onError?.(err) }
  componentDidUpdate(p: { resetKey?: string }) { if (p.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }) }
  render() {
    if (!this.state.err) return this.props.children
    return <div role="alert" className="w-full h-full grid place-items-center p-4 text-sm text-muted text-center">
      {this.state.err instanceof NoWebGLError ? NO_WEBGL_MSG : '3D viewer failed to load for this model.'}
      {!(this.state.err instanceof NoWebGLError) && <button className="mt-2 px-2.5 py-1 rounded-md border border-border" onClick={() => this.setState({ err: null })}>Retry</button>}
    </div>
  }
}

export default function Viewer3D({ modelUrl, label, onNoWebGL }: { modelUrl: string; label: string; onNoWebGL?: () => void }) {
  const controls = useRef<any>(null); const fit = useRef<(() => void) | null>(null); const [k, setK] = useState(0)
  const [ok] = useState(hasWebGL)
  const [lost, setLost] = useState(false); const [gen, setGen] = useState(0)
  const glRef = useRef<THREE.WebGLRenderer | null>(null); const sceneRef = useRef<THREE.Scene | null>(null)
  const reset = () => { controls.current?.reset(); fit.current?.(); setK(k + 1) }
  useEffect(() => { if (!ok) onNoWebGL?.() }, [ok])
  useEffect(() => () => {
    const gl = glRef.current, sc = sceneRef.current
    if (sc) disposeScene(sc)
    if (!modelUrl.startsWith('demo:')) useGLTF.clear(resolveModelUrl(modelUrl)) // cached scene was disposed; force a fresh load next time
    if (gl) { gl.setAnimationLoop(null); gl.renderLists.dispose(); gl.dispose(); if (!gl.getContext().isContextLost()) gl.forceContextLoss(); gl.domElement.remove() }
    glRef.current = null; sceneRef.current = null
  }, [gen, modelUrl])
  if (!ok) return <div role="alert" className="w-full h-full grid place-items-center p-4 text-sm text-muted text-center">{NO_WEBGL_MSG}</div>
  return (
    <div className="relative w-full h-full touch-none" role="img" aria-label={`Interactive 3D model: ${label}. Drag to rotate, scroll or pinch to zoom, right-drag or two-finger drag to pan.`}>
      <Canvas key={gen} shadows="percentage" dpr={[1, Math.min(window.devicePixelRatio || 1, 2)]} camera={{ position: [4, 3, 5], fov: 40 }}
        gl={(props: any) => {
          try { return new THREE.WebGLRenderer({ ...props, antialias: true }) }
          catch (e) { onNoWebGL?.(); throw new NoWebGLError(String(e)) }
        }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          glRef.current = gl; sceneRef.current = scene
          gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setLost(true) })
          gl.domElement.addEventListener('webglcontextrestored', () => setLost(false))
        }}>
        <color attach="background" args={['#0f0f11']} />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
            <Lightformer intensity={1.2} position={[-5, 1, 2]} scale={[6, 3, 1]} rotation-y={Math.PI / 2} />
            <Lightformer intensity={1.2} position={[5, 1, -2]} scale={[6, 3, 1]} rotation-y={-Math.PI / 2} />
            <Lightformer intensity={0.6} position={[0, -4, 0]} scale={[10, 10, 1]} rotation-x={-Math.PI / 2} />
          </Environment>
          <directionalLight castShadow position={[3, 6, 4]} intensity={1.2} shadow-mapSize={[2048, 2048]} />
          <Bounds fit clip observe margin={1.2} key={k}>
            <ResetHook api={fit} />
            <Center>{modelUrl.startsWith('demo:') ? <DemoCpu /> : <Gltf url={modelUrl} />}</Center>
          </Bounds>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.5} blur={2.5} scale={12} far={4} />
        </Suspense>
        <TrackballControls ref={controls} makeDefault rotateSpeed={3} zoomSpeed={1.2} panSpeed={0.8} dynamicDampingFactor={0.12} />
      </Canvas>
      <Loader />
      {lost && <div role="alert" className="absolute inset-0 grid place-items-center bg-bg/85 text-sm text-center p-4">
        <div>The 3D view lost its graphics context (GPU reset or too many tabs).<br />
          <button className="mt-2 px-2.5 py-1 rounded-md border border-border hover:text-accent" onClick={() => { setLost(false); setGen(g => g + 1) }}>Retry</button></div></div>}
      <button onClick={reset} className="absolute top-2 right-2 text-xs px-2.5 py-1 rounded-md border border-border bg-bg/80 hover:text-accent">Reset view</button>
    </div>)
}
