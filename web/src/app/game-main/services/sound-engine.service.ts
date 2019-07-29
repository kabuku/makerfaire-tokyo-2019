import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundEngineService {

  private context = new AudioContext();

  private bufferMap: {[key: string]: {buffer: AudioBuffer, loop: boolean}} = {};
  private bufferSourceMap: {[key: string]: AudioBufferSourceNode} = {};
  private isMute = false;

  constructor() { }

  loads(assets: {name: string, buffer: AudioBuffer, loop: boolean}[]) {
    assets.forEach(asset => this.load(asset.name, asset.buffer, asset.loop));
  }

  load(name: string, buffer: AudioBuffer, loop: boolean) {
    this.bufferMap[name] = {buffer, loop};

  }
  play(name: string, when: number = 0, offset: number = 0) {

    if (this.isMute) {
      return;
    }

    if (this.bufferSourceMap[name]) {
      this.stop(name);
    }

    const buf = this.bufferMap[name];
    const source = this.context.createBufferSource();
    source.buffer = buf.buffer;
    source.loop = buf.loop;
    source.connect(this.context.destination);
    source.start(when, offset);
    this.bufferSourceMap[name] = source;
  }

  stop(name: string, when: number = 0) {
    if (this.bufferSourceMap[name]) {
      this.bufferSourceMap[name].stop(when);
    }
  }

  mute(isMute: boolean) {
    this.isMute = isMute;
  }
}
