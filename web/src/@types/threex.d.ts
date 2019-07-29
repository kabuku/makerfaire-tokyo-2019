// from https://github.com/LaboratoryForPlayfulComputation/arcadia/blob/master/sim/threex.d.ts
declare namespace THREEx {
  // tslint:disable-next-line:no-namespace
  interface ArToolkitSourceOptions {
    sourceType: string;
    sourceURL: string;
    sourceWidth: number;
    sourceHeight: number;
    displayWidth: number;
    displayHeight: number;
  }

  class ArToolkitSource {
    constructor(options: Partial<ArToolkitSourceOptions>);

    domElement: HTMLElement;
    ready: boolean;

    init(callback: () => void): void;

    onResize(): void;

    copySizeTo(element: HTMLElement): void;

    onResizeElement(): void;

    copyElementSizeTo(domElement: HTMLCanvasElement): void;
  }

  interface ArToolkitContextOptions {
    cameraParametersUrl: string;
    detectionMode: string;
    matrixCodeType: string;
    debug: boolean;
  }

  class ArToolkitContext {
    static baseURL: string;
    constructor(options: Partial<ArToolkitContextOptions>);

    baseURL: string;
    arController: any;

    init(callback: () => void): void;

    getProjectionMatrix(): THREE.Matrix4;

    update(domElement: HTMLElement): void;

    addEventListener(markerNum: string, callback: (event: any) => void);
  }

  interface ArMarkerControlsOptions {
    size: number;
    type: string;
    patternUrl: string;
    barcodeValue: number;
    changeMatrixMode: string;
    smoothTolerance: number;
  }

  class ArMarkerControls {
    constructor(context: ArToolkitContext, group: THREE.Group, options: Partial<ArMarkerControlsOptions>);

    object3D: THREE.Object3D;
  }

  interface ArMarkerContextOptions {
    debug: boolean;
    detectionMode: string;
    matrixCodeType: string;
    cameraParametersUrl: string;
    maxDetectionRate: number;
    canvasWidth: number;
    canvasHeight: number;
    imageSmoothingEnabled: boolean;
  }

  class ArMarkerContext {
    constructor(options: ArMarkerContextOptions);
  }

  interface ArMarkerSourceOptions {
    sourceType: string;
    sourceUrl: string;
    sourceWidth: number;
    sourceHeight: number;
    displayWidth: number;
    displayHeight: number;
  }

  class ArMarkerSource {
    constructor(options: ArMarkerSourceOptions);
  }

  interface Coordinate { x: number; y: number; z: number; }

  interface ArMarkerState {
    marker: MarkerCode;
    group: THREE.Group;
    currentPos: THREE.Vector3;
    prevPos: THREE.Vector3;
    currentRot: THREE.Euler;
    prevRot: THREE.Euler;
    visible: boolean;
    prevVisible: boolean;
    prevVisibleTime: number;
    prevHiddenTime: number;
    color: number;
    fontColor: number;
    scripts: any;
  }

  class ArVideoInWebgl {
    constructor(texture: any); // THREE.NearestFilter

    object3d: THREE.Object3D;
    update(camera: THREE.Camera): void;
  }

  class ArMarkerCloak {
    constructor(texture: THREE.Texture)
    object3d: THREE.Object3D;
  }
}

declare const enum MarkerCode {
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=0
  Marker0 = 0,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=1
  Marker1 = 1,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=2
  Marker2 = 2,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=3
  Marker3 = 3,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=4
  Marker4 = 4,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=5
  Marker5 = 5,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=6
  Marker6 = 6,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=7
  Marker7 = 7,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=8
  Marker8 = 8,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=9
  Marker9 = 9,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=10
  Marker10 = 10,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=11
  Marker11 = 11,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=12
  Marker12 = 12,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=13
  Marker13 = 13,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=14
  Marker14 = 14,
  // % blockImage=1
  // % blockIdentity=markers.marker enumval=15
  Marker15 = 15
}
