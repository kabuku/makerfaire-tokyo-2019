import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {PlayerState} from '../models/player-state';

declare var window: ShapeDetectionWindow;

@Component({
  selector: 'at-prepare',
  templateUrl: './prepare.component.html',
  styleUrls: ['./prepare.component.scss']
})
export class PrepareComponent implements AfterViewInit {

  @Input() myState: PlayerState;
  @Input() deviceIndex: number;
  @Output() finishSetup = new EventEmitter<string>();
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
  finished: boolean;
  devices: MediaDeviceInfo[];
  videoStarted: boolean;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.faceDetector = new FaceDetector({fastMode: true, maxDetectedFaces: 1});

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
      }).then(device =>
      navigator.mediaDevices.getUserMedia({
        audio: false, video: {
          deviceId: device.deviceId
        }
      }))
      .then(stream => this.video.srcObject = stream)
      .then(() => this.video.play())
      .then(() => this.videoStarted = true)
      .then(() => this.imageCapture = new ImageCapture((this.video.srcObject as MediaStream).getVideoTracks()[0]))
      .then(() => this.detectFaceLoop());
  }

  detectFaceLoop() {

    const detect = async () => {

      if (this.finished) {
        return;
      }

      requestAnimationFrame(detect);
      if (this.takingPhoto) {
        return;
      }
      let img;
      try {
        img = await this.imageCapture.grabFrame();
      } catch {
        return;
      }

      if (!img) {
        return;
      }

      const faces = await this.faceDetector.detect(img).catch(error => console.log(error));

      if (!faces || faces.length === 0) {
        return;
      }

      const ctx = this.videoCanvas.getContext('2d');
      this.videoCanvas.width = img.width;
      this.videoCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      for (const face of faces) {
        const {x, y, width, height} = this.calcBoundingBox(face);
        ctx.beginPath();
        ctx.lineWidth = this.videoCanvas.height / 100;
        ctx.strokeStyle = 'white';
        ctx.strokeRect(
          x,
          y,
          width,
          height
        );
        ctx.stroke();
      }
    };
    this.animationFrameId = requestAnimationFrame(detect);
  }

  private calcBoundingBox(face) {
    const {x, y, width, height} = face.boundingBox;
    // x = x + (width - width * 4 / 5) / 2;
    // y = y + (height - height * 4 / 5) / 2;
    // width = width * 4 / 5;
    // height = height * 4 / 5;
    return {x, y, width, height};
  }

  takePhoto() {
    this.takingPhoto = true;

    const take = async () => {
      let img;
      try {
        img = await this.imageCapture.grabFrame();
      } catch {
        requestAnimationFrame(take);
        return;
      }

      if (!img) {
        requestAnimationFrame(take);
        return;
      }

      const faces = await this.faceDetector.detect(img).catch(error => console.log(error));

      if (!faces || faces.length === 0) {
        requestAnimationFrame(take);
        return;
      }
      const face = faces[0];
      const ctx = this.snapshotCanvas.getContext('2d');
      this.snapshotCanvas.width = 512;
      this.snapshotCanvas.height = 512;
      const {x, y, width, height} = this.calcBoundingBox(face);

      ctx.drawImage(img, x, y, width, height, 0, 0, 512, 512);
      this.captureData = this.snapshotCanvas.toDataURL();
      console.log(this.captureData);
      this.takingPhoto = false;
    };
    requestAnimationFrame(take);
  }

  finishPrepared() {
    this.finished = true;
    this.finishSetup.emit(this.captureData);
  }

  cancel() {
    this.finished = false;
    this.canceled.emit();
    this.detectFaceLoop();
  }
}
