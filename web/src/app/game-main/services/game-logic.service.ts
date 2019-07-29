import {Injectable} from '@angular/core';
import {PlayerState, PlayerStatus} from '../models/player-state';
import {Subject} from 'rxjs';
import {map, pairwise, startWith} from 'rxjs/operators';
import deepClone from '../../util/deep-clone';
import {Client, connect} from 'mqtt';
import {GameState, GameStatus} from '../models/game-state';

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

interface PreparedUpdatePlayerStateParams extends BaseUpdatePlayerStateParams {
  status: 'prepared';
  value: string; // image
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
    }
  };

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
      this.mqttClient.on('message', this.handleMQTTMessage);
      resolve(this.mqttClient);
    }).on('error', err => reject(err)));
  }


  updateGameStatus(status: GameStatus) {
    this.mqttClient.publish('game/status', `${new Date().toISOString()},${status}`);
  }

  updatePlayerState(params: UpdatePlayerStateParams) {
    this.mqttClient.publish(`${this.myState.robotName}/status`, `${new Date().toISOString()},${params.status},${params.value}`);
  }
  updateEnemyState(params: UpdatePlayerStateParams) {
    this.mqttClient.publish(`${this.enemyState.robotName}/status`, `${new Date().toISOString()},${params.status},${params.value}`);
  }

  private processUpdatePlayerStatus(payload: string, state: PlayerState, subject: Subject<TimePlayerState>) {

    const newState = deepClone(state);
    const [dateStr, playerStatus, ...val] = payload.split(',') as [string, PlayerStatus, string[]];
    const value = val.join(',');
    const time = new Date(dateStr).getTime();
    newState.status = playerStatus;
    if (playerStatus === 'prepare') {
      newState.image = undefined;
    } else if (playerStatus === 'prepared') {
      newState.image = value;
    } else if (playerStatus === 'hit') {
      newState.hp = +value;
    }
    subject.next([time, newState]);
    console.log(newState);
  }


  constructor() {
    this.myState$.subscribe(myState => this.myState = myState);
    this.enemyState$.subscribe(enemyState => this.enemyState = enemyState);
  }
}
