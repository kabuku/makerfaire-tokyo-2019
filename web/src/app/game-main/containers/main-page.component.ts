import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {Assets} from '../models/assets';
import {takeUntil, tap} from 'rxjs/operators';
import {GameOptions} from '../models/game-options';
import {MainComponent} from '../components/main.component';
import {GameOptionsService} from '../services/game-options.service';
import {GameLogicService} from '../services/game-logic.service';
import {PlayerState} from '../models/player-state';
import {GameState} from '../models/game-state';
import {SoundEngineService} from '../services/sound-engine.service';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';

@Component({
  selector: 'at-main-page',
  template: `
      <at-main
              [assets]="assets"
              [loading]="loading"
              [gameState]="gameState$ | async"
              [myState]="myState$ | async"
              [enemyState]="enemyState$ | async"
              [gameOptions]="gameOptions"
              [videoIndex]="videoIndex"

              (gameOptionsChange)="onChangeGameOptions($event)"
              (updateGameStatus)="gameLogic.updateGameStatus($event)"
              (updateMyStatus)="gameLogic.updatePlayerState($event)"
              (updateEnemyStatus)="gameLogic.updateEnemyState($event)"
      ></at-main>
  `,
  styles: []
})
export class MainPageComponent implements OnInit, OnDestroy {
  public assets: Assets;
  public loading = true;
  public gameOptions: GameOptions;
  public gameState$: Observable<GameState>;
  public myState$: Observable<PlayerState>;
  public enemyState$: Observable<PlayerState>;
  private routerEventSubject = new Subject();

  @ViewChild(MainComponent, {static: false}) mainComponentRef: MainComponent;
  public videoIndex: number;
  private myRobotName: string;

  constructor(
    private store: Store<any>,
    private router: Router,
    private gameLogic: GameLogicService,
    private gameOptionsService: GameOptionsService,
    private se: SoundEngineService,
    private webrtc: WebrtcConnectionService,
    activeRoute: ActivatedRoute) {
    activeRoute.data.subscribe((data: { assets: Assets }) => {
      this.assets = data.assets;
      this.se.loads([
          {name: 'bgm', buffer: this.assets.bgm, loop: true},
          {name: 'damage', buffer: this.assets.damageSound, loop: false},
          {name: 'shot', buffer: this.assets.shotSound, loop: false},
          {name: 'prepare', buffer: this.assets.prepareBgm, loop: true},
          {name: 'te', buffer: this.assets.teSound, loop: false},
          {name: 'select', buffer: this.assets.selectSound, loop: false},
          {name: 'gameStart', buffer: this.assets.gameStartBgm, loop: false},
        ],
      );
    });
    activeRoute.queryParamMap.subscribe(async paramMap => {
      this.myRobotName = paramMap.get('myName') || 'dalailama';
      const enemyRobotName = paramMap.get('enemyName') || 'nobunaga';
      const mqttBrokerHost = paramMap.get('host') || 'localhost';
      this.videoIndex = +(paramMap.get('videoIndex') || '0');
      const mute = !!paramMap.get('mute');
      this.se.mute(mute);
      this.gameOptions = this.gameOptionsService.get(this.myRobotName);
      console.log(this.myRobotName, enemyRobotName, mqttBrokerHost, this.videoIndex);
      await this.gameLogic.init({mqttBrokerHost, myRobotName: this.myRobotName, enemyRobotName});
      this.connectWebrtc();
    });
    this.router.events.pipe(takeUntil(this.routerEventSubject)).subscribe((routerEvent: Event) => this.checkRouterEvent(routerEvent));

    this.gameState$ = this.gameLogic.gameState$.pipe(tap(gameState => {
      switch (gameState.status) {
        case 'prepare':
          this.se.play('prepare', 3);
          break;
        case 'start':
          this.se.stop('prepare');
          break;
        default:
          break;
      }
    }));
    this.myState$ = this.gameLogic.myState$;
    this.enemyState$ = this.gameLogic.enemyState$;
  }

  ngOnInit() {
  }

  private checkRouterEvent(routerEvent: Event) {
    if (routerEvent instanceof NavigationStart) {
      this.loading = true;
    }
    if (routerEvent instanceof NavigationEnd ||
      routerEvent instanceof NavigationCancel ||
      routerEvent instanceof NavigationError) {
      this.loading = false;
      this.routerEventSubject.complete();
    }
  }

  ngOnDestroy(): void {
  }

  onChangeGameOptions(value: GameOptions) {
    this.gameOptionsService.set(this.myRobotName, value);
    this.gameOptions = value;
    this.connectWebrtc();
  }

  private connectWebrtc() {
    if (this.gameOptions.arSourceOptions.sourceType !== 'stream') {
      return;
    }
    const {hostPath, signalingPath} = this.gameOptions.arSourceOptions;

    if (!hostPath || !signalingPath) {
      return;
    }

    this.webrtc.connect(hostPath, signalingPath).subscribe(stream => {
      if (this.gameOptions.arSourceOptions.sourceType === 'stream' && stream) {
        this.gameOptions.arSourceOptions.stream = stream;
      }
    }, error => {
      console.log(error);
      if (error && error.type === 'connectionError') {
        setTimeout(() => this.connectWebrtc());
      }
    });
  }
}
