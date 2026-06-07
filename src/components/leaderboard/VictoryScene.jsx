'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Text, Stars, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { getAccent } from '@/components/game/GameUI'
import { computeStandings } from '@/lib/standings'
import ScoreText3D from './ScoreText3D'
import Confetti3D from './Confetti3D'

function Trophy({ color }) {
  // Simple stylised trophy: cup (lathe-ish via cylinder), stem, base, handles.
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.42, 0.26, 0.6, 24]} />
        <meshStandardMaterial color="#FFD166" emissive="#FFB703" emissiveIntensity={0.5} metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.28, 16]} />
        <meshStandardMaterial color="#FFD166" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.14, 24]} />
        <meshStandardMaterial color="#E0A82E" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]} rotation={[0, 0, x < 0 ? -0.6 : 0.6]}>
          <torusGeometry args={[0.16, 0.04, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#FFD166" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      <pointLight position={[0, 0.6, 0.6]} intensity={0.8} color={color} distance={4} />
    </group>
  )
}

function WinnerColumn({ winner, accentHex }) {
  const meshRef = useRef()
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, delta * 2.5)
    }
  })
  const color = winner?.color || accentHex
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef} position={[0, 1.4, 0]} scale={[1, 0.02, 1]} castShadow>
        <boxGeometry args={[2, 2.8, 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.5} roughness={0.25} />
      </mesh>

      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <group position={[0, 3.5, 0]}>
          {/* Crown */}
          <Text position={[0, 0.95, 0]} fontSize={0.9} anchorX="center" anchorY="middle">
            👑
          </Text>
          <Trophy color={color} />
        </group>
      </Float>

      <Sparkles count={60} scale={[5, 5, 5]} position={[0, 4, 0]} size={4} speed={0.4} color={accentHex} />

      <Text position={[0, 1.5, 1.02]} fontSize={0.85} color="#ffffff" anchorX="center" anchorY="middle">
        1
      </Text>
    </group>
  )
}

function CameraOrbit() {
  const { camera } = useThree()
  const started = useRef(false)
  useFrame((state, delta) => {
    if (!started.current) {
      camera.position.set(0, 10, 16)
      started.current = true
    }
    const t = state.clock.elapsedTime
    const targetX = Math.sin(t * 0.25) * 2.2
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 1.5)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.5, delta * 1.5)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 9.5, delta * 1.5)
    camera.lookAt(0, 3, 0)
  })
  return null
}

function Scene({ players, results, winnerId, accentHex }) {
  const { standings, winner } = useMemo(
    () => computeStandings(players, results, { winnerId }),
    [players, results, winnerId]
  )
  const champ = winner || standings[0] || null

  return (
    <>
      <color attach="background" args={['#0a0b14']} />
      <fog attach="fog" args={['#0a0b14', 14, 30]} />
      <Stars radius={90} depth={50} count={4000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 9, 6]} intensity={1.3} color="#6C5CE7" />
      <pointLight position={[-5, 7, -3]} intensity={1} color={accentHex} />
      <spotLight position={[0, 14, 3]} angle={0.5} penumbra={0.7} intensity={2} color="#ffffff" castShadow />

      <Text position={[0, 6, 0]} fontSize={0.5} color={accentHex} anchorX="center" letterSpacing={0.18}>
        CHAMPION
      </Text>

      {champ ? (
        <>
          <WinnerColumn winner={champ} accentHex={accentHex} />
          <Text position={[0, 5.1, 0]} fontSize={0.72} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={8}>
            {champ.name}
          </Text>
          <ScoreText3D
            position={[0, 0.55, 0]}
            value={champ.currentTotal}
            from={0}
            duration={1.8}
            delay={0.3}
            suffix=" pts"
            fontSize={0.4}
            color={accentHex}
            anchorX="center"
            anchorY="middle"
          />
        </>
      ) : null}

      <Confetti3D count={240} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a0b14" metalness={0.65} roughness={0.65} />
      </mesh>

      <CameraOrbit />
    </>
  )
}

export default function VictoryScene({ players, results, winnerId, accentKey }) {
  const accent = getAccent(accentKey)
  return (
    <Canvas shadows camera={{ position: [0, 4.5, 9.5], fov: 48 }} dpr={[1, 2]}>
      <Scene players={players} results={results} winnerId={winnerId} accentHex={accent.hex} />
    </Canvas>
  )
}
