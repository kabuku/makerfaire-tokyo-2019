import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {AxesHelper, CameraHelper, Raycaster} from 'three';
import {Assets} from '../models/assets';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Enemy} from '../models/game/enemy';
import * as Stats from 'stats.js';
import {Explosion} from '../models/game/fire';
import {GameOptions} from '../models/game-options';
import {Player} from '../models/game/player';
import {GameState, GameStatus} from '../models/game-state';
import {PlayerState} from '../models/player-state';

import {SpriteText2D, textAlign} from 'three-text2d';
import {UpdatePlayerStateParams} from '../services/game-logic.service';
import {SoundEngineService} from '../services/sound-engine.service';

export type BattleResult = 'draw' | 'win' | 'lose';

const GAME_TIME_SEC = 65;
const START_COUNTDOWN_SEC = 5;


interface ThreeJSDebugWindow extends Window {
  scene: THREE.Scene;
  THREE: typeof THREE;
}

declare var window: ThreeJSDebugWindow;

class GameStats {
  shot: boolean;
  initialized: boolean;
  enemyShot: boolean;
  damage: boolean;
  damaging: boolean;
  end: boolean;
  start: boolean;
}

interface EnemyMarker {
  name: string;
  patternFile: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  color?: THREE.Color;
}

@Component({
  selector: 'at-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit {
  get enemyState(): PlayerState {
    return this._enemyState;
  }

  @Input()
  set enemyState(value: PlayerState) {

    this._enemyState = value;
    if (value.status === 'attack') {
      this.stats.enemyShot = true;
    } else if (value.status === 'win' || value.status === 'lose' || value.status === 'draw') {
      this.finishGame(false);
    }
    this._enemyState = value;
  }

  get myState(): PlayerState {
    return this._myState;
  }

  @Input()
  set myState(value: PlayerState) {

    this._myState = value;
    if (value.status === 'shot') {
      this.stats.shot = true;
    } else if (value.status === 'hit') {
      this.stats.damage = true;
    } else if (value.status === 'win' || value.status === 'lose' || value.status === 'draw') {
      this.finishGame(false);
    }

  }

  get gameState(): GameState {
    return this._gameState;
  }

  @Input()
  set gameState(value: GameState) {

    if (!this.gameState) {
      this._gameState = value;
      return;
    }

    if (this.gameState.status === 'prepared' && value.status === 'start') {
      this.startTime = value.lastUpdateTime;
      this.startStartCountdown();
    }
    this._gameState = value;
  }

  @Input()
  set gameOptions(value: Partial<GameOptions>) {
    this._gameOptions = value;
  }

  get gameOptions() {
    return this._gameOptions;
  }


  constructor(private se: SoundEngineService) {
  }

  @Input()
  public assets: Assets;

  @Output() changeGameState = new EventEmitter<GameStatus>();
  @Output() changeEnemyState = new EventEmitter<UpdatePlayerStateParams>();
  @Output() changeMyState = new EventEmitter<UpdatePlayerStateParams>();

  private animationFrameId: number;

  // tslint:disable-next-line:variable-name
  private _gameOptions: Partial<GameOptions>;

  @ViewChild('root', {static: false})
  private rootDiv: ElementRef;

  private hitTargets: THREE.Object3D[] = [];

  private explosions: Explosion[] = [];

  private stats: GameStats;

  private enemies: Enemy[] = [];

  private enemyMarkerRoots: THREE.Group[];

  private onRenderFcts: ((delta?: number, now?: number) => void)[];

  private startTime: number;

  private scene: THREE.Scene;

  private player: Player;

  // tslint:disable-next-line:variable-name
  private _gameState: GameState;
  // tslint:disable-next-line:variable-name
  private _myState: PlayerState;
  // tslint:disable-next-line:variable-name
  private _enemyState: PlayerState;

  private startStartCountdown() {

    const startCountdown = new SpriteText2D('5', {align: textAlign.center, font: '50px Arial', fillStyle: '#000000', antialias: true});
    this.se.play('te');
    startCountdown.translateZ(-0.1);
    this.scene.add(startCountdown);
    startCountdown.scale.set(0.001, 0.001, 0.001);
    let waitCount = 0;
    const intervalId = setInterval(() => {

      if (startCountdown.text === '開始') {

        if (waitCount === 0) {
          this.startGameTimer();
        }

        if (waitCount <= 2) {
          waitCount++;
          return;
        }

        clearInterval(intervalId);
        this.scene.remove(startCountdown);
        return;
      }

      const dt = Math.floor((new Date().getTime() - this.startTime) / 1000);

      const newText = dt >= START_COUNTDOWN_SEC ? '開始' : `${START_COUNTDOWN_SEC - dt}`;

      if (startCountdown.text !== newText) {
        if ( newText !== '開始' ) {
          this.se.play('te');
        } else {
          this.se.play('gameStart');
        }
      }
      startCountdown.text = newText;
    }, 500);
  }

  private startGameTimer() {
    const countdown = new SpriteText2D('60', {align: textAlign.center, font: '50px Arial', fillStyle: '#000000', antialias: true});
    countdown.translateY(0.031);
    countdown.translateZ(-0.1);
    countdown.scale.set(0.0002, 0.0002, 0.0002);
    this.scene.add(countdown);
    setTimeout(() => this.se.play('bgm', 5), 5000);

    const intervalId = setInterval(() => {
      if (this.stats.end) {
        clearInterval(intervalId);
        return;
      }
      const dt = Math.floor((new Date().getTime() - this.startTime) / 1000);
      if (dt <= GAME_TIME_SEC) {
        countdown.text = `${GAME_TIME_SEC - dt}`;
      } else {
        countdown.text = '0';
        clearInterval(intervalId);
        this.finishGame(true);
      }
    }, 200);
  }

  ngAfterViewInit(): void {
    this.initGame();
  }

  restart() {
    if (!this._gameOptions) {
      return;
    }
    if (this.stats && this.stats.initialized) {
      while (this.rootDiv.nativeElement.lastChild) {
        this.rootDiv.nativeElement.removeChild(this.rootDiv.nativeElement.lastChild);
      }
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.initGame();
  }

  private initGame() {
    this.hitTargets = [];
    this.explosions = [];
    this.enemies = [];
    this.enemyMarkerRoots = [];
    this.stats = new GameStats();
    this.onRenderFcts = [];

    const {renderer, renderer2} = this.initRenderer();

    if (this.gameOptions.debug) {
      const stats = new Stats();
      stats.dom.style.position = 'absolute';
      stats.dom.style.top = '0px';
      stats.dom.style.zIndex = '100';
      this.rootDiv.nativeElement.appendChild(stats.dom);
      this.onRenderFcts.push(() => stats.update());
    }

    // init scene and camera
    const {scene, debugCamera, camera} = this.initWorld(renderer2);
    this.scene = scene;

    // init ar context, source
    const arToolkitContext = this.initAr(renderer, camera);

    // setup enemy
    this.setupEnemy(scene, arToolkitContext, camera);

    // setup explosions
    this.setupExplosions(scene, camera);

    // setup player
    this.setupPlayer(scene, renderer, camera);

    // render the scene
    this.onRenderFcts.push(() => {
      renderer.render(scene, camera);
      if (this.gameOptions.debug) {
        renderer2.render(scene, debugCamera);
      }
    });

    // run the rendering loop
    let lastTimeMsec = null;
    const animate = (nowMsec) => {
      // keep looping
      this.animationFrameId = requestAnimationFrame(animate);
      // measure time
      lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
      const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
      lastTimeMsec = nowMsec;
      // call each update function
      this.onRenderFcts.forEach(onRenderFct => onRenderFct(deltaMsec / 1000, nowMsec / 1000));
    };
    this.animationFrameId = requestAnimationFrame(animate);
    this.stats.initialized = true;
  }

  private setupExplosions(scene, camera) {
    this.onRenderFcts.push((delta, now) => {
      this.explosions.filter(ex => ex.burnOut).forEach(ex => {
        ex.parent.remove(ex);
      });
      this.explosions = this.explosions.filter(ex => !ex.burnOut);
      this.explosions.forEach(explosion => {

        if (explosion.parent !== scene) {
          const cameraPos = camera.position.clone();
          const localCameraPos = explosion.parent.worldToLocal(cameraPos);
          explosion.lookAt(localCameraPos);
        } else {
          explosion.lookAt(camera.position);
        }
        explosion.update(delta, now);
      });
    });
  }

  private setupPlayer(scene: THREE.Scene, renderer: THREE.Renderer, camera: THREE.Camera): Player {
    const player = new Player(this.assets.gun, this.assets.sight, camera, {debug: this.gameOptions.debug});
    this.player = player;
    scene.add(player);
    renderer.domElement.addEventListener('click', () => {
      this.changeMyState.emit({status: 'shot', value: undefined});
    });

    this.onRenderFcts.push((delta, now) => player.update(delta, now));

    let lastDamageTime = 0;
    this.onRenderFcts.push((delta, now) => {
      if (this.stats.damaging && now - lastDamageTime > 2) {
        this.stats.damaging = false;
      }

      if (!this.stats.damage) {
        return;
      }
      this.se.play('damage');
      this.stats.damage = false;
      this.stats.damaging = true;
      lastDamageTime = now;
      player.damage(now, this.myState.hp);
    });

    this.onRenderFcts.push(() => {

      if (!this.stats.shot) {
        return;
      }
      this.stats.shot = false;
      if (!player.shot()) {
        console.log('charging now');
        return;
      }
      this.changeMyState.emit({status: 'attack', value: undefined});
      this.se.play('shot');
      const ray = new Raycaster(camera.position, new THREE.Vector3(0, 0, -1));
      const intersections = ray.intersectObjects(this.hitTargets, true);
      console.log('intersections', intersections);
      const ex = new Explosion({direction: -1, position: new THREE.Vector3(0, 0, -10), fireTime: 2000});
      ex.name = 'explosion';
      if (intersections.length === 0) {
        console.log('intersections not found');
        // 遠いところに適当に爆発
        scene.add(ex);
        this.explosions.push(ex);
        return;
      }
      const intersectionObject = intersections[0];
      if (intersectionObject.distance === 0) {
        console.log('not damage');
        // 遠いところに適当に爆発
        scene.add(ex);
        this.explosions.push(ex);
        return;
      }

      if (intersectionObject.object.parent != null && intersectionObject.object.parent !== scene) {
        this.enemyState.hp -= 10;
        console.log('damage to enemy', intersectionObject.object, intersectionObject.object.parent, intersectionObject.point);
        player.hit();
        this.se.play('damage');
        this.enemies.forEach(enemy => {
          const vec = intersectionObject.point.clone();
          const v = enemy.parent.worldToLocal(vec);
          const exe = new Explosion({direction: -1, position: v, fireTime: 10000});
          console.log(enemy.parent, v);
          enemy.parent.add(exe);
          exe.position.copy(vec);
          enemy.damage(this.enemyState.hp);
          this.explosions.push(exe);
        });

        // finish game
        if (this.enemyState.hp === 0) {
          this.finishGame(true);
          return;
        }
        this.changeEnemyState.emit({status: 'hit', value: this.enemyState.hp});
        return;
      }
      console.log('damage to non-enemy');
      scene.add(ex);
      this.explosions.push(ex);
    });
    return player;
  }


  private initAr(renderer, camera) {
    let arToolkitSource: THREEx.ArToolkitSource;

    if (this._gameOptions.arSourceOptions.sourceType !== 'stream') {
      arToolkitSource = new THREEx.ArToolkitSource(this._gameOptions.arSourceOptions);
    } else {
      arToolkitSource = new THREEx.ArToolkitSource({...this._gameOptions.arSourceOptions, sourceType: 'video'});
    }
    arToolkitSource.init(() => {
      console.log('initialized');
      console.log(arToolkitSource.domElement);
      this.rootDiv.nativeElement.appendChild(arToolkitSource.domElement);
      onResize();
    });
    if (this._gameOptions.arSourceOptions.sourceType === 'image') {
      (arToolkitSource.domElement as HTMLImageElement).crossOrigin = 'anonymous';
    } else if (this._gameOptions.arSourceOptions.sourceType === 'stream') {
      (arToolkitSource.domElement as HTMLVideoElement).srcObject = this._gameOptions.arSourceOptions.stream;
    }
    // handle resize
    window.addEventListener('resize', () => {
      onResize();
    });

    function onResize() {
      arToolkitSource.copyElementSizeTo(renderer.domElement);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }
    }

    // create atToolkitContext
    const arToolkitContext = new THREEx.ArToolkitContext({
      debug: this.gameOptions.debug,
      cameraParametersUrl: '/assets/data/data/camera_para.dat',
      detectionMode: 'mono',
      patternRatio: 0.8
    } as Partial<THREEx.ArToolkitContextOptions>);
    // initialize it
    arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // update artoolkit on every frame
    this.onRenderFcts.push(() => {
      if (arToolkitSource.ready === false) {
        return;
      }
      arToolkitContext.update(arToolkitSource.domElement);

    });
    return arToolkitContext;
  }

  private initWorld(renderer2: THREE.Renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(camera);
    const ambientLight = new THREE.HemisphereLight(0xcccccc, 1);
    scene.add(ambientLight);

    let debugCamera;
    if (this.gameOptions.debug) {
      scene.add(new CameraHelper(camera));
      debugCamera = new THREE.PerspectiveCamera();
      debugCamera.lookAt(new THREE.Vector3(0, 0, 0));
      debugCamera.position.set(0, 5, -10);
      scene.add(new AxesHelper());
      new OrbitControls(debugCamera, renderer2.domElement);
      // for debug by chrome extension
      window.scene = scene;
      window.THREE = THREE;
    }

    return {scene, debugCamera, camera};
  }

  private initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setClearColor(new THREE.Color(0xcccccc), 0);
    renderer.setSize(this.gameOptions.arSourceOptions.displayWidth, this.gameOptions.arSourceOptions.displayHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    this.rootDiv.nativeElement.appendChild(renderer.domElement);

    if (!this.gameOptions.debug) {
      return {renderer, renderer2: undefined};
    }
    const renderer2 = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer2.setClearColor(new THREE.Color('lightgrey'), 1);
    renderer2.setSize(this.gameOptions.arSourceOptions.displayWidth, this.gameOptions.arSourceOptions.displayHeight);
    renderer2.domElement.style.position = 'absolute';
    renderer2.domElement.style.top = '0px';
    renderer2.domElement.style.left = `${this.gameOptions.arSourceOptions.displayWidth}px`;
    this.rootDiv.nativeElement.appendChild(renderer2.domElement);
    return {renderer, renderer2};
  }

  private setupEnemy(scene: THREE.Scene, arToolkitContext: THREEx.ArToolkitContext, camera: THREE.Camera) {
    const scale = this.gameOptions.model.scale || 1.2;
    const enemyMarkerOptions: EnemyMarker[] = [
      {
        name: 'enemy-mae',
        patternFile: 'pattern-mae.patt',
        position: new THREE.Vector3(this.gameOptions.model.mae.x, this.gameOptions.model.mae.y, this.gameOptions.model.mae.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 0, 0),
        color: new THREE.Color(0xff0000),
      },
      {
        name: 'enemy-ushiro',
        patternFile: 'pattern-usiro.patt',
        position: new THREE.Vector3(this.gameOptions.model.ushiro.x, this.gameOptions.model.ushiro.y, this.gameOptions.model.ushiro.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 180 * Math.PI / 180, 0),
        color: new THREE.Color(0x000000),
      },
      {
        name: 'enemy-migi',
        patternFile: 'pattern-migi.patt',
        position: new THREE.Vector3(this.gameOptions.model.migi.x, this.gameOptions.model.migi.y, this.gameOptions.model.migi.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, -90 * Math.PI / 180, 0),
        color: new THREE.Color(0x00ff00),
      },
      {
        name: 'enemy-hidari',
        patternFile: 'pattern-hidari.patt',
        position: new THREE.Vector3(this.gameOptions.model.hidari.x, this.gameOptions.model.hidari.y, this.gameOptions.model.hidari.z),
        rotation: new THREE.Euler(-90 * Math.PI / 180, 90 * Math.PI / 180, 0),
        color: new THREE.Color(0x0000ff),
      },
    ];

    enemyMarkerOptions.forEach(em => {
      const markerRoot = new THREE.Group();
      markerRoot.name = em.name;
      scene.add(markerRoot);
      const artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: `/assets/marker/${em.patternFile}?${new Date().getTime()}`
      });
      const enemy = new Enemy(this.assets.gun2, this.enemyState.image, {debug: this.gameOptions.debug, color: em.color});
      enemy.position.set(em.position.x * scale, em.position.y * scale, em.position.z * scale);
      enemy.rotation.copy(em.rotation);
      enemy.scale.set(scale, scale, scale);
      markerRoot.add(enemy);
      this.onRenderFcts.push(enemy.update);
      this.enemies.push(enemy);
      this.hitTargets.push(markerRoot);
      this.enemyMarkerRoots.push(markerRoot);
    });

    this.onRenderFcts.push(() => {

      if (!this.stats.enemyShot) {
        return;
      }
      this.enemies.forEach(enemy => enemy.shot());
      this.se.play('shot');
      this.stats.enemyShot = false;
    });

    // control enemy visibility
    this.onRenderFcts.push(() => {
      const visibleMarkers = this.enemyMarkerRoots.filter(markerRoot => markerRoot.visible);

      if (visibleMarkers.length < 2) {
        return;
      }
      if (this.gameOptions.debug) {
        return;
      }
      visibleMarkers.sort((m1, m2) => Math.abs(m2.rotation.z) - Math.abs(m1.rotation.z)).forEach((marker, i) => {
        if (i !== 0) {

          marker.visible = false;
        }
      });

    });

  }

  private finishGame(notifyEvent: boolean) {
    if (this.stats.end) {
      return;
    }
    this.stats.end = true;
    this.se.stop('bgm');
    // tslint:disable-next-line:max-line-length
    const myResult: BattleResult = this.myState.hp === this.enemyState.hp ? 'draw' : this.myState.hp > this.enemyState.hp ? 'win' : 'lose';
    // tslint:disable-next-line:max-line-length
    const enemyResult: BattleResult = this.myState.hp === this.enemyState.hp ? 'draw' : this.myState.hp > this.enemyState.hp ? 'lose' : 'win';

    this.enemies.forEach(enemy => enemy.endGame(enemyResult));
    this.player.endGame(myResult);
    if (!notifyEvent) {
      return;
    }
    this.changeGameState.emit('end');
    this.changeEnemyState.emit({status: myResult, value: undefined});
    this.changeEnemyState.emit({status: enemyResult, value: undefined});
  }
}
