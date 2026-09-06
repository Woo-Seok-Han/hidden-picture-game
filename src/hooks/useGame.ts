import { useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import {
  startGame as apiStartGame,
  submitGameAnswers as apiSubmitAnswers,
  completeGame as apiCompleteGame,
  type Answer,
} from '../api/gameService';

type StartGameResult =
  | { ok: true }
  | { ok: false; message: string };

export function useGameSession() {
  const { session, setSession, isLoading, setIsLoading } = useGameContext();

  const startGame = useCallback(
    async (employeeNumber: string): Promise<StartGameResult> => {
      setIsLoading(true);
      try {
        const response = await apiStartGame(employeeNumber);
        if (response) {
          setSession({
            sessionId: response.sessionId,
            employeeNumber: response.employeeNumber,
            startTime: response.startTime,
          });
          return { ok: true };
        }
        return { ok: false, message: '게임을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.' };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : '게임을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, setIsLoading]
  );

  return { session, startGame, isLoading };
}

export function useGameAnswers() {
  const { session, setGameResult, isLoading, setIsLoading } = useGameContext();

  const submitAnswers = useCallback(
    async (answers: Answer[]) => {
      if (!session) {
        console.error('게임 세션이 없습니다');
        return false;
      }

      setIsLoading(true);
      try {
        const result = await apiSubmitAnswers(session.sessionId, answers);
        if (result) {
          setGameResult(result);
          return true;
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, setGameResult, setIsLoading]
  );

  const completeGame = useCallback(
    async () => {
      if (!session) {
        console.error('게임 세션이 없습니다');
        return false;
      }

      setIsLoading(true);
      try {
        const result = await apiCompleteGame(session.sessionId);
        if (result) {
          setGameResult(result);
          return true;
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session, setGameResult, setIsLoading]
  );

  return { submitAnswers, completeGame, isLoading };
}
