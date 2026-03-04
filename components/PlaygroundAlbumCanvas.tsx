"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import * as THREE from "three";
import { Photo } from "@/lib/content";
import { safeDuration, usePrefersReducedMotion } from "@/lib/motion";
import FilterOverlay from "./FilterOverlay";
import Modal from "./Modal";
import styles from "./PlaygroundAlbumCanvas.module.scss";

type PlaygroundAlbumCanvasProps = {
  photos: Photo[];
};

type MeshRecord = {
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh;
  texture: THREE.Texture;
  photo: Photo;
};

type DragState = {
  active: boolean;
  moved: boolean;
  lastX: number;
  lastY: number;
  velocityX: number;
  velocityY: number;
};

const THRESHOLD_DISTANCE = 220;

const formatDate = (value?: string): string => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export default function PlaygroundAlbumCanvas({ photos }: PlaygroundAlbumCanvasProps) {
  const reduced = usePrefersReducedMotion();
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const recordsRef = useRef<Map<string, MeshRecord>>(new Map());
  const velocityRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const dragRef = useRef<DragState>({
    active: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0
  });

  const [targetedId, setTargetedId] = useState<string | null>(null);
  const targetedIdRef = useRef<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const activePhotoIdRef = useRef<string | null>(null);
  const filterOpenRef = useRef(false);

  const selectedLocationsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    selectedLocationsRef.current = new Set(selectedLocations);
  }, [selectedLocations]);

  useEffect(() => {
    activePhotoIdRef.current = activePhotoId;
  }, [activePhotoId]);

  useEffect(() => {
    filterOpenRef.current = filterOpen;
  }, [filterOpen]);

  const locations = useMemo(
    () => [...new Set(photos.map((photo) => photo.location))].sort((a, b) => a.localeCompare(b)),
    [photos]
  );

  const isVisible = useCallback(
    (photo: Photo) => selectedLocations.length === 0 || selectedLocations.includes(photo.location),
    [selectedLocations]
  );

  const filteredPhotos = useMemo(() => photos.filter((photo) => isVisible(photo)), [isVisible, photos]);

  const activePhoto = useMemo(
    () => filteredPhotos.find((photo) => photo.id === activePhotoId) ?? null,
    [activePhotoId, filteredPhotos]
  );

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-500, 500, 500, -500, 0.1, 4000);
    camera.position.set(0, 0, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    rendererRef.current = renderer;
    host.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const records = new Map<string, MeshRecord>();
    recordsRef.current = records;

    for (const photo of photos) {
      const texture = loader.load(photo.src);
      texture.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.PlaneGeometry(photo.world.w, photo.world.h);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(photo.world.x, photo.world.y, 0);
      scene.add(mesh);

      records.set(photo.id, { geometry, material, mesh, texture, photo });
    }

    const bounds = {
      minX: Math.min(...photos.map((photo) => photo.world.x - photo.world.w / 2)) - 280,
      maxX: Math.max(...photos.map((photo) => photo.world.x + photo.world.w / 2)) + 280,
      minY: Math.min(...photos.map((photo) => photo.world.y - photo.world.h / 2)) - 280,
      maxY: Math.max(...photos.map((photo) => photo.world.y + photo.world.h / 2)) + 280
    };

    const viewport = {
      width: 0,
      height: 0,
      frustumWidth: 1000,
      frustumHeight: 1000
    };

    const updateSize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      const aspect = width / height;
      const frustumHeight = 1000;
      const frustumWidth = frustumHeight * aspect;

      viewport.width = width;
      viewport.height = height;
      viewport.frustumWidth = frustumWidth;
      viewport.frustumHeight = frustumHeight;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
    };

    updateSize();

    const keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    };

      const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activePhotoIdRef.current) {
          setActivePhotoId(null);
          return;
        }
        if (filterOpenRef.current) {
          setFilterOpen(false);
        }
      }

      if (event.key === "Enter") {
        if (targetedIdRef.current) {
          setActivePhotoId(targetedIdRef.current);
        }
        return;
      }

      if (event.key in keyState) {
        keyState[event.key as keyof typeof keyState] = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key as keyof typeof keyState] = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragRef.current.active = true;
      dragRef.current.moved = false;
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.velocityX = 0;
      dragRef.current.velocityY = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) {
        return;
      }

      const dx = event.clientX - dragRef.current.lastX;
      const dy = event.clientY - dragRef.current.lastY;
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        dragRef.current.moved = true;
      }

      const worldPerPixelX = viewport.frustumWidth / viewport.width;
      const worldPerPixelY = viewport.frustumHeight / viewport.height;

      camera.position.x -= dx * worldPerPixelX;
      camera.position.y += dy * worldPerPixelY;

      dragRef.current.velocityX = -dx * worldPerPixelX * 0.5;
      dragRef.current.velocityY = dy * worldPerPixelY * 0.5;
    };

    const onPointerUp = () => {
      if (!dragRef.current.active) {
        return;
      }

      dragRef.current.active = false;

      if (dragRef.current.moved) {
        velocityRef.current.x += dragRef.current.velocityX;
        velocityRef.current.y += dragRef.current.velocityY;
      } else if (targetedIdRef.current) {
        setActivePhotoId(targetedIdRef.current);
      }
    };

    const clampCamera = () => {
      const halfW = viewport.frustumWidth / 2;
      const halfH = viewport.frustumHeight / 2;

      camera.position.x = Math.min(bounds.maxX - halfW, Math.max(bounds.minX + halfW, camera.position.x));
      camera.position.y = Math.min(bounds.maxY - halfH, Math.max(bounds.minY + halfH, camera.position.y));
    };

    const updateTarget = () => {
      const selectedSet = selectedLocationsRef.current;
      const targetPool = photos.filter((photo) => selectedSet.size === 0 || selectedSet.has(photo.location));

      let nearest: { id: string; distance: number } | null = null;

      for (const photo of targetPool) {
        const record = records.get(photo.id);
        if (!record) {
          continue;
        }

        const dx = record.mesh.position.x - camera.position.x;
        const dy = record.mesh.position.y - camera.position.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= THRESHOLD_DISTANCE && (!nearest || distance < nearest.distance)) {
          nearest = { id: photo.id, distance };
        }
      }

      const nextId = nearest?.id ?? null;
      if (targetedIdRef.current !== nextId) {
        targetedIdRef.current = nextId;
        setTargetedId(nextId);
      }
    };

    const tick = () => {
      const acceleration = 2.7;
      const friction = 0.9;

      if (keyState.ArrowLeft) {
        velocityRef.current.x -= acceleration;
      }
      if (keyState.ArrowRight) {
        velocityRef.current.x += acceleration;
      }
      if (keyState.ArrowUp) {
        velocityRef.current.y += acceleration;
      }
      if (keyState.ArrowDown) {
        velocityRef.current.y -= acceleration;
      }

      camera.position.x += velocityRef.current.x;
      camera.position.y += velocityRef.current.y;

      velocityRef.current.x *= friction;
      velocityRef.current.y *= friction;

      if (Math.abs(velocityRef.current.x) < 0.01) {
        velocityRef.current.x = 0;
      }
      if (Math.abs(velocityRef.current.y) < 0.01) {
        velocityRef.current.y = 0;
      }

      clampCamera();
      updateTarget();
      renderer.render(scene, camera);

      frameRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener("resize", updateSize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);

      for (const record of records.values()) {
        record.mesh.removeFromParent();
        record.geometry.dispose();
        record.material.dispose();
        record.texture.dispose();
      }
      records.clear();

      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [photos]);

  useEffect(() => {
    for (const record of recordsRef.current.values()) {
      const show = isVisible(record.photo);
      gsap.to(record.material, {
        opacity: show ? 1 : 0.08,
        duration: safeDuration(0.3, reduced),
        ease: "power2.out",
        overwrite: true
      });
    }
  }, [isVisible, reduced, selectedLocations]);

  const toggleLocation = (location: string) => {
    setSelectedLocations((previous) => {
      if (previous.includes(location)) {
        return previous.filter((item) => item !== location);
      }

      return [...previous, location];
    });
  };

  const targetedPhoto = targetedId ? photos.find((photo) => photo.id === targetedId) ?? null : null;

  const stepModal = (direction: 1 | -1) => {
    if (!activePhoto || filteredPhotos.length <= 1) {
      return;
    }

    const currentIndex = filteredPhotos.findIndex((photo) => photo.id === activePhoto.id);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + direction + filteredPhotos.length) % filteredPhotos.length;
    setActivePhotoId(filteredPhotos[nextIndex].id);
  };

  return (
    <div className={styles.root}>
      <div className={styles.canvas} ref={canvasHostRef} />

      <button type="button" className={styles.filterButton} onClick={() => setFilterOpen(true)}>
        filter
      </button>

      <FilterOverlay
        open={filterOpen}
        locations={locations}
        selected={selectedLocations}
        onToggle={toggleLocation}
        onClose={() => setFilterOpen(false)}
        onClear={() => setSelectedLocations([])}
      />

      <div className={styles.reticle} />

      {targetedPhoto ? (
        <button type="button" className={styles.targetInfo} onClick={() => setActivePhotoId(targetedPhoto.id)}>
          <span className={styles.view}>view</span>
          <strong>{targetedPhoto.location.toUpperCase()}</strong>
          <em>{targetedPhoto.album.toUpperCase()}</em>
        </button>
      ) : null}

      <Modal open={Boolean(activePhoto)} onClose={() => setActivePhotoId(null)} className={styles.modalPanel}>
        {activePhoto ? (
          <div className={styles.modalBody}>
            <div className={styles.modalImageWrap}>
              <Image src={activePhoto.src} alt={activePhoto.alt} fill sizes="(max-width: 1200px) 90vw, 1100px" className={styles.modalImage} />
            </div>

            <p className={styles.metaRow}>
              {activePhoto.location} • {activePhoto.album}
              {activePhoto.takenDate ? ` • ${formatDate(activePhoto.takenDate)}` : ""}
            </p>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => stepModal(-1)}>
                prev
              </button>
              <button type="button" onClick={() => stepModal(1)}>
                next
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
