import { writable, type Readable } from 'svelte/store';
import { CanvasTexture, Vector2 } from 'three';
import type { Denomination } from './Chip.types';

export interface ChipTextureOpts {
  diameter: number;
  thickness: number;
  color: string;
  numStripes: number;
  denomination: Denomination;
}

export class ChipTextureStore implements Readable<ChipTextureStore> {
  private readonly _store = writable(this);

  private _diameter: number;
  private _thickness: number;
  private _color: string;
  private _numStripes: number;
  private _denomination: Denomination;

  private _faceCanvas: HTMLCanvasElement | undefined;
  private _edgeCanvas: HTMLCanvasElement | undefined;

  private _topTexture: CanvasTexture | undefined;
  private _edgeTexture: CanvasTexture | undefined;
  private _bottomTexture: CanvasTexture | undefined;

  constructor(opts: ChipTextureOpts) {
    this._diameter = opts.diameter;
    this._thickness = opts.thickness;
    this._color = opts.color;
    this._numStripes = opts.numStripes;
    this._denomination = opts.denomination;
  }

  get faceCanvas(): HTMLCanvasElement | undefined {
    return this._faceCanvas;
  }

  get edgeCanvas(): HTMLCanvasElement | undefined {
    return this._edgeCanvas;
  }

  get textures(): CanvasTexture[] {
    if (!this._topTexture || !this._edgeTexture || !this._bottomTexture) return [];
    return [this._edgeTexture, this._topTexture, this._bottomTexture];
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  private tick = (): void => {
    this._store.set(this);
  };

  setup = (): void => {
    this._faceCanvas = document.createElement('canvas');
    this._edgeCanvas = document.createElement('canvas');

    this._topTexture = new CanvasTexture(this._faceCanvas);
    this._bottomTexture = new CanvasTexture(this._faceCanvas);
    this._bottomTexture.center = new Vector2(0.5, 0.5);
    this._bottomTexture.rotation = (3 * Math.PI) / 2;
    this._edgeTexture = new CanvasTexture(this._edgeCanvas);

    this.draw();

    this.tick();
  };

  draw = (): void => {
    this.drawFace();
    this.drawEdge();
  };

  setColor = (color: string): void => {
    this._color = color;
    this.tick();

    this.draw();
    this.updateTextures();
  };

  private drawFace = (): void => {
    const ctx = this._faceCanvas?.getContext('2d');
    if (!ctx) return;

    const size = 1000;
    ctx.canvas.width = size;
    ctx.canvas.height = size;
    const { width, height } = ctx.canvas;

    const cx = width / 2;
    const cy = height / 2;

    // Make whole chip white
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw red rectangles for stripes
    const stripeRad = (2 * Math.PI) / this._numStripes;
    ctx.fillStyle = 'red';

    for (let i = 0; i < this._numStripes; i++) {
      const r = width / 2;
      const rad = i * stripeRad + (3 * stripeRad) / 4;

      const { x, y } = polarToCartesian(cx, cy, r, rad);
      ctx.beginPath();
      ctx.arc(x, y, 130.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw denomination
    ctx.font = `${width / 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.denominationString, cx, cy);
  };

  private get circumference(): number {
    return this._diameter * Math.PI;
  }

  private get denominationString(): string {
    if (this._denomination < 1000) return `$${this._denomination}`;
    return `$${this._denomination / 1000}k`;
  }

  private drawEdge = (): void => {
    const ctx = this._edgeCanvas?.getContext('2d');
    if (!ctx) return;

    const scale = 100;
    ctx.canvas.width = scale * this.circumference;
    ctx.canvas.height = scale * this._thickness;
    const { width, height } = ctx.canvas;

    // Make whole edge white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw red stripes
    const stripeWidth = width / this._numStripes;
    ctx.fillStyle = this._color;
    for (let i = 0; i < this._numStripes; i++) {
      ctx.fillRect(i * stripeWidth, 0, stripeWidth / 2, height);
    }
  };

  private updateTextures = (): void => {
    if (this._edgeTexture) this._edgeTexture.needsUpdate = true;
    if (this._topTexture) this._topTexture.needsUpdate = true;
  };
}

const polarToCartesian = (cx: number, cy: number, r: number, rad: number): { x: number; y: number } => ({
  x: r * Math.cos(rad) + cx,
  y: r * Math.sin(rad) + cy,
});
