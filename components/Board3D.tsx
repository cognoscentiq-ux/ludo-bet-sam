import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { PlayerColor, GameState, Piece, PlayerState } from '../types';
import { PLAYER_COLORS, getMainPathCoords, getHomePathCoords, getBasePosition, TILE_SIZE } from '../constants';
import { Dice3D } from './Dice3D';

interface Board3DProps {
  gameState: GameState;
  onPieceClick: (piece: Piece) => void;
}

interface PieceMeshProps {
  piece: Piece;
  onClick: () => void;
  canMove: boolean;
}

const PieceMesh: React.FC<PieceMeshProps> = ({ piece, onClick, canMove }) => {
  let position: [number, number, number] = [0, 0, 0];

  if (piece.position === -1) {
    position = getBasePosition(piece.color, piece.id);
  } else if (piece.position === 999) {
    // Winner circle (center)
    position = [0, 0.5, 0];
  } else if (piece.position >= 100) {
    // Home stretch
    position = getHomePathCoords(piece.color, piece.position - 100);
  } else {
    // Main board
    position = getMainPathCoords(piece.position);
  }

  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      scale={canMove ? 1.2 : 1}
    >
      <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
      <meshStandardMaterial 
        color={PLAYER_COLORS[piece.color]} 
        emissive={canMove ? PLAYER_COLORS[piece.color] : '#000'}
        emissiveIntensity={canMove ? 0.8 : 0}
      />
    </mesh>
  );
};

const Tiles = () => {
  const tiles = [];
  // Render Main Path
  for (let i = 0; i < 52; i++) {
    const pos = getMainPathCoords(i);
    let color = '#334155';
    // Color coding start points
    if (i === 0) color = PLAYER_COLORS[PlayerColor.RED];
    if (i === 13) color = PLAYER_COLORS[PlayerColor.GREEN];
    if (i === 26) color = PLAYER_COLORS[PlayerColor.YELLOW];
    if (i === 39) color = PLAYER_COLORS[PlayerColor.BLUE];

    tiles.push(
      <mesh key={`main-${i}`} position={[pos[0], 0, pos[2]]} receiveShadow>
        <boxGeometry args={[TILE_SIZE * 0.9, 0.2, TILE_SIZE * 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  return <group>{tiles}</group>;
};

export const Board3D: React.FC<Board3DProps> = ({ gameState, onPieceClick }) => {
  
  const canClickPiece = (piece: Piece) => {
    return (
      gameState.currentPlayer === piece.color &&
      gameState.waitingForMove &&
      !gameState.isRolling
    );
  };

  return (
    <div className="w-full h-full absolute inset-0 bg-slate-900">
      <Canvas shadows camera={{ position: [0, 18, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} castShadow intensity={1} />
        <Environment preset="city" />
        
        <group>
          {/* The Board Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>

          <Tiles />

          {/* Pieces */}
          {(Object.values(gameState.players) as PlayerState[]).flatMap(player => 
            player.pieces.map((piece, idx) => (
              <PieceMesh 
                key={`${player.color}-${idx}`} 
                piece={piece} 
                onClick={() => onPieceClick(piece)}
                canMove={canClickPiece(piece)}
              />
            ))
          )}

          {/* Dice */}
          <Dice3D 
            value={gameState.diceValue} 
            rolling={gameState.isRolling} 
          />
        </group>

        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} enablePan={false} />
      </Canvas>
    </div>
  );
};