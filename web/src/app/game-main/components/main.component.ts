import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Assets} from '../models/assets';
import {GameOptions} from '../models/game-options';
import {SceneComponent} from './scene.component';
import {MatDialog} from '@angular/material';
import {SettingFormDialogComponent} from './setting-form-dialog.component';
import {PlayerState} from '../models/player-state';
import {UpdatePlayerStateParams} from '../services/game-logic.service';
import {GameState, GameStatus} from '../models/game-state';
import {SoundEngineService} from '../services/sound-engine.service';
import {demoFaceImage} from '../../demo';
import {Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Component({
  selector: 'at-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  @ViewChild(SceneComponent, {static: false}) sceneRef: SceneComponent;

  @Input() loading: boolean;
  @Input() videoIndex: number;
  @Input() assets: Assets;
  @Input() gameOptions: GameOptions;
  @Input() gameState: GameState;
  @Input() myState: PlayerState;
  @Input() enemyState: PlayerState;
  @Input() button$: Observable<string>;

  @Output() gameOptionsChange = new EventEmitter<GameOptions>();
  @Output() updateGameStatus = new EventEmitter<GameStatus>();
  @Output() updateMyStatus = new EventEmitter<UpdatePlayerStateParams>();
  @Output() updateEnemyStatus = new EventEmitter<UpdatePlayerStateParams>();
  private onDestroy$ = new Subject();

  constructor(public dialog: MatDialog, private se: SoundEngineService) {
  }

  openSettingDialog() {
    const dialogRef = this.dialog.open(SettingFormDialogComponent, {
      width: '800px',
      data: this.gameOptions
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.gameOptions = result;
      this.gameOptionsChange.emit(this.gameOptions);
    });
  }

  start() {
    this.updateGameStatus.emit('start');
  }

  restart() {
    this.sceneRef.restart();
    this.updateGameStatus.emit('prepared');
  }

  ngOnInit() {
    this.button$.pipe(takeUntil(this.onDestroy$)).subscribe(button => {
      if (button === '10') {
        this.openSettingDialog();
      } else if (button === '11' && this.gameState.status === 'end') {
        this.reset();
      }
    });
  }
  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  newGame() {
    this.updateGameStatus.emit('prepare');
  }

  demo() {
    this.updateMyStatus.emit({
      status: 'prepared',
      value: {
        image: demoFaceImage,
        face: {
          boundingBox: {
            x: 43,
            y: 37,
            width: 426,
            height: 426
          },
          landmarks: [{type: 'eye', locations: [{x: 171, y: 168}]}, {
            type: 'eye',
            locations: [{x: 338, y: 165}]
          }, {type: 'mouth', locations: [{x: 257, y: 356}]}]
        }
      }
    });

    this.updateEnemyStatus.emit({
      status: 'prepared',
      value: {
        image: demoFaceImage,
        face: {
          boundingBox: {
            x: 43,
            y: 37,
            width: 426,
            height: 426
          },
          landmarks: [{type: 'eye', locations: [{x: 171, y: 168}]}, {
            type: 'eye',
            locations: [{x: 338, y: 165}]
          }, {type: 'mouth', locations: [{x: 257, y: 356}]}]
        }
      }
    });
    this.newGame();
  }

  reset() {
    this.updateMyStatus.emit({status: 'prepare', value: undefined});
    this.updateEnemyStatus.emit({status: 'prepare', value: undefined});
    this.updateGameStatus.emit('wait');
  }
}
