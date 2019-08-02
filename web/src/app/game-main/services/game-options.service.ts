import {Injectable} from '@angular/core';
import {GameOptions} from '../models/game-options';
import deepClone from '../../util/deep-clone';
import * as THREE from 'three';

const LOCAL_STORAGE_KEY_NAME = 'gameOptions';

const baseVector = new THREE.Vector3(1, 2.08, 1.92);

const DEFAULT_GAME_OPTIONS: GameOptions = {
  debug: false,
  gunColor: 'gun',
  model: {
    scale: 1.5625,
    // base 1, 2.08, 1.94
    mae: {x: 0, y: -baseVector.y / 2, z: 0},
    migi: {x: -0.474, y: -0.544, z: 0.18},
    hidari: {x: 0.474, y: -0.544, z: 0.18},
    ushiro: {x: 0, y: -baseVector.y / 2, z: 0.18},
  },
  machineName: 'dalailama',
  arSourceOptions: {
    sourceType: 'stream',
    // sourceUrl: 'https://raspberrypi-dalailama.local:8080/stream/video.mjpeg',
    displayHeight: 480,
    displayWidth: 640,
    sourceHeight: 480,
    sourceWidth: 640,
    // sourceType: 'stream',
    signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
    hostPath: 'raspberrypi-dalailama.local',
    // displayHeight: 480,
    // displayWidth: 640,
    // sourceHeight: 240,
    // sourceWidth: 320
  }
};

@Injectable({
  providedIn: 'root'
})
export class GameOptionsService {


  constructor() {
  }

  get(robotName: string): GameOptions {

    const key = this.getKeyName(robotName);

    const gameOptionStr = localStorage.getItem(key);

    if (!gameOptionStr) {
      return this.makeDefault(robotName);
    }

    try {
      return JSON.parse(gameOptionStr);
    } catch (e) {
      console.log(e);
      localStorage.removeItem(key);
      return this.makeDefault(robotName);
    }
  }

  private makeDefault(robotName: string) {
    const gameOption = deepClone(DEFAULT_GAME_OPTIONS);
    if (gameOption.arSourceOptions.sourceType === 'stream') {
      gameOption.arSourceOptions.signalingPath = `ws://raspberrypi-${robotName}.local:8080/stream/webrtc`;
      gameOption.arSourceOptions.hostPath = `raspberrypi-${robotName}.local:8080`;
    }
    return gameOption;
  }

  private getKeyName(robotName: string) {
    return `${LOCAL_STORAGE_KEY_NAME}_${robotName}`;
  }

  set(robotName, value: GameOptions) {
    localStorage.setItem(this.getKeyName(robotName), JSON.stringify(value));
  }

}
