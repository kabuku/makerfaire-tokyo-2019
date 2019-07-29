import * as THREE from 'three';
import {Gun} from './gun';
import {BattleResult} from '../../components/scene.component';
import {Explosion} from './fire';

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
  private face: DetectedFace;

  constructor(gun: THREE.Group, image: string, options?: Partial<EnemyOptions>) {
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
    const body = this.createBody(image);
    this.add(body);

    this.hitMesh = new THREE.Mesh(body.geometry.clone(), new THREE.MeshBasicMaterial({transparent: true, opacity: 0}));
    this.add(this.hitMesh);
  }

  public shot() {
    this.gun.shot();

    if (!this.face) {
      console.log('face not found');
      return;
    }

    const mouth = this.face.landmarks.find(landmark => landmark.type === 'mouth');

    if (!mouth) {
      console.log('nouse not found');
      return;
    }

    const xPositionRate = mouth.locations[0].x / 512;
    const yPositionRate = mouth.locations[0].y / 512;

    const explosion = new Explosion({});

    explosion.position.set(xPositionRate, 2.08 * yPositionRate, 0);
    this.add(explosion);
  }

  private createBody(image: string): THREE.Mesh {
    const bodyMat = new THREE.MeshBasicMaterial({color: this.options.color, transparent: true, opacity: 0.5});
    const materials = [
      bodyMat,
      bodyMat,
      bodyMat,
      bodyMat,
      this.createFace(image),
      bodyMat,
      bodyMat
    ];

    const bodyGeometry = new THREE.BoxBufferGeometry(1, 2.08, 1.94);
    const body = new THREE.Mesh(bodyGeometry, materials);
    body.name = 'enemyBody';
    return body;
  }

  private createFace(image: string): THREE.Material {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    img.src = image;

    img.onload = () => {
        const fd = new FaceDetector({fastMode: false, maxDetectedFaces: 1});
        fd.detect(img).then(faces => {
          this.face = faces[0];
          const ctx = canvas.getContext('2d');
          const {x, y, width, height} = this.calcBoundingBox(this.face);
          console.log(x, y, width, height, this.face.boundingBox);
          canvas.height = height;
          canvas.width = width;
          ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
        });
    };

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return new THREE.MeshBasicMaterial({map: texture, overdraw: 1});
  }

  private calcBoundingBox(face) {
    let {x, y, width, height} = face.boundingBox;
    x = x + (width - width * 4 / 5) / 2;
    y = y + (height - height * 4 / 5) / 2;
    width = width * 4 / 5;
    height = height * 4 / 5;
    return {x, y, width, height};
  }

  private calcLandmarkPosition(face, landmark: Landmark) {
    const {width, height} = face.boundingBox;

    let {x, y} = landmark.locations[0];
    x = x + (width - width * 4 / 5) / 2;
    y = y + (height - height * 4 / 5) / 2;
    return {x, y};
  }


  update = (delta: number, now: number) => {
    this.gun.update(delta, now);
  };

  damage(hp: number) {
    this.hp = hp;
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

  }

  private lose() {

  }

  private win() {

  }

}
