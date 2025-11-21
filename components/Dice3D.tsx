import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  position?: [number, number, number];
}

export const Dice3D: React.FC<DiceProps> = ({ value, rolling, position = [0, 2, 0] }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (rolling) {
        meshRef.current.rotation.x += delta * 15;
        meshRef.current.rotation.y += delta * 12;
        meshRef.current.rotation.z += delta * 10;
        meshRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 10) * 0.5;
      } else {
        // Settle animation
        meshRef.current.rotation.x = meshRef.current.rotation.x * 0.9;
        meshRef.current.rotation.y = meshRef.current.rotation.y * 0.9;
        meshRef.current.rotation.z = meshRef.current.rotation.z * 0.9;
        meshRef.current.position.y = 1;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Simplified dots/numbers rendering using Text for clarity in code */}
      {!rolling && value && (
        <Text
          position={[0, 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
      )}
    </group>
  );
};
