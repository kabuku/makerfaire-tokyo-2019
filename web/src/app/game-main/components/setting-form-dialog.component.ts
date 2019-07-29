import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {GameOptions} from '../models/game-options';
import {WebrtcConnectionService} from '../services/webrtc-connection.service';

@Component({
  selector: 'at-setting-form-dialog',
  templateUrl: './setting-form-dialog.component.html',
  styleUrls: ['./setting-form-dialog.component.scss']
})
export class SettingFormDialogComponent {

  constructor(public dialogRef: MatDialogRef<SettingFormDialogComponent>,
              private webrtc: WebrtcConnectionService,
              @Inject(MAT_DIALOG_DATA) public gameOptions: GameOptions) {
  }

  onCancel() {
    this.dialogRef.close();
  }
}
