import * as THREE from 'three';
import {Gun} from './gun';
import {SpriteText2D, textAlign} from 'three-text2d';
import {BattleResult} from '../../components/scene.component';

const DEFAULT_HIT_POINT = 100;


interface PlayerOptions {
  debug: boolean;
  hitPoint: number;
}



export class Player extends THREE.Group {

  private readonly gun: Gun;
  private hp: number;

  constructor(gun: THREE.Group, sightTexture: THREE.Texture, private camera: THREE.Camera, private options: Partial<PlayerOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      hitPoint: DEFAULT_HIT_POINT
    }, options);

    this.hp = this.options.hitPoint;
    this.gun = new Gun(gun.clone(), { debug: this.options.debug });
    this.gun.name = 'playerGun';
    this.gun.position.set(0.116, -0.057, -0.317);
    this.gun.rotation.set(0, 185 * Math.PI / 180, -2 * Math.PI / 180);
    this.gun.scale.set(0.2, 0.2, 0.2);
    this.add(this.gun);
    const sight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.1),
      new THREE.MeshBasicMaterial({map: sightTexture, side: THREE.DoubleSide, depthWrite: true, transparent: true})
    );
    sight.translateZ(-1);
    this.add(sight);
  }

  update(delta, now) {
    this.gun.update(delta, now);
  }

  shot(): boolean {
    return this.gun.shot();
  }

  hit() {
    const hitText = new SpriteText2D('Hit!', {align: textAlign.center, font: '50px Arial', antialias: true, fillStyle: '#0000ff'});
    hitText.translateZ(-0.1);
    hitText.scale.set(0.001, 0.001, 0.001);
    this.add(hitText);
    setTimeout(() => this.remove(hitText), 1000);
  }

  damage(now: number, hp: number) {
    this.hp = hp;
    const damageText = new SpriteText2D('Damage!', {align: textAlign.center, font: '50px Arial', antialias: true, fillStyle: '#ff0000'});
    damageText.translateZ(-0.1);
    damageText.scale.set(0.0005, 0.0005, 0.0005);
    this.add(damageText);
    setTimeout(() => {
      this.remove(damageText);
    }, 1000);

    const damageRate = hp / this.options.hitPoint;
    if (damageRate <= 0.8) {

    } else if (damageRate <= 0.5) {

    } else if (damageRate <= 0.2) {

    } else if (damageRate <= 0.1) {

    }
  }
  endGame(result: BattleResult) {
    if (result === 'win') {
      this.win();
    } else if (result === 'draw') {
      this.draw();
    } else {
      this.lose();
    }
  }
  private draw() {
    // tslint:disable-next-line:max-line-length
    const drawText = new SpriteText2D('Draw. Nice Fight!', {align: textAlign.center, font: '50px Arial', antialias: true, fillStyle: '#ff0000'});
    drawText.translateZ(-0.1);
    drawText.scale.set(0.0001, 0.0001, 0.0001);
    this.add(drawText);
  }

  private lose() {
    this.hp = 0;
    const loseText = new SpriteText2D('You Lose...', {align: textAlign.center, font: '50px Arial', antialias: true, fillStyle: '#ff0000'});
    loseText.translateZ(-0.1);
    loseText.scale.set(0.0001, 0.0001, 0.0001);
    this.add(loseText);
  }
  private win() {
    const winText = new SpriteText2D('You Win!!!', {align: textAlign.center, font: '50px Arial', antialias: true, fillStyle: '#0000ff'});
    winText.translateZ(-0.1);
    winText.scale.set(0.0001, 0.0001, 0.0001);
    this.add(winText);
  }

}
