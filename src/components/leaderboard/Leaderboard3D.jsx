'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text, OrbitControls, Stars } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Scoreboard } from '@/components/game/GameUI'

function PodiumBlock({ position, color, height, name, score, place }) {
  const meshRef = useRef()
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, delta * 3)
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
        <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow>
          <boxGeometry args={[1.4, height, 1.4]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      </Float>
      <Text position={[0, height + 0.6, 0]} fontSize={0.35} color="#ffffff" anchorX="center">
        {medals[place - 1] || `#${place}`}
      </Text>
      <Text position={[0, height + 1.05, 0]} fontSize={0.28} color="#ffffff" anchorX="center" maxWidth={2}>
        {name}
      </Text>
      <Text position={[0, height + 1.45, 0]} fontSize={0.22} color="#00F5D4" anchorX="center">
        +{score} pts
      </Text>
    </group>
  )
}

function Scene({ results, players, targetScore }) {
  const sorted = [...(players || [])].sort(
    (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
  )
  const top3 = sorted.slice(0, 3)
  const heights = [2.2, 1.6, 1.1]
  const positions = [
    [0, 0, 0],
    [-2.2, 0, 0.5],
    [2.2, 0, 0.5],
  ]

  const resultMap = Object.fromEntries((results || []).map((r) => [r.playerId, r]))

  return (
    <>
      <color attach="background" args={['#0a0b14']} />
      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 8, 5]} intensity={1.2} color="#6C5CE7" />
      <pointLight position={[-4, 6, -3]} intensity={0.8} color="#00F5D4" />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={0.5} intensity={1} castShadow />

      <Text position={[0, 4.2, 0]} fontSize={0.55} color="#ffffff" anchorX="center">
        LEADERBOARD
      </Text>
      <Text position={[0, 3.6, 0]} fontSize={0.22} color="#888899" anchorX="center">
        First to {targetScore?.toLocaleString()} wins
      </Text>

      {top3.map((player, i) => {
        const result = resultMap[player.id]
        return (
          <PodiumBlock
            key={player.id}
            position={positions[i]}
            color={player.color}
            height={heights[i]}
            name={player.name}
            score={result?.pointsEarned ?? 0}
            place={i + 1}
          />
        )
      })}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={6}
        maxDistance={14}
      />
    </>
  )
}

export default function Leaderboard3D({ results, players, targetScore, accentKey, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div className="h-[420px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        <Canvas shadows camera={{ position: [0, 4, 9], fov: 45 }}>
          <Scene results={results} players={players} targetScore={targetScore} />
        </Canvas>
      </div>

      <div className="mt-4">
        <Scoreboard players={players} results={results} targetScore={targetScore} accentKey={accentKey} />
      </div>
    </div>
  )
}
