interface BaseArSourceOptions extends Partial<THREEx.ArToolkitSourceOptions> {
  sourceType: 'webcam' | 'video' | 'image' | 'stream';
}

interface WebcamArSourceOptions extends BaseArSourceOptions {
  sourceType: 'webcam';
}

interface ExternalSourceArSourceOptions extends BaseArSourceOptions {
  sourceType: 'video' | 'image';
  sourceUrl: string;
}

interface StreamArSourceOptions extends BaseArSourceOptions {
  sourceType: 'stream';
  stream?: MediaStream;

  hostPath: string;
  signalingPath: string;
}

export type ArSourceOptions = ExternalSourceArSourceOptions | WebcamArSourceOptions | StreamArSourceOptions;

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Model {
  scale: number;
  mae: Position;
  migi: Position;
  hidari: Position;
  ushiro: Position;
}

export interface GameOptions {
  debug: boolean;
  gunColor: 'gun'|'gun1';
  machineName: string;
  model: Model;
  arSourceOptions: ArSourceOptions;
}
