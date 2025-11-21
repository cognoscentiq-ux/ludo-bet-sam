import { PlayerColor } from './types';

// 15x15 Grid Logic
// Center is 0,0. Tile size 1.
export const TILE_SIZE = 1.2;

export const PLAYER_COLORS = {
  [PlayerColor.RED]: '#ef4444',
  [PlayerColor.GREEN]: '#22c55e',
  [PlayerColor.YELLOW]: '#eab308',
  [PlayerColor.BLUE]: '#3b82f6',
};

export const START_OFFSETS = {
  [PlayerColor.RED]: 0,
  [PlayerColor.GREEN]: 13,
  [PlayerColor.YELLOW]: 26,
  [PlayerColor.BLUE]: 39,
};

// Mapping indices 0-51 to grid coordinates (x, z)
// This mimics the outer path of a Ludo board
export const getMainPathCoords = (index: number): [number, number, number] => {
  // Simplified Loop for visualization: A square loop
  // 0-12: Bottom side (Left to Right)
  // 13-25: Right side (Bottom to Top)
  // 26-38: Top side (Right to Left)
  // 39-51: Left side (Top to Bottom)
  
  const offset = 6.5 * TILE_SIZE;
  const step = TILE_SIZE;
  
  // This is an approximation of the visual path for the 3D scene
  if (index < 6) return [(index * step) - offset, 0, offset]; // Bottom-Left -> Bottom-Mid
  if (index < 12) return [(index * step) - offset, 0, offset]; // Bottom-Mid -> Bottom-Right (Simplified straight line for demo)
  
  // Let's do a simpler perimeter path for the 3D viz to ensure it looks clean
  // 52 tiles total.
  const sideLength = 13;
  const half = (sideLength * step) / 2;

  if (index < 13) { // Bottom edge: Left to Right
    return [-half + (index * step), 0.1, half];
  } else if (index < 26) { // Right edge: Bottom to Top
    return [half, 0.1, half - ((index - 13) * step)];
  } else if (index < 39) { // Top edge: Right to Left
    return [half - ((index - 26) * step), 0.1, -half];
  } else { // Left edge: Top to Bottom
    return [-half, 0.1, -half + ((index - 39) * step)];
  }
};

export const getHomePathCoords = (color: PlayerColor, step: number): [number, number, number] => {
  // step 0-5 into the center
  const dist = (5 - step) * TILE_SIZE;
  
  switch (color) {
    case PlayerColor.RED: // Coming from left
      return [-dist, 0.15, 0];
    case PlayerColor.GREEN: // Coming from bottom (based on start offset 13)
      return [0, 0.15, dist]; 
    case PlayerColor.YELLOW: // Coming from right
      return [dist, 0.15, 0];
    case PlayerColor.BLUE: // Coming from top
      return [0, 0.15, -dist];
  }
  return [0, 0, 0];
};

export const getBasePosition = (color: PlayerColor, pieceIdx: number): [number, number, number] => {
  const baseDist = 5 * TILE_SIZE;
  const offset = pieceIdx === 0 ? -0.5 : 0.5;
  switch (color) {
    case PlayerColor.RED: return [-baseDist + offset, 0.2, baseDist + offset];
    case PlayerColor.GREEN: return [baseDist + offset, 0.2, baseDist + offset];
    case PlayerColor.YELLOW: return [baseDist + offset, 0.2, -baseDist + offset];
    case PlayerColor.BLUE: return [-baseDist + offset, 0.2, -baseDist + offset];
  }
};
