import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediaRecorderService {

  private chunks = [];
  private recorder: MediaRecorder;
  private stream: MediaStream;

  constructor() {
    (navigator.mediaDevices as any).getDisplayMedia({video: true}).then(stream => this.stream = stream);
  }

  public startScreenCapture() {
    this.start(this.stream);
  }

  public start(stream: MediaStream) {

    if (this.recorder) {
      this.stop();
    }

    this.recorder = new MediaRecorder(stream);
    this.chunks = [];
    this.recorder.ondataavailable = (evt => this.chunks.push(evt.data));
    this.recorder.start(2000);
  }

  public getBlob() {
    return new Blob(this.chunks, {type: 'video/webm'});
  }

  public stop(): Blob | undefined {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
      return this.getBlob();
    }
    return undefined;
  }


}
