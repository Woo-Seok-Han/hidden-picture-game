import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameStartResponse, GameResult } from '../api/gameService';

interface GameSession {
  sessionId: string;
  employeeNumber: string;
  startTime: string;
}

interface GameContextType {
  session: GameSession | null;
  setSession: (session: GameSession) => void;
  clearSession: () => void;
  gameResult: GameResult | null;
  setGameResult: (result: GameResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = useCallback(() => {
    setSession(null);
    setGameResult(null);
  }, []);

  const value: GameContextType = {
    session,
    setSession,
    clearSession,
    gameResult,
    setGameResult,
    isLoading,
    setIsLoading,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext는 GameProvider 내에서 사용해야 합니다');
  }
  return context;
}
