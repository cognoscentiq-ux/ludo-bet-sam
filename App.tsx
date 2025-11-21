import React, { useState, useEffect, useCallback } from 'react';
import { PlayerColor, GameState, WalletState, Piece, Bet } from './types';
import { Board3D } from './components/Board3D';
import { generateCommentary } from './services/geminiService';
import { Dice5, Trophy, Coins, AlertCircle } from 'lucide-react';
import { START_OFFSETS, PLAYER_COLORS } from './constants';

// --- Initial States ---
const INITIAL_WALLET: WalletState = {
  balance: 1000,
  currentBet: null,
};

const INITIAL_GAME_STATE: GameState = {
  players: {
    [PlayerColor.RED]: { color: PlayerColor.RED, pieces: [{ id: 0, color: PlayerColor.RED, position: -1, stepsTaken: 0 }, { id: 1, color: PlayerColor.RED, position: -1, stepsTaken: 0 }], hasFinished: false },
    [PlayerColor.GREEN]: { color: PlayerColor.GREEN, pieces: [{ id: 0, color: PlayerColor.GREEN, position: -1, stepsTaken: 0 }, { id: 1, color: PlayerColor.GREEN, position: -1, stepsTaken: 0 }], hasFinished: false },
    [PlayerColor.YELLOW]: { color: PlayerColor.YELLOW, pieces: [{ id: 0, color: PlayerColor.YELLOW, position: -1, stepsTaken: 0 }, { id: 1, color: PlayerColor.YELLOW, position: -1, stepsTaken: 0 }], hasFinished: false },
    [PlayerColor.BLUE]: { color: PlayerColor.BLUE, pieces: [{ id: 0, color: PlayerColor.BLUE, position: -1, stepsTaken: 0 }, { id: 1, color: PlayerColor.BLUE, position: -1, stepsTaken: 0 }], hasFinished: false },
  },
  currentPlayer: PlayerColor.RED,
  diceValue: null,
  isRolling: false,
  waitingForMove: false,
  winner: null,
  turnLog: ["Welcome to Neon Ludo Bet! Place your bets!"],
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [betModalOpen, setBetModalOpen] = useState(true);
  const [commentary, setCommentary] = useState<string>("");

  // --- Game Logic Helpers ---

  const getNextPlayer = (current: PlayerColor): PlayerColor => {
    const colors = [PlayerColor.RED, PlayerColor.GREEN, PlayerColor.YELLOW, PlayerColor.BLUE];
    const idx = colors.indexOf(current);
    return colors[(idx + 1) % 4];
  };

  const checkWinCondition = (playerColor: PlayerColor, pieces: Piece[]): boolean => {
    return pieces.every(p => p.position === 999);
  };

  const rollDice = async () => {
    if (gameState.isRolling || gameState.waitingForMove || gameState.winner) return;

    setGameState(prev => ({ ...prev, isRolling: true }));
    
    // Simulate roll duration
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      
      setGameState(prev => {
        // Check if user has valid moves
        const player = prev.players[prev.currentPlayer];
        const hasValidMoves = player.pieces.some(p => canMovePiece(p, roll, player.pieces));

        const nextState = {
          ...prev,
          isRolling: false,
          diceValue: roll,
          waitingForMove: hasValidMoves,
        };

        // AI Commentary trigger
        generateCommentary(nextState, `${prev.currentPlayer} rolled a ${roll}`).then(setCommentary);

        return nextState;
      });
    }, 1500);
  };

  // Auto-pass turn if no moves available
  useEffect(() => {
    if (!gameState.isRolling && !gameState.waitingForMove && gameState.diceValue !== null && !gameState.winner) {
      const timer = setTimeout(() => {
        handleTurnEnd();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.waitingForMove, gameState.isRolling, gameState.diceValue]);

  const handleTurnEnd = () => {
    setGameState(prev => {
      const nextPlayer = getNextPlayer(prev.currentPlayer);
      return {
        ...prev,
        currentPlayer: nextPlayer,
        diceValue: null,
        waitingForMove: false,
      };
    });
  };

  const canMovePiece = (piece: Piece, roll: number, allMyPieces: Piece[]): boolean => {
    if (roll === 6 && piece.position === -1) return true; // Start condition
    if (piece.position === -1) return false;
    if (piece.position === 999) return false; // Already finished

    // Check home stretch logic
    const stepsToFinish = 56; // 51 (board) + 5 (home) approx logic
    // Logic simplified:
    // Main track length 52.
    // Player enters home stretch after walking 51 steps.
    
    if (piece.stepsTaken + roll > 57) return false; // Overshoot home
    return true;
  };

  const movePiece = (targetPiece: Piece) => {
    if (!gameState.waitingForMove || !gameState.diceValue) return;
    if (targetPiece.color !== gameState.currentPlayer) return;
    
    const roll = gameState.diceValue;
    
    setGameState(prev => {
      const player = prev.players[prev.currentPlayer];
      if (!canMovePiece(targetPiece, roll, player.pieces)) return prev;

      const newPieces = player.pieces.map(p => {
        if (p.id !== targetPiece.id) return p;

        let newPos = p.position;
        let newSteps = p.stepsTaken + roll;

        // Logic for moving from base
        if (p.position === -1) {
          if (roll === 6) {
            newPos = START_OFFSETS[prev.currentPlayer];
            newSteps = 0; // Reset steps when entering board? Or just count 1? Let's start fresh.
          }
        } else {
          // Moving on board
          // Check if entering home stretch
          // Total main path is 52. 
          
          // Complex Ludo path logic simplified:
          // We simply track stepsTaken. 
          // If stepsTaken < 51: moves on main board (wrap 52).
          // If stepsTaken >= 51: enters/moves in home stretch (100+)
          
          const stepsOnBoardLimit = 50; // How many steps around before entering home? 51 usually.
          
          if (p.stepsTaken + roll > stepsOnBoardLimit) {
            // Enter or advance in home
            const stepsInHome = (p.stepsTaken + roll) - stepsOnBoardLimit;
            if (stepsInHome === 6) {
               newPos = 999; // Home!
            } else {
               newPos = 100 + stepsInHome - 1; // 100, 101, 102...
            }
          } else {
            // Normal move
            newPos = (p.position + roll) % 52;
          }
        }
        return { ...p, position: newPos, stepsTaken: newSteps };
      });

      // Check for Captures (if landed on main board)
      // Note: Ignoring safe zones for MVP simplification
      const landedPos = newPieces.find(p => p.id === targetPiece.id)?.position;
      let logMsg = `${prev.currentPlayer} moved ${roll} steps.`;
      const updatedPlayers = { ...prev.players, [prev.currentPlayer]: { ...player, pieces: newPieces } };

      if (landedPos !== undefined && landedPos < 100 && landedPos !== -1) {
         // Check collision with enemies
         (Object.keys(updatedPlayers) as PlayerColor[]).forEach(enemyColor => {
           if (enemyColor !== prev.currentPlayer) {
             const enemy = updatedPlayers[enemyColor];
             const enemyPieces = enemy.pieces.map(ep => {
               if (ep.position === landedPos) {
                 logMsg += ` Captured ${enemyColor}!`;
                 return { ...ep, position: -1, stepsTaken: 0 }; // Send home
               }
               return ep;
             });
             updatedPlayers[enemyColor] = { ...enemy, pieces: enemyPieces, hasFinished: enemy.hasFinished };
           }
         });
      }

      // Check Win
      let winner = prev.winner;
      if (checkWinCondition(prev.currentPlayer, newPieces)) {
        winner = prev.currentPlayer;
        logMsg = `${prev.currentPlayer} WINS!`;
        // Settle Bets
        handleGameEnd(winner);
      }

      // AI Commentary
      generateCommentary({ ...prev, players: updatedPlayers }, logMsg).then(setCommentary);

      // If rolled 6, play again. Else next player.
      const isSix = roll === 6;

      return {
        ...prev,
        players: updatedPlayers,
        waitingForMove: false,
        currentPlayer: (isSix && !winner) ? prev.currentPlayer : getNextPlayer(prev.currentPlayer),
        diceValue: null, // Reset dice immediately after move processed? Or wait? Let's reset.
        winner: winner,
        turnLog: [logMsg, ...prev.turnLog.slice(0, 4)],
      };
    });
  };

  const handleGameEnd = (winner: PlayerColor) => {
    if (wallet.currentBet && wallet.currentBet.playerColor === winner) {
      setWallet(prev => ({
        ...prev,
        balance: prev.balance + (prev.currentBet!.amount * 4), // 4x payout
        currentBet: null
      }));
      alert(`YOU WON! Payout: ${wallet.currentBet.amount * 4}`);
    } else if (wallet.currentBet) {
      alert(`You lost your bet on ${wallet.currentBet.playerColor}.`);
      setWallet(prev => ({ ...prev, currentBet: null }));
    }
  };

  const placeBet = (color: PlayerColor, amount: number) => {
    if (amount > wallet.balance) return;
    setWallet(prev => ({
      balance: prev.balance - amount,
      currentBet: { playerColor: color, amount }
    }));
    setBetModalOpen(false);
  };

  // --- Render ---

  return (
    <div className="w-full h-full relative bg-slate-950 text-white select-none">
      
      {/* 3D Scene Layer */}
      <Board3D gameState={gameState} onPieceClick={movePiece} />

      {/* UI Overlay Layer */}
      
      {/* Header / Wallet */}
      <div className="absolute top-4 left-4 z-10 bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 uppercase tracking-wider">
            Neon Ludo
          </h1>
          <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full border border-yellow-500/30">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-mono font-bold text-yellow-400">${wallet.balance}</span>
          </div>
        </div>
        {wallet.currentBet && (
          <div className="mt-2 text-xs text-gray-400">
            Bet: ${wallet.currentBet.amount} on <span style={{ color: PLAYER_COLORS[wallet.currentBet.playerColor] }}>{wallet.currentBet.playerColor}</span>
          </div>
        )}
      </div>

      {/* AI Commentary Box */}
      <div className="absolute top-4 right-4 z-10 max-w-sm w-full pointer-events-none">
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">AI Caster Live</span>
          </div>
          <p className="text-sm italic text-gray-200 leading-relaxed">"{commentary || "Game starting..."}"</p>
        </div>
      </div>

      {/* Turn Indicator & Dice Control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-4">
        {gameState.winner ? (
          <div className="bg-yellow-500/90 p-8 rounded-2xl text-center backdrop-blur animate-bounce">
            <Trophy className="w-12 h-12 text-black mx-auto mb-2" />
            <h2 className="text-3xl font-black text-black">{gameState.winner} WINS!</h2>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
             <div className="bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-700 mb-4">
                <span className="text-sm text-gray-400 mr-2">Current Turn:</span>
                <span className="font-bold text-lg" style={{ color: PLAYER_COLORS[gameState.currentPlayer] }}>
                  {gameState.currentPlayer}
                </span>
             </div>
             
             <button
              disabled={gameState.isRolling || gameState.waitingForMove}
              onClick={rollDice}
              className={`
                group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                ${(gameState.isRolling || gameState.waitingForMove) 
                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:scale-110 hover:shadow-[0_0_30px_rgba(129,140,248,0.6)]'
                }
              `}
            >
              <Dice5 className={`w-10 h-10 text-white ${gameState.isRolling ? 'animate-spin' : ''}`} />
              {!gameState.isRolling && !gameState.waitingForMove && (
                <span className="absolute -bottom-8 text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  ROLL
                </span>
              )}
            </button>
            
            {gameState.waitingForMove && (
              <div className="mt-4 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg animate-pulse">
                Tap a piece to move!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Betting Modal */}
      {betModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-white">Place Your Bet</h2>
            <p className="text-gray-400 mb-6 text-sm">Choose a winner. Odds are fixed at 4x.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.values(PlayerColor).map((color) => (
                <button
                  key={color}
                  onClick={() => placeBet(color, 100)}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-gray-500 transition-all"
                >
                  <div className="w-8 h-8 rounded-full mb-2 shadow-lg" style={{ backgroundColor: PLAYER_COLORS[color] }} />
                  <span className="font-bold text-sm">{color}</span>
                  <span className="text-xs text-gray-500 mt-1">Bet $100</span>
                </button>
              ))}
            </div>
            
            <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
               <p className="text-xs text-yellow-200">
                 This is a simulation. No real money is involved. AI Commentary is enabled.
               </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Log (Mini) */}
      <div className="absolute bottom-4 right-4 z-0 w-64 pointer-events-none hidden md:block opacity-50 hover:opacity-100 transition-opacity">
         <div className="space-y-1 text-right">
           {gameState.turnLog.map((log, i) => (
             <div key={i} className="text-xs font-mono text-gray-400">{log}</div>
           ))}
         </div>
      </div>
    </div>
  );
}
