'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Text, Stars, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { getAccent } from '@/components/game/GameUI'
import { computeStandings } from '@/lib/standings'
import ScoreText3D from './ScoreText3D'

const MEDALS = ['🥇', '🥈', '🥉']

function MovementGlyph({ movement }) {
  if (movement === 'up') {
    return (
      <Text position={[0.95, 0, 0.75]} fontSize={0.26} color="#43F8B0" anchorX="center" anchorY="middle">
        ▲
      </Text>
    )
  }
  if (movement === 'down') {
    return (
      <Text position={[0.95, 0, 0.75]} fontSize={0.26} color="#FF6B6B" anchorX="center" anchorY="middle">
        ▼
      </Text>
    )
  }
  return null
}

function PodiumBlock({ position, color, height, entry, place, delay }) {
  const meshRef = useRef()
  const groupRef = useRef()

  useFrame((state, delta) => {
    const mesh = meshRef.current
    const group = groupRef.current
    if (mesh) {
      // Rise from flat to full height.
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 1, delta * 3)
    }
    if (group) {
      const target = state.clock.elapsedTime > delay ? 1 : 0
      group.scale.x = THREE.MathUtils.lerp(group.scale.x, target, delta * 5)
      group.scale.z = THREE.MathUtils.lerp(group.scale.z, target, delta * 5)
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, height / 2, 0]} scale={[1, 0.02, 1]} castShadow receiveShadow>
        <boxGeometry args={[1.5, height, 1.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.32}
          metalness={0.45}
          roughness={0.28}
        />
      </mesh>

      {/* Place number engraved on the podium face */}
      <Text position={[0, height / 2, 0.78]} fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle">
        {place}
      </Text>

      {/* Floating player card */}
      <group ref={groupRef} position={[0, height + 1.15, 0]} scale={[0, 1, 0]}>
        <Float speed={2} rotationIntensity={0.15} floatIntensity={0.5}>
          <RoundedBox args={[1.9, 1.15, 0.12]} radius={0.12} smoothness={4}>
            <meshStandardMaterial color="#12141F" emissive={color} emissiveIntensity={0.12} metalness={0.2} roughness={0.5} />
          </RoundedBox>
          <Text position={[0, 0.32, 0.08]} fontSize={0.34} anchorX="center" anchorY="middle">
            {MEDALS[place - 1] || `#${place}`}
          </Text>
          <Text
            position={[0, -0.02, 0.08]}
            fontSize={0.24}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.7}
          >
            {entry.name}
          </Text>
          <ScoreText3D
            position={[0, -0.36, 0.08]}
            value={entry.currentTotal}
            from={entry.previousTotal}
            duration={1.2}
            delay={0.2}
            fontSize={0.22}
            color={color}
            anchorX="center"
            anchorY="middle"
          />
          <MovementGlyph movement={entry.movement} />
        </Float>
      </group>
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const intro = useRef(0)
  const angle = useRef(0)
  useFrame((_, delta) => {
    // Intro dolly-in over ~1.4s, then settle into a slow auto-orbit.
    intro.current = Math.min(1, intro.current + delta / 1.4)
    const ease = 1 - Math.pow(1 - intro.current, 3)
    const radius = THREE.MathUtils.lerp(15, 9.5, ease)
    const height = THREE.MathUtils.lerp(7, 4, ease)
    // Accumulate orbit angle smoothly once the intro has mostly finished.
    if (intro.current >= 0.95) angle.current += delta * 0.18
    camera.position.set(Math.sin(angle.current) * radius, height, Math.cos(angle.current) * radius)
    camera.lookAt(0, 2, 0)
  })
  return null
}

function Scene({ players, results, targetScore, accentHex }) {
  const { standings } = useMemo(
    () => computeStandings(players, results),
    [players, results]
  )
  const top3 = standings.slice(0, 3)
  const heights = [2.4, 1.7, 1.15]
  const positions = [
    [0, 0, 0],
    [-2.4, 0, 0.4],
    [2.4, 0, 0.4],
  ]

  return (
    <>
      <color attach="background" args={['#0a0b14']} />
      <fog attach="fog" args={['#0a0b14', 12, 26]} />
      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 8, 5]} intensity={1.2} color="#6C5CE7" />
      <pointLight position={[-4, 6, -3]} intensity={0.9} color={accentHex} />
      <spotLight position={[0, 11, 2]} angle={0.6} penumbra={0.6} intensity={1.3} castShadow />

      <Text position={[0, 4.5, 0]} fontSize={0.62} color="#ffffff" anchorX="center" letterSpacing={0.08}>
        LEADERBOARD
      </Text>
      {targetScore ? (
        <Text position={[0, 3.85, 0]} fontSize={0.22} color="#8a8a9a" anchorX="center">
          First to {targetScore.toLocaleString()} wins
        </Text>
      ) : null}

      {top3.map((entry, i) => (
        <PodiumBlock
          key={entry.id}
          position={positions[i]}
          color={entry.color || accentHex}
          height={heights[i]}
          entry={entry}
          place={i + 1}
          delay={0.3 + i * 0.25}
        />
      ))}

      {/* Floor reflection plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0b14" metalness={0.6} roughness={0.7} />
      </mesh>

      <CameraRig />
    </>
  )
}

export default function Podium3D({ players, results, targetScore, accentKey }) {
  const accent = getAccent(accentKey)
  return (
    <Canvas shadows camera={{ position: [0, 4, 9], fov: 45 }} dpr={[1, 2]}>
      <Scene players={players} results={results} targetScore={targetScore} accentHex={accent.hex} />
    </Canvas>
  )
}
