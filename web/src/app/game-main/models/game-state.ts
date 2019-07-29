export interface GameState {
  status: GameStatus;
  lastUpdateTime: number;
}

export type GameStatus = 'wait' | 'prepare' | 'prepared' | 'start' | 'end';
