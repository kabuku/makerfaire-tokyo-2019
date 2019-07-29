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
    ushiro: {x: -0.474, y: -0.544, z: 0.18},
    hidari: {x: 0.474, y: -0.544, z: 0.18},
    migi: {x: 0, y: -baseVector.y / 2, z: 0.18},
  },
  machineName: 'dalailama',
  arSourceOptions: {
    sourceType: 'image',
    // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
    // hostPath: 'raspberrypi-dalailama.local',
    sourceUrl: 'https://raspberrypi-dalailama.local:8080/stream/video.mjpeg',
    displayHeight: 480,
    // displayWidth: 640,
    sourceHeight: 240,
    sourceWidth: 320
    // sourceType: 'stream',
    // signalingPath: 'wss://raspberrypi-dalailama.local:8080/stream/webrtc',
    // hostPath: 'raspberrypi-dalailama.local',
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
      return deepClone(DEFAULT_GAME_OPTIONS);
    }

    try {
      return JSON.parse(gameOptionStr);
    } catch (e) {
      console.log(e);
      localStorage.removeItem(key);
      return deepClone(DEFAULT_GAME_OPTIONS);
    }
  }

  private getKeyName(robotName: string) {
    const key = `${LOCAL_STORAGE_KEY_NAME}_${robotName}`;
    return key;
  }

  set(robotName, value: GameOptions) {
    localStorage.setItem(this.getKeyName(robotName), JSON.stringify(value));
  }

}
