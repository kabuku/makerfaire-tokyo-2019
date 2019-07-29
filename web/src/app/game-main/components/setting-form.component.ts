import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameOptions} from '../models/game-options';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'at-setting-form',
  templateUrl: './setting-form.component.html',
  styleUrls: ['./setting-form.component.scss']
})
export class SettingFormComponent implements OnInit {

  // tslint:disable-next-line:variable-name
  private _gameOptions: GameOptions;

  @Input()
  set gameOptions(gameOptions: GameOptions) {
    this._gameOptions = gameOptions;
    if (this._gameOptions) {
      Object.entries(this.gameOptions).forEach(([key, value]) => {

        if (key === 'arSourceOptions') {
          const arSourceOptionsGroup = this.form.get(key) as FormGroup;
          Object.entries(value).forEach(([k, v]) => {
            if (arSourceOptionsGroup.get(k)) {
              arSourceOptionsGroup.get(k).setValue(v);
            }
          });
          return;
        }
        this.form.get(key).setValue(value);

      });
    }
  }

  get gameOptions(): GameOptions {
    return this._gameOptions;
  }

  @Output()
  gameOptionsChange = new EventEmitter<GameOptions>();

  @Output()
  onConnect = new EventEmitter<GameOptions>();

  get sourceType() {
    return this.form.get('arSourceOptions.sourceType') as FormControl;
  }

  form = this.fb.group({
    debug: [''],
    gunColor: [''],
    machineName: [''],
    model : this.fb.group({
      scale: [''],
      mae: this.fb.group({
        x: [''],
        y: [''],
        z: [''],
      }),
      migi: this.fb.group({
        x: [''],
        y: [''],
        z: [''],
      }),
      hidari: this.fb.group({
        x: [''],
        y: [''],
        z: [''],
      }),
      ushiro: this.fb.group({
        x: [''],
        y: [''],
        z: [''],
      }),
    }),
    arSourceOptions: this.fb.group({
      sourceType: ['', Validators.required],
      hostPath: [''],
      signalingPath: [''],
      sourceUrl: [''],
      sourceWidth: [''],
      sourceHeight: [''],
      displayWidth: [''],
      displayHeight: [''],
      stream: [''],
    })
  });

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.form.valueChanges.subscribe(() => this.gameOptionsChange.emit(this.form.value))
  }

  onClickConnect() {
    this.onConnect.emit(this.form.value);
  }

}
