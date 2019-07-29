import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Assets} from '../models/assets';
import {from, Observable} from 'rxjs';
import {map, mergeAll, mergeMap, reduce, take} from 'rxjs/operators';
import * as THREE from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {TextureLoader} from 'three';
import {HttpClient} from '@angular/common/http';


type AssetType = 'json' | 'obj+mtl' | 'texture' | 'sounds';

interface AssetSource {
  type: AssetType;
  id: keyof Assets;
}

interface JSONAssetSource extends AssetSource {
  type: 'json';
  url: string;
}

interface MTLOBJAssetSource extends AssetSource {
  type: 'obj+mtl';
  path: string;
  obj: string;
  mtl: string;
}

interface TextureAssetSource extends AssetSource {
  type: 'texture';
  url: string;
}

interface SoundsAssetSource extends AssetSource {
  type: 'sounds';
  url: string;
}

type AssetSources = JSONAssetSource | MTLOBJAssetSource | TextureAssetSource | SoundsAssetSource;

interface LoadedAsset {
  id: keyof Assets;
  type: AssetType;
}

interface JSONLoadedAssets extends LoadedAsset {
  type: 'json';
  materials: THREE.Material[];
  geometry: THREE.Geometry;
}

interface MTLOBJLoadedAssets extends LoadedAsset {
  type: 'obj+mtl';
  group: THREE.Group;
}

interface TextureLoadedAssets extends LoadedAsset {
  type: 'texture';
  texture: THREE.Texture;
}

interface SoundLoadedAssets extends LoadedAsset {
  type: 'sounds';
  buffer: AudioBuffer;
}


type LoadedAssets = JSONLoadedAssets | MTLOBJLoadedAssets | TextureLoadedAssets | SoundLoadedAssets;

const assetSources: AssetSources[] = [
  {type: 'obj+mtl', id: 'gun', path: '/assets/models/gun/', obj: 'model.obj', mtl: 'materials.mtl'},
  {type: 'obj+mtl', id: 'gun2', path: '/assets/models/gun2/', obj: 'model.obj', mtl: 'materials.mtl'},
  {type: 'texture', id: 'flare', url: '/assets/models/flare/flare.png'},
  {type: 'texture', id: 'sight', url: '/assets/models/sight/Sight.png'},
  {type: 'texture', id: 'glass1', url: '/assets/models/glass/1.png'},
  {type: 'texture', id: 'glass2', url: '/assets/models/glass/2.png'},
  {type: 'texture', id: 'glass3', url: '/assets/models/glass/3.png'},
  {type: 'sounds', id: 'bgm', url: '/assets/sounds/sht_a05.mp3'},
  {type: 'sounds', id: 'damageSound', url: '/assets/sounds/se_zugyan.mp3'},
  {type: 'sounds', id: 'shotSound', url: '/assets/sounds/se_zugan.mp3'},
  {type: 'sounds', id: 'prepareBgm', url: '/assets/sounds/sht_a01.mp3'},
  {type: 'sounds', id: 'teSound', url: '/assets/sounds/se_te.mp3'},
  {type: 'sounds', id: 'gameStartBgm', url: '/assets/sounds/bgm_gamestart_1.mp3'},
  {type: 'sounds', id: 'selectSound', url: '/assets/sounds/bgm_coinin_1.mp3'},
];

@Injectable({
  providedIn: 'root'
})
export class AssetsResolveService implements Resolve<Assets> {

  constructor(private $http: HttpClient) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Assets> | Promise<Assets> | Assets {

    return from(assetSources)
      .pipe(
        map<AssetSources, Promise<LoadedAssets>>(source => {
            switch (source.type) {
              case 'json':
                return this.loadJsonAsset(source);
              case 'obj+mtl':
                return this.loadObjAsset(source);
              case 'texture':
                return this.loadTextureAsset(source);
              case 'sounds':
                return this.loadSoundsAsset(source);
            }
          }
        ),
        mergeAll(),
        reduce<LoadedAssets, Partial<Assets>>((assets, asset) => {
          switch (asset.type) {
            case 'obj+mtl':
              assets[asset.id] = asset.group;
              break;
            case 'texture':
              assets[asset.id] = asset.texture;
              break;
            case 'sounds':
              assets[asset.id] = asset.buffer;
              break;
          }
          return assets;
        }, {} as Partial<Assets>),
        take(1),
        map(asset => asset as Assets)
      );
  }

  private loadSoundsAsset(source): Promise<SoundLoadedAssets> {
    const context = new AudioContext();
    return this.$http.get(source.url, {responseType: 'arraybuffer'})
      .pipe(
        mergeMap(res => context.decodeAudioData(res)),
        map(buffer => ({id: source.id, type: source.type, buffer})),
      ).toPromise();
  }

  private loadTextureAsset(source): Promise<TextureLoadedAssets> {
    return new Promise(r => {
      const loader = new TextureLoader();
      loader.load(source.url, texture => r({id: source.id, type: source.type, texture}));
    });
  }

  private loadObjAsset(source): Promise<MTLOBJLoadedAssets> {
    return new Promise(r => {
      const mtlLoader = new MTLLoader();
      const loader = new OBJLoader();
      mtlLoader.setPath(source.path);
      mtlLoader.load(source.mtl, materials => {
        materials.preload();
        loader.setMaterials(materials).setPath(source.path).load(source.obj, group => {
          r({id: source.id, type: source.type, group} as MTLOBJLoadedAssets);
        });
      });
    });
  }

  private loadJsonAsset(source): Promise<JSONLoadedAssets> {
    return new Promise(r => new THREE.JSONLoader().load(source.url, (geometry, materials) => r({
      geometry,
      materials,
      type: source.type,
      id: source.id
    } as JSONLoadedAssets)));
  }
}
