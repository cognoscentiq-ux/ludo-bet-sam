export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export interface Piece {
  id: number;
  color: PlayerColor;
  position: number; // -1 for start, 0-51 for main track, 100-105 for home stretch, 999 for home
  stepsTaken: number; // Total steps taken to calculate home stretch entry
}

export interface PlayerState {
  color: PlayerColor;
  pieces: Piece[];
  hasFinished: boolean;
}

export interface GameState {
  players: Record<PlayerColor, PlayerState>;
  currentPlayer: PlayerColor;
  diceValue: number | null;
  isRolling: boolean;
  waitingForMove: boolean;
  winner: PlayerColor | null;
  turnLog: string[];
}

export interface Bet {
  playerColor: PlayerColor;
  amount: number;
}

export interface WalletState {
  balance: number;
  currentBet: Bet | null;
}