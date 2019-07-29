import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Assets} from '../models/assets';
import {GameOptions} from '../models/game-options';
import {SceneComponent} from './scene.component';
import {MatDialog} from '@angular/material';
import {SettingFormDialogComponent} from './setting-form-dialog.component';
import {PlayerState} from '../models/player-state';
import {UpdatePlayerStateParams} from '../services/game-logic.service';
import {GameState, GameStatus} from '../models/game-state';
import {SoundEngineService} from '../services/sound-engine.service';

@Component({
  selector: 'at-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild(SceneComponent, {static: false}) sceneRef: SceneComponent;

  @Input() loading: boolean;
  @Input() videoIndex: number;
  @Input() assets: Assets;
  @Input() gameOptions: GameOptions;
  @Input() gameState: GameState;
  @Input() myState: PlayerState;
  @Input() enemyState: PlayerState;

  @Output() gameOptionsChange = new EventEmitter<GameOptions>();
  @Output() updateGameStatus = new EventEmitter<GameStatus>();
  @Output() updateMyStatus = new EventEmitter<UpdatePlayerStateParams>();
  @Output() updateEnemyStatus = new EventEmitter<UpdatePlayerStateParams>();

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
  }

  newGame() {
    this.se.play('select', 0, 0.35);

    this.updateGameStatus.emit('prepare');
  }
}
