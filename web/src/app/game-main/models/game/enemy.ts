import * as THREE from 'three';
import {Gun} from './gun';
import {BattleResult} from '../../components/scene.component';
import {Assets} from '../assets';
import {BoundingBox, PlayerState} from '../player-state';

const DEFAULT_HIT_POINT = 100;

interface EnemyOptions {
  debug: boolean;
  color: THREE.Color;
  hitPoint: number;
}

export class Enemy extends THREE.Group {

  private readonly gun: Gun;
  private options: EnemyOptions;
  public hitMesh: THREE.Mesh;
  private hp: number;
  private faceCanvas: HTMLCanvasElement;
  private faceMaterial: THREE.MeshBasicMaterial;
  private body: THREE.Mesh;
  private faceImage: HTMLImageElement;

  constructor(gun: THREE.Group, private state: PlayerState, private assets: Assets, options?: Partial<EnemyOptions>) {
    super();
    this.options = Object.assign({
      debug: false,
      color: new THREE.Color(0x000000),
      hitPoint: DEFAULT_HIT_POINT
    }, options);

    this.hp = this.options.hitPoint;
    this.gun = new Gun(gun.clone(), {debug: this.options.debug, direction: -1});
    this.gun.name = 'enemyGun';
    this.gun.position.set(-0.533, 0, 0.423);
    this.add(this.gun);
    const body = this.createBody(state);
    this.add(body);
    this.body = body;

    this.hitMesh = new THREE.Mesh(body.geometry.clone(), new THREE.MeshBasicMaterial({transparent: true, opacity: 0}));
    this.add(this.hitMesh);
  }

  public shot() {
    this.gun.shot();
  }

  private createBody(state: PlayerState): THREE.Mesh {
    const bodyMat = new THREE.MeshBasicMaterial({color: this.options.color, transparent: true, opacity: 0.1});
    const {canvas, face} = this.createFace(state);
    const materials = [
      bodyMat,
      bodyMat,
      bodyMat,
      bodyMat,
      face,
      bodyMat,
      bodyMat
    ];
    this.faceMaterial = face;
    this.faceCanvas = canvas;
    const bodyGeometry = new THREE.BoxBufferGeometry(1, 2.08, 1.94);
    bodyGeometry.addGroup(18, 6, 7);
    const body = new THREE.Mesh(bodyGeometry, materials);
    body.name = 'enemyBody';
    return body;
  }

  private createFace(state: PlayerState): { face: THREE.MeshBasicMaterial, canvas: HTMLCanvasElement } {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    img.src = state.image;
    this.faceImage = img;
    img.onload = () => this.drawFace();

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return {
      face: new THREE.MeshBasicMaterial({map: texture, overdraw: 1}),
      canvas
    };
  }

  drawFace() {
    const ctx = this.faceCanvas.getContext('2d');
    const {x, y, width, height} = this.calcBoundingBox(this.state.face);
    console.log('face', x, y, width, height);
    this.faceCanvas.height = height;
    this.faceCanvas.width = width;
    ctx.drawImage(this.faceImage, x, y, width, height, 0, 0, width, height);
    this.faceMaterial.map.needsUpdate = true;
  }

  private calcBoundingBox(face: BoundingBox) {
    let {x, y, width, height} = face;
    x = x + (width - width * 4 / 5) / 2;
    y = y + (height - height * 4 / 5) / 2;
    width = width * 4 / 5;
    height = height * 4 / 5;
    return {x, y, width, height};
  }

  private calcLandmarkPosition(face: BoundingBox, landmark: Point2D) {
    const {x, y, width, height} = face;

    const lx = landmark.x - x - (width - width * 4 / 5) / 2;
    const ly = landmark.y - y - (height - height * 4 / 5) / 2;
    return {x: lx, y: ly};
  }


  update = (delta: number, now: number) => {
    this.gun.update(delta, now);
  }

  damage(hp: number) {
    this.hp = hp;
    const damageRate = hp / this.options.hitPoint;

    this.drawFace();
    const ctx = this.faceCanvas.getContext('2d');
    this.state.eyes.map(eye => this.calcLandmarkPosition(this.state.face, eye)).forEach(p => {
      ctx.drawImage(this.assets.namida, p.x, p.y + this.state.face.height / 4, this.assets.namida.width / 2, this.assets.namida.height / 2);
    });

    this.faceMaterial.map.needsUpdate = true;

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

  }

  private lose() {

  }

  private win() {

  }

}
