import * as THREE from 'three';
import {Explosion} from './fire';

const DEFAULT_CHARGE_TIME = 2000;
const DEFAULT_GUN_FIRE_TIME = 500;
const DEFAULT_GUN_REACTION_TIME = 1500;
const DEFAULT_GUN_FIRE_LIGHT_INTENSITY = 5;

interface GunOptions {
  debug: boolean;
  chargeTime: number;
  gunFireTime: number;
  gunFireLightIntensity: number;
  gunReactionTime: number;
  direction: 1 | -1;
}

export class Gun extends THREE.Group {
  private gun: THREE.Group;
  private fireGroup: Explosion;
  // private fireGroup: THREE.Group;
  private chargeTime = 0; // ms
  public get chargingTime() {
    return this.chargeTime;
  }

  private gunReactionTime = 0;
  private gunBoundingBox: THREE.Box3;
  private options: GunOptions;
  private originalRotation: THREE.Euler;

  constructor(private originGun: THREE.Group, options?: Partial<GunOptions>) {
    super();

    this.options = Object.assign(
      {
        debug: false,
        chargeTime: DEFAULT_CHARGE_TIME,
        gunFireTime: DEFAULT_GUN_FIRE_TIME,
        gunFireLightIntensity: DEFAULT_GUN_FIRE_LIGHT_INTENSITY,
        gunReactionTime: DEFAULT_GUN_REACTION_TIME,
        direction: 1,
      },
      options
    );

    const gun = originGun.clone();
    gun.name = 'gun';
    const gunBox = new THREE.BoxHelper(gun);
    gunBox.name = 'gunBox';
    gunBox.geometry.computeBoundingBox();
    this.gunBoundingBox = new THREE.Box3().setFromObject(gun);
    this.gun = gun;
    this.add(gun);
    if (this.options.debug) {
      this.add(gunBox);
    }
  }

  private initFire(position: THREE.Vector3) {
    this.fireGroup = new Explosion({
      debug: this.options.debug,
      position,
      fireLightIntensity: this.options.gunFireLightIntensity,
      fireTime: this.options.gunFireTime,
      direction: this.options.direction
    });
    this.add(this.fireGroup);
  }

  public shot(): boolean {
    if (this.chargeTime > 0) {
      console.log('charging', this.chargeTime);
      return false;
    }

    this.initFire(
      new THREE.Vector3(0, 0.03, 0.52)
    );
    this.chargeTime = this.options.chargeTime;
    this.gunReactionTime = this.options.gunReactionTime;
    this.originalRotation = this.rotation.clone();
    return true;
  }

  update(delta, now) {
    if (this.chargeTime > 0) {
      this.chargeTime = Math.max(0, this.chargeTime - delta * 1000);
    }

    if (this.gunReactionTime <= 0) {
      return;
    }

    if (this.fireGroup) {
      if (this.fireGroup.burnOut) {
        this.remove(this.fireGroup);
        this.fireGroup = undefined;
      } else {
        this.fireGroup.update(delta, now);
      }
    }

    this.gunReactionTime -= delta * 1000;

    if (this.options.gunReactionTime - this.gunReactionTime < 10) {
      // 日が出てから反動が出るように少し待ち時間を入れる
      return;
    }

    this.gunReactionTime = Math.max(0, this.gunReactionTime);
    const scale = this.gunReactionTime / this.options.gunReactionTime;
    this.rotation.set(this.originalRotation.x + this.options.direction * 10 * scale * Math.PI / 180, this.rotation.y, this.rotation.z);

  }

}
