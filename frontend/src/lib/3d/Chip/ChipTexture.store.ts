import { writable, type Readable } from 'svelte/store';
import { CanvasTexture, LinearFilter } from 'three';

export interface ChipTextureOpts {
  color: string;
}

export class ChipTextureStore implements Readable<ChipTextureStore> {
  private readonly _store = writable(this);

  private _color: string;

  private _canvas: HTMLCanvasElement | undefined;
  private _texture: CanvasTexture | undefined;

  constructor(opts: ChipTextureOpts) {
    this._color = opts.color;
  }

  get canvas(): HTMLCanvasElement | undefined {
    return this._canvas;
  }

  get texture(): CanvasTexture | undefined {
    return this._texture;
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  private tick = (): void => {
    this._store.set(this);
  };

  setup = (): void => {
    this._canvas = document.createElement('canvas');
    const ctx = this._canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas 2d context not set!');
    } else {
      ctx.canvas.width = 8192;
      ctx.canvas.height = 8192;
    }

    this._texture = new CanvasTexture(this._canvas);
    this._texture.minFilter = LinearFilter;

    this.draw();

    this.tick();
  };

  setColor = (color: string): void => {
    this._color = color;
    this.tick();

    this.draw();
    this.updateTexture();
  };

  private draw = (): void => {
    const ctx = this._canvas?.getContext('2d');
    if (!ctx) return;

    // Fill canvas with base color
    ctx.fillStyle = this._color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw stripes
    const numStripes = 6;
    const stripeHeight = 2000;
    const stripeWidth = 500;
    const nonStripeWidth = ctx.canvas.width / numStripes - stripeWidth;
    const intervalWidth = stripeWidth + nonStripeWidth;
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = 'white';
      const x = i * intervalWidth;
      ctx.fillRect(x, ctx.canvas.height / 2 - stripeHeight / 2, stripeWidth, stripeHeight);
    }
  };

  private updateTexture = (): void => {
    if (this._texture) this._texture.needsUpdate = true;
  };
}
