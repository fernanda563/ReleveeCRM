import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";

interface STLViewerProps {
  fileUrl: string;
  height?: string;
  width?: string;
}

export function STLViewer({ fileUrl, height = "400px", width = "100%" }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f4f4f5");

    const widthPx = container.clientWidth || 800;
    const heightPx = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(50, widthPx / heightPx, 0.1, 5000);
    camera.position.set(0, 0, 150);

    // Forzar WebGL1 para mayor compatibilidad en iframes/sandboxes
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const contextAttributes: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      desynchronized: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
    };

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvas.getContext('webgl', contextAttributes) ||
            canvas.getContext('experimental-webgl', contextAttributes)) as WebGLRenderingContext | null;
    } catch (e) {
      console.error('Error solicitando contexto WebGL1:', e);
    }

    let renderer: any = null;
    let isSVG = false;

    if (!gl) {
      console.warn('WebGL1 no disponible, usando SVGRenderer como fallback');
      const svgRenderer = new SVGRenderer();
      svgRenderer.setSize(widthPx, heightPx);
      renderer = svgRenderer;
      isSVG = true;
      rendererRef.current = svgRenderer;
    } else {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true });
      } catch (error) {
        console.error('Error creando WebGLRenderer con contexto WebGL1, intentando SVGRenderer:', error);
        const svgRenderer = new SVGRenderer();
        svgRenderer.setSize(widthPx, heightPx);
        renderer = svgRenderer;
        isSVG = true;
        rendererRef.current = svgRenderer;
      }
    }

    if (!renderer) {
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600';
      overlay.textContent = 'No fue posible inicializar el visor 3D.';
      container.appendChild(overlay);
      return;
    }

    if (renderer.setPixelRatio) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (renderer.setSize) renderer.setSize(widthPx, heightPx);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-50, -50, -50);
    scene.add(dirLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1000;

    // ResizeObserver para ajuste dinámico
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer) return;
      const w = container.clientWidth || widthPx;
      const h = container.clientHeight || heightPx;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    // Load STL
    const loader = new STLLoader();
    loader.setCrossOrigin('anonymous');
    let mesh: THREE.Mesh | null = null;

    console.info('Cargando STL:', fileUrl);

    loader.load(
      fileUrl,
      (geometry) => {
        console.info('STL cargado. Vértices:', geometry.attributes?.position?.count);
        geometry.computeBoundingBox();
        geometry.center();

        const material = isSVG
          ? new THREE.MeshBasicMaterial({
              color: new THREE.Color("#b3b3b3"),
            })
          : new THREE.MeshStandardMaterial({
              color: new THREE.Color("#b3b3b3"),
              metalness: 0.6,
              roughness: 0.4,
            });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Fit camera to object
        const bbox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
        cameraZ *= 1.8; // padding
        camera.position.set(0, 0, cameraZ);
        camera.near = cameraZ / 100;
        camera.far = cameraZ * 100;
        camera.updateProjectionMatrix();
        controls.update();
      },
      undefined,
      (err) => {
        console.error("Error cargando STL:", err);
      }
    );

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || widthPx;
      const h = container.clientHeight || heightPx;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const animate = () => {
      if (!renderer) return;
      controls.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", onResize);
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      controls.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        scene.remove(mesh);
      }
      if (renderer) {
        if (typeof renderer.dispose === 'function') {
          renderer.dispose();
        }
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      rendererRef.current = null;
    };
  }, [fileUrl]);

  return (
    <div ref={containerRef} style={{ height, width }} className="relative rounded-lg overflow-hidden border border-border bg-muted">
      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md text-xs text-muted-foreground border border-border pointer-events-none">
        Arrastra para rotar • Scroll para zoom
      </div>
    </div>
  );
}
