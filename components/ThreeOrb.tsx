'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSafety } from '@/lib/safety-context';

export default function ThreeOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { threatLevel, speech } = useSafety();

  const isAlert = threatLevel === 'CRITICAL';
  const isElevated = threatLevel === 'ELEVATED';

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Glowing Wireframe Icosahedron
    const geometry = new THREE.IcosahedronGeometry(1.2, 2);
    const material = new THREE.MeshPhongMaterial({
      color: isAlert ? 0xdc2626 : isElevated ? 0xf59e0b : 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      emissive: isAlert ? 0xdc2626 : isElevated ? 0xd97706 : 0x10b981,
      emissiveIntensity: isAlert ? 0.9 : isElevated ? 0.6 : 0.4,
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    // Inner glowing core
    const innerGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: isAlert ? 0xff4d4d : isElevated ? 0xfbbf24 : 0x4edea3,
      wireframe: false,
      transparent: true,
      opacity: 0.25,
    });
    const innerOrb = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerOrb);

    const pointLight = new THREE.PointLight(isAlert ? 0xdc2626 : 0x10b981, 2, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    camera.position.z = 2.8;

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const rotSpeed = isAlert ? 0.025 : isElevated ? 0.012 : 0.005;
      orb.rotation.y += rotSpeed;
      orb.rotation.x += rotSpeed * 0.6;
      innerOrb.rotation.y -= rotSpeed * 0.8;

      // React to audio frequency
      const audioPulse = (speech.audioLevel / 100) * 0.3;
      const basePulse = Math.sin(Date.now() * (isAlert ? 0.008 : 0.002)) * 0.06;
      const scale = 1 + basePulse + audioPulse;

      orb.scale.set(scale, scale, scale);
      innerOrb.scale.set(scale * 0.8, scale * 0.8, scale * 0.8);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 200;
      const h = container.clientHeight || 200;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
    };
  }, [isAlert, isElevated, speech.audioLevel]);

  return <div ref={containerRef} className="w-full h-full" />;
}
