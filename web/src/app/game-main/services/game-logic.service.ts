import {Injectable} from '@angular/core';
import {PlayerState, PlayerStatus} from '../models/player-state';
import {Subject} from 'rxjs';
import {map, pairwise, startWith} from 'rxjs/operators';
import deepClone from '../../util/deep-clone';
import {Client, connect} from 'mqtt';
import {GameState, GameStatus} from '../models/game-state';
import {SoundEngineService} from './sound-engine.service';
import {WebrtcConnectionService} from "./webrtc-connection.service";

type TimePlayerState = [number, PlayerState];
type TimeGameState = [number, GameState];

interface BaseUpdatePlayerStateParams {
  status: PlayerStatus;
  value: any;
}

interface BasicUpdatePlayerStateParams extends BaseUpdatePlayerStateParams {
  status: 'prepare' | 'start' | 'shot' | 'win' | 'lose'| 'draw' | 'attack';
  value: undefined;
}

export interface FinishPrepareResult {
  image: string;
  face: {
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    landmarks: {type: LandmarkType, locations: Point2D[]}[]
  };
}

interface PreparedUpdatePlayerStateParams extends BaseUpdatePlayerStateParams {
  status: 'prepared';
  value: FinishPrepareResult; // image & face
}

interface HitUpdatePlayerStateParams extends BaseUpdatePlayerStateParams {
  status: 'hit';
  value: number; // hp
}

export type UpdatePlayerStateParams = BasicUpdatePlayerStateParams | PreparedUpdatePlayerStateParams | HitUpdatePlayerStateParams;


@Injectable({
  providedIn: 'root'
})
export class GameLogicService {
  mqttClient: Client;
  private gameState: GameState = {
    status: 'wait',
    lastUpdateTime: 0,
  };
  private timeGameState = new Subject<TimeGameState>();
  gameState$ = this.timeGameState.pipe(
    startWith([0, this.gameState] as TimeGameState),
    pairwise(),
    map(([[prevTime, prevState], [time, state]]) => {
      if (prevTime > time) {
        return prevState;
      } else {
        // assign new memory to fire observable
        state.lastUpdateTime = time;
        return deepClone(state);
      }
    }),
  );

  private myState: PlayerState = {
    hp: 100,
    image: undefined,
    lastUpdateTime: 0,
    status: 'prepare',
    robotName: ''
  };
  private timeMyStateSubject = new Subject<TimePlayerState>();
  myState$ = this.timeMyStateSubject.pipe(
    startWith([0, this.myState] as TimePlayerState),
    pairwise(),
    map(([[prevTime, prevState], [time, state]]) => {
      if (prevTime > time) {
        return prevState;
      } else {
        state.lastUpdateTime = time;
        return deepClone(state);
      }
    }),
  );

  private enemyState: PlayerState = {
    hp: 100,
    image: undefined,
    lastUpdateTime: 0,
    status: 'prepare',
    robotName: ''
  };
  private timeEnemyStateSubject = new Subject<TimePlayerState>();
  enemyState$ = this.timeEnemyStateSubject.pipe(
    startWith([0, this.enemyState] as TimePlayerState),
    pairwise(),
    map(([[prevTime, prevState], [time, state]]) => {
      if (prevTime > time) {
        return prevState;
      } else {
        state.lastUpdateTime = time;
        return deepClone(state);
      }
    }),
  );

  button$ = new Subject<string>();

  handleMQTTMessage = (topic: string, payload: Buffer) => {
    const val = payload.toString();
    console.log('handle mqtt message', topic, val);
    if (topic === 'game/status') {
      const [dateStr, gameStatus] = val.split(',');
      this.gameState.status = gameStatus as GameStatus;
      this.timeGameState.next([new Date(dateStr).getTime(), this.gameState]);
      return;
    } else if (topic === `${this.myState.robotName}/status`) {
      this.processUpdatePlayerStatus(val, this.myState, this.timeMyStateSubject);
    } else if (topic === `${this.enemyState.robotName}/status`) {
      this.processUpdatePlayerStatus(val, this.enemyState, this.timeEnemyStateSubject);
    } else if (topic === `${this.myState.robotName}/controller/button`) {
      const [, button] = val.split(',');
      this.button$.next(button);

      if (button === '3' || button === '11' ) {
        if (this.gameState.status === 'wait') {
          this.updateGameStatus('prepare');
        } else if (this.gameState.status === 'prepare'
          && this.myState.status === 'prepared'
          && this.enemyState.status === 'prepared'
        ) {
          this.updateGameStatus('prepared');
        } else if (button === '11' && this.gameState.status === 'prepared') {
          this.updateGameStatus('start');
        }
      } else if (button === '8') {
        this.webrtc.hangup();
      }
    }
  }

  async init({mqttBrokerHost, myRobotName, enemyRobotName}): Promise<Client> {
    this.myState.robotName = myRobotName;
    this.enemyState.robotName = enemyRobotName;
    this.mqttClient = connect(`mqtt://${mqttBrokerHost}:9001`);
    return new Promise((resolve, reject) => this.mqttClient.on('connect', () => {

      this.timeMyStateSubject.next([0, this.myState]);
      this.timeEnemyStateSubject.next([0, this.enemyState]);
      this.timeGameState.next([0, this.gameState]);

      this.mqttClient.subscribe('game/status');
      this.mqttClient.subscribe('robot-name');
      this.mqttClient.subscribe(`${myRobotName}/status`);
      this.mqttClient.subscribe(`${enemyRobotName}/status`);
      this.mqttClient.subscribe(`${myRobotName}/controller/button`);
      this.mqttClient.on('message', this.handleMQTTMessage);
      resolve(this.mqttClient);
    }).on('error', err => reject(err)));
  }

  updateGameStatus(status: GameStatus) {

    if (status === 'prepare') {
      this.se.play('select', 0, 0.35);
    }

    this.mqttClient.publish('game/status', `${new Date().toISOString()},${status}`);
  }

  updatePlayerState(params: UpdatePlayerStateParams) {
    this.updateState(params, this.myState.robotName);
  }
  updateEnemyState(params: UpdatePlayerStateParams) {
    this.updateState(params, this.enemyState.robotName);
  }

  private updateState(params: UpdatePlayerStateParams, robotName) {
    console.log(robotName, params);
    if (params.status === 'prepared') {
      const {image, face} = params.value;
      const {x, y, width, height} = face.boundingBox;
      const eyes = face.landmarks.filter(l => l.type === 'eye').map(l => l.locations[0]).map(l => [l.x, l.y].join(',')).join(',');
      const mouse = face.landmarks.find(l => l.type === 'mouth');

      const value = `${x},${y},${width},${height},${eyes},${mouse.locations[0].x},${mouse.locations[0].y},${image}`;

      this.mqttClient.publish(`${robotName}/status`, `${new Date().toISOString()},${params.status},${value}`);
    } else {
      this.mqttClient.publish(`${robotName}/status`, `${new Date().toISOString()},${params.status},${params.value}`);
    }
  }

  private processUpdatePlayerStatus(payload: string, state: PlayerState, subject: Subject<TimePlayerState>) {

    const newState = deepClone(state);
    const [dateStr, playerStatus, ...val] = payload.split(',') as [string, PlayerStatus, string[]];
    const value = val.join(',');
    const time = new Date(dateStr).getTime();
    newState.status = playerStatus;

    if (!['prepared', 'start', 'end'].includes(this.gameState.status)
      && ['shot', 'hit', 'win', 'lose', 'draw', 'attack'].includes(playerStatus)) {
      return;
    }

    if (playerStatus === 'prepare') {
      newState.image = undefined;
      newState.hp = 100;
      newState.face = undefined;
      newState.mouse = undefined;
      newState.eyes = undefined;
    } else if (playerStatus === 'prepared') {

      const [x, y, width, height, eye1X, eye1Y, eye2X, eye2Y, mouseX, mouseY, ...image] = value.split(',');
      newState.face = {x: +x, y: +y, width: +width, height: +height};
      newState.eyes = [{x: +eye1X, y: +eye1Y}, {x: +eye2X, y: +eye2Y}];
      newState.mouse = {x: +mouseX, y: +mouseY};
      newState.image = image.join(',');
    } else if (playerStatus === 'hit') {
      newState.hp = +value;
    }
    subject.next([time, newState]);
    console.log(newState);
  }


  constructor(private se: SoundEngineService, private webrtc: WebrtcConnectionService) {
    this.myState$.subscribe(myState => this.myState = myState);
    this.enemyState$.subscribe(enemyState => this.enemyState = enemyState);
  }
}
