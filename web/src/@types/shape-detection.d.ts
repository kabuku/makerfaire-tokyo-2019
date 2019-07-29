declare interface FaceDetectionOptions {
  maxDetectedFaces: number;
  fastMode: boolean;
}

declare interface Point2D {
  x: number;
  y: number;
}

declare type LandmarkType = 'mouth'|'eye'| 'nose';

declare interface Landmark {
  locations: Point2D[];
  type: LandmarkType;
}

declare interface DetectedFace {
  readonly boundingBox: DOMRectReadOnly;
  readonly landmarks: Landmark[];
}

declare class FaceDetector {
  constructor(options?: FaceDetectionOptions);
  detect(ImageBitmapSource): Promise<DetectedFace[]>;
}

declare class ImageCapture {
  constructor(MediaStreamTrack);
  grabFrame(): Promise<ImageBitmap>;
}

interface ShapeDetectionWindow extends Window {
  FaceDetector: typeof FaceDetector;
  ImageCapture: typeof  ImageCapture;
}
