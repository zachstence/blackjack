import { writable, type Readable } from 'svelte/store';
import { CanvasTexture } from 'three/src/Three.js';

export interface ChipDimensions {
  diameter: number;
  thickness: number;
}

export class ChipTextureStore implements Readable<ChipTextureStore> {
  private readonly _store = writable(this);

  private faceCanvas: HTMLCanvasElement | undefined;
  private edgeCanvas: HTMLCanvasElement | undefined;

  private _faceTexture: CanvasTexture | undefined;
  private _edgeTexture: CanvasTexture | undefined;

  constructor(readonly dimensions: ChipDimensions) {}

  get textures(): CanvasTexture[] {
    if (!this._faceTexture || !this._edgeTexture) return [];
    return [this._edgeTexture, this._faceTexture, this._faceTexture];
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  private tick = (): void => {
    this._store.set(this);
  };

  setup = (): void => {
    this.faceCanvas = document.createElement('canvas');
    this.edgeCanvas = document.createElement('canvas');

    this._faceTexture = new CanvasTexture(this.faceCanvas);
    this._edgeTexture = new CanvasTexture(this.edgeCanvas);

    this.draw();

    this.tick();
  };

  draw = (): void => {
    this.drawFace();
    this.drawEdge();
  };

  private drawFace = (): void => {
    const ctx = this.faceCanvas?.getContext('2d');
    if (!ctx) return;

    const size = 1000;
    ctx.canvas.width = size;
    ctx.canvas.height = size;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 100, 0, 2 * Math.PI);
    ctx.fill();
  };

  private drawEdge = (): void => {
    const ctx = this.edgeCanvas?.getContext('2d');
    if (!ctx) return;

    const scale = 100;
    ctx.canvas.width = scale * Math.PI * this.dimensions.diameter;
    ctx.canvas.height = scale * this.dimensions.thickness;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  };
}
