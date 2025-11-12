import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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
  const [isBasicMode, setIsBasicMode] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2d2d2d");

    const widthPx = container.clientWidth || 800;
    const heightPx = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(40, widthPx / heightPx, 0.1, 5000);
    camera.position.set(0, 0, 150);

    // Try WebGLRenderer (allows WebGL2) with high quality settings
    let renderer: any = null;
    let isSVG = false;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.setPixelRatio(window.devicePixelRatio);
      console.info('WebGLRenderer inicializado correctamente');
    } catch (error) {
      console.warn('WebGL no disponible, usando SVGRenderer como fallback:', error);
      const svgRenderer = new SVGRenderer();
      svgRenderer.setSize(widthPx, heightPx);
      renderer = svgRenderer;
      isSVG = true;
      setIsBasicMode(true);
    }

    if (!renderer) {
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600';
      overlay.textContent = 'No fue posible inicializar el visor 3D.';
      container.appendChild(overlay);
      return;
    }

    if (renderer.setSize) renderer.setSize(widthPx, heightPx);
    
    // Enable high-quality shadows for WebGL
    if (!isSVG && renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Environment map for realistic reflections (WebGL only)
    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envRT: THREE.WebGLRenderTarget | null = null;
    
    if (!isSVG) {
      try {
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        envRT = pmremGenerator.fromScene(roomEnv, 0.04);
        scene.environment = envRT.texture;
        console.info('Environment map configurado');
      } catch (e) {
        console.warn('No se pudo crear environment map:', e);
      }
    }

    // Dramatic lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.5);
    scene.add(hemiLight);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    // Main directional light with shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(60, 80, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Secondary fill light
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-40, -30, -40);
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

    // Ground plane for shadows
    let groundPlane: THREE.Mesh | null = null;
    if (!isSVG) {
      const planeGeometry = new THREE.PlaneGeometry(500, 500);
      const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
      groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.receiveShadow = true;
      scene.add(groundPlane);
    }

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
        
        // Compute smooth normals for better detail
        geometry.computeVertexNormals();

        const material = isSVG
          ? new THREE.MeshBasicMaterial({
              color: new THREE.Color("#e8e8e8"),
            })
          : new THREE.MeshPhysicalMaterial({
              color: new THREE.Color("#eaeaea"),
              metalness: 0.5,
              roughness: 0.25,
              clearcoat: 0.2,
              clearcoatRoughness: 0.6,
              envMapIntensity: 0.9,
            });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Fit camera to object and position ground plane
        const bbox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        
        // Position ground plane just below the model
        if (groundPlane) {
          groundPlane.position.y = -(size.y / 2) - (0.02 * size.y);
        }
        
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
      if (groundPlane) {
        groundPlane.geometry.dispose();
        (groundPlane.material as THREE.Material).dispose();
        scene.remove(groundPlane);
      }
      if (envRT) {
        envRT.dispose();
      }
      if (pmremGenerator) {
        pmremGenerator.dispose();
      }
      scene.environment = null;
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
      {isBasicMode && (
        <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm px-3 py-1 rounded-md text-xs text-white border border-amber-600 pointer-events-none">
          Modo básico (sin sombras ni reflejos)
        </div>
      )}
    </div>
  );
}
