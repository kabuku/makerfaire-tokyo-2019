import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {PlayerState} from '../models/player-state';
import {FinishPrepareResult} from '../services/game-logic.service';
import {Observable, Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

declare var window: ShapeDetectionWindow;
const DEFAULT_IMAGE_SIZE = 512;

@Component({
  selector: 'at-prepare',
  templateUrl: './prepare.component.html',
  styleUrls: ['./prepare.component.scss']
})
export class PrepareComponent implements AfterViewInit, OnDestroy {

  @Input() myState: PlayerState;
  @Input() deviceIndex: number;
  // tslint:disable-next-line:variable-name
  private _button$: Observable<string>;
  private buttonSubsc?: Subscription;
  private onDestroy$ = new Subject();

  @Input() set button$(button$: Observable<string>) {

    if (this.buttonSubsc) {
      this.buttonSubsc.unsubscribe();
      this.buttonSubsc = undefined;
    }
    this._button$ = button$;
    this.buttonSubsc = button$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(button => {

        if (button === '3') {
          if (this.myState.status === 'prepare') {
            this.takePhoto();
          }
        } else if (button === '2') {
          if (this.myState.status === 'prepared') {
            this.cancel();
          }
        } else if (button === '11') {
          if (this.captureData && this.face && this.myState.status === 'prepare' && !this.finished) {
            this.finishPrepared();
          }
        }
      });
  }

  get button$() {
    return this._button$;
  }


  @Output() finishSetup = new EventEmitter<FinishPrepareResult>();
  @Output() canceled = new EventEmitter();

  @ViewChild('video', {static: true})
  private videoRef: ElementRef;
  private animationFrameId: number;

  private get video(): HTMLVideoElement {
    return this.videoRef.nativeElement;
  }

  @ViewChild('videoCanvas', {static: true})
  private videoCanvasRef: ElementRef;

  private get videoCanvas(): HTMLCanvasElement {
    return this.videoCanvasRef.nativeElement;
  }

  @ViewChild('snapshotCanvas', {static: true})
  private snapshotCanvasRef: ElementRef;

  private get snapshotCanvas(): HTMLCanvasElement {
    return this.snapshotCanvasRef.nativeElement;
  }

  faceDetector: FaceDetector;
  imageCapture: ImageCapture;
  takingPhoto: boolean;
  captureData: string;
  face: DetectedFace;
  finished: boolean;
  devices: MediaDeviceInfo[];
  device: MediaDeviceInfo;
  videoStarted: boolean;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.faceDetector = new FaceDetector({fastMode: true, maxDetectedFaces: 3});

    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => devices.filter(device => device.kind === 'videoinput'))
      .then(devices => this.devices = devices)
      .then(() => {

        if (this.devices.length >= this.deviceIndex + 1) {
          return this.devices[this.deviceIndex];
        } else {
          return this.devices[0];
        }
      }).then(device => this.showVideo(device))
      .then(() => this.detectFaceLoop());
  }

  private async showVideo(device) {
    this.device = device;
    this.videoStarted = false;
    return navigator.mediaDevices.getUserMedia({
      audio: false, video: {
        deviceId: device.deviceId
      }
    }).then(stream => this.video.srcObject = stream)
      .then(() => this.video.play())
      .then(() => this.videoStarted = true)
      .then(() => this.imageCapture = new ImageCapture((this.video.srcObject as MediaStream).getVideoTracks()[0]));
  }

  detectFaceLoop() {

    const detect = async () => {

      requestAnimationFrame(detect);
      let img;
      try {
        img = await this.imageCapture.grabFrame();
      } catch {
        return;
      }

      if (!img) {
        return;
      }
      if (this.takingPhoto) {
        this.take(img);
      }

      const ctx = this.videoCanvas.getContext('2d');
      this.videoCanvas.width = img.width;
      this.videoCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = this.videoCanvas.height / 100;
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = 'white';

      const {w, h, left, right, top, bottom} = this.getPhotoAreaRect(img);

      ctx.strokeRect(
        left,
        top,
        w,
        h
      );
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
      const faces = await this.faceDetector.detect(img).catch(error => console.log(error));

      if (!faces || faces.length === 0) {
        return;
      }

      ctx.beginPath();
      for (const face of faces) {
        const {x, y, width, height} = this.calcBoundingBox(face);
        if (face.boundingBox.left >= left && right >= face.boundingBox.right && face.boundingBox.top >= top && bottom >= face.boundingBox.bottom) {
          ctx.lineWidth = this.videoCanvas.height / 200;
          ctx.strokeStyle = 'green';
        } else {
          ctx.lineWidth = this.videoCanvas.height / 500;
          ctx.strokeStyle = 'red';
        }

        ctx.strokeRect(
          x,
          y,
          width,
          height
        );
        ctx.stroke();
      }
      ctx.closePath();
    };
    this.animationFrameId = requestAnimationFrame(detect);
  }

  private calcBoundingBox(face) {
    const {x, y, width, height} = face.boundingBox;
    return {x, y, width, height};
  }

  takePhoto() {
    this.takingPhoto = true;
  }

  private async take(img) {

    const faces = await this.faceDetector.detect(img).catch(error => console.log(error));

    if (!faces || faces.length === 0) {
      console.log('no face');
      return;
    }
    const {w, h, left, top, right, bottom} = this.getPhotoAreaRect(img);

    const userFaces = faces
      .filter(f => f.boundingBox.left >= left && right >= f.boundingBox.right && f.boundingBox.top >= top && bottom >= f.boundingBox.bottom)
      .sort((face1, face2) => face2.boundingBox.width * face2.boundingBox.height - face1.boundingBox.width * face1.boundingBox.height)
    ;

    if (userFaces.length === 0) {
      console.log('not in photo area');
      return;
    }

    const face = userFaces[0];
    const ctx = this.snapshotCanvas.getContext('2d');
    this.snapshotCanvas.width = DEFAULT_IMAGE_SIZE;
    this.snapshotCanvas.height = DEFAULT_IMAGE_SIZE;
    const {x, y, width, height} = this.calcBoundingBox(face);

    ctx.drawImage(img, x, y, width, height, 0, 0, DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE);

    const f2 = await this.faceDetector.detect(this.snapshotCanvas).catch(error => console.log(error));

    if (!f2 || f2.length === 0) {
      console.log('small');
      return;
    }
    this.face = f2[0];
    this.captureData = this.snapshotCanvas.toDataURL();
    console.log(this.captureData);
    this.takingPhoto = false;
  }

  private getPhotoAreaRect(img) {
    const w = img.width / 2;
    const h = img.height / 2;

    const left = (img.width - w) / 2;
    const top = (img.height - h) / 2;
    const right = left + w;
    const bottom = top + h;
    return {w, h, left, top, right, bottom};
  }

  finishPrepared() {
    this.finished = true;
    this.finishSetup.emit({image: this.captureData, face: this.face});
  }

  cancel() {
    this.finished = false;
    this.canceled.emit();
    this.detectFaceLoop();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
