
export type PlayerStatus = 'prepare'|'prepared'|'start'|'shot'|'hit'|'win'|'lose'|'draw'|'attack';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerState {
  lastUpdateTime: number;
  status: PlayerStatus;
  robotName: string;
  image: string|undefined;
  hp: number;
  face?: BoundingBox;
  eyes?: Point2D[];
  mouse?: Point2D;
}
