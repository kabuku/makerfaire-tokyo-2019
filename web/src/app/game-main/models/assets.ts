export interface Assets {
  gun: THREE.Group;
  gun2: THREE.Group;
  flare: THREE.Texture;
  sight: THREE.Texture;
  sightRed: THREE.Texture;
  smokeparticle: THREE.Texture;

  // sounds
  prepareBgm: AudioBuffer;
  bgm: AudioBuffer;
  gameStartBgm: AudioBuffer;
  teSound: AudioBuffer;

  selectSound: AudioBuffer;
  damageSound: AudioBuffer;
  shotSound: AudioBuffer;

  // hit
  onpu: HTMLImageElement;

  // damage
  namida: HTMLImageElement;
  bansoukou: HTMLImageElement;
  batsu: HTMLImageElement;
  glass1: THREE.Texture;
  glass2: THREE.Texture;
  glass3: THREE.Texture;

}


