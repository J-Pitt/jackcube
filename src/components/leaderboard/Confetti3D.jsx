'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PALETTE = ['#00F5D4', '#6C5CE7', '#FF6B6B', '#FFD166', '#ffffff', '#43AA8B']

/**
 * GPU-friendly confetti using a single instancedMesh.
 * Particles spawn above the scene, fall with gravity, drift, and tumble.
 * When a particle drops below the floor it respawns at the top — an endless
 * celebratory shower with no per-frame allocations.
 */
export default function Confetti3D({ count = 220, area = 9, top = 9, floor = -1 }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * area * 2,
      y: top + Math.random() * top,
      z: (Math.random() - 0.5) * area,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      vrx: (Math.random() - 0.5) * 3,
      vry: (Math.random() - 0.5) * 3,
      vy: 1.6 + Math.random() * 2.4,
      drift: (Math.random() - 0.5) * 1.2,
      scale: 0.12 + Math.random() * 0.12,
    }))
  }, [count, area, top])

  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < count; i += 1) {
      c.set(PALETTE[i % PALETTE.length])
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i]
      p.y -= p.vy * dt
      p.x += p.drift * dt
      p.rx += p.vrx * dt
      p.ry += p.vry * dt
      if (p.y < floor) {
        p.y = top + Math.random() * top
        p.x = (Math.random() - 0.5) * area * 2
        p.z = (Math.random() - 0.5) * area
      }
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(p.rx, p.ry, p.rz)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1.6]} />
      <meshStandardMaterial
        side={THREE.DoubleSide}
        emissiveIntensity={0.4}
        roughness={0.4}
        metalness={0.1}
        toneMapped={false}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
    </instancedMesh>
  )
}
