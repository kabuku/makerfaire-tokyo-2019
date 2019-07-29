import * as THREE from 'three';
import {Fire, FireOptions} from 'three/examples/jsm/objects/Fire';

const DEFAULT_FIRE_TIME = 500;
const DEFAULT_FIRE_LIGHT_INTENSITY = 10;

interface ExplosionOptions extends FireOptions {
  debug: boolean;
  direction: -1 | 1;
  position: THREE.Vector3;
  fireLightIntensity: number;
  fireTime: number;
  makeLight: boolean;
}

export class Explosion extends THREE.Group {

  private readonly options: ExplosionOptions;
  private fireTime: number;
  // tslint:disable-next-line:variable-name
  private _burnOut: boolean;
  public get burnOut(): boolean {
    return this._burnOut;
  }
  private readonly light: THREE.Light;

  constructor(options: Partial<ExplosionOptions>) {
    super();
    this._burnOut = false;
    this.options = Object.assign({}, {
      debug: false,
      direction: -1,
      position: new THREE.Vector3(0, 0, 0),
      fireLightIntensity: DEFAULT_FIRE_LIGHT_INTENSITY,
      fireTime: DEFAULT_FIRE_TIME,
      textureWidth: 512,
      textureHeight: 512,
      burnRate: 0,
      colorBias: 0.31,
      diffuse: 1.45,
      viscosity: 0,
      expansion: -1,
      swirl: 0,
      drag: 1,
      airSpeed: 19,
      speed: 500,
      makeLight: false,
    }, options);
    this.fireTime = this.options.fireTime;
    const plane = new THREE.PlaneBufferGeometry(1.5, 1.5);
    const fire = new Fire(plane, {...this.options, debug: false});
    this.position.set(this.options.position.x, this.options.position.y, this.options.position.z);
    fire.rotation.y = this.options.direction === 1 ? Math.PI : 0;
    fire.clearSources();
    fire.addSource(0.5, 0.1, 0.1, 1.0, 0.0, 1.0);
    fire.position.y -= new THREE.Box3().setFromObject(fire).min.y + 0.05;
    this.add(fire);
    if (this.options.makeLight) {
      const light = new THREE.PointLight(0xFFFFFF, this.options.fireLightIntensity, 1, 1.0);
      light.position.set(0.5, 0.5, -1.0);
      light.name = 'fireLight';
      this.light = light;
      this.add(light);
    }
    if (this.options.debug) {
      this.add(new THREE.AxesHelper());
    }
  }

  update = (delta: number, now: number) => {
    if (this.fireTime <= 0) {
      this._burnOut = true;
      this.fireTime = 0;
      return;
    }

    this.fireTime -= delta * 1000;
    if (this.fireTime < 0) {

      this._burnOut = true;
      this.fireTime = 0;
      return;
    }
    const scale = this.fireTime / this.options.fireTime;
    this.scale.set(scale, scale, scale);
    if (this.light) {
      this.light.intensity = this.options.fireLightIntensity * scale;
    }
  }
}
