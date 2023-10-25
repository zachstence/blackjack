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

    const d = size;
    const r = d / 2;
    const cx = r;
    const cy = r;

    // Make whole chip white
    ctx.fillStyle = this._color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();

    // Debugging lines
    ctx.strokeStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Draw rectangles for stripes
    ctx.fillStyle = 'white';
    const rectWidth = 200;
    const rectHeight = 100;

    for (let i = 0; i < this._numStripes; i++) {
      const angle = i * ((2 * Math.PI) / this._numStripes);
      const { x, y } = polarToCartesian(cx, cy, r - rectHeight, angle);
      const pathD = buildPath(x, y, rectWidth, rectHeight, 0, angle);
      ctx.fill(new Path2D(pathD));
    }

    // Draw denomination
    ctx.fillStyle = 'white';
    ctx.font = `${size / 4}px sans-serif`;
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

/**
 * Builds a path definition for the SVG Path `d` parameter. The path draws a rectangle at any (x, y), with any
 * width and height, with corners rounded at a certain radius, and the whole rectangle rotated at a specified angle.
 *
 * ```
 * (This drawing corresponds to angle = 0. As angle is increased, this box is rotated clockwise)
 *
 *
 *                                         ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤ height
 *                                          ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  heightWithoutRoundedCorners
 *
 *                                           D                                      E
 *                                         ╭─────────────────────────────────────────╮          ┬
 *                                       C │                                         │ F     ┬  ╎
 *                                         │                                         │       ╎  ╎
 *   [  center of ]                        │                                         │       ╎  ╎
 *   [< waveform  ]               (x,y)  A │                                         │       ╎  ╎
 *   [   circle   ]                        │                                         │       ╎  ╎
 *                                         │                                         │       ╎  ╎
 *                                       B │                                         │ G     ┴  ╎
 *                                         ╰─────────────────────────────────────────╯          ┴
 *                                       /  I                                       H        ╲   ╲
 *                                      /                                                     ╲    width
 *                                     /                                                       ╲
 *      [ Rounded corners are difficult     ]                                                    widthWithoutRoundedCorners
 *      [ to draw with ASCII, but a corner  ]
 *      [ radius is fairly self-explanatory ]
 *
 * ```
 * @param x Where to place the center bottom of the rectangle
 * @param y Where to place the center bottom of the rectangle
 * @param width How wide the rectangle is (width is measured tangentially to the circle)
 * @param height How tall the rectangle is (height is measured radially to the circle)
 * @param cornerRadius How rounded the corners of the rectangle are
 * @param angleRad The overall rotation of the rectangle, in radians
 * @returns A string containing the path definition
 */
const buildPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  angleRad: number,
): string => {
  const widthWithoutRoundedCorners = width - 2 * cornerRadius;
  const heightWithoutRoundedCorners = height - 2 * cornerRadius;

  const goToA = `M ${x} ${y}`;
  const m = widthWithoutRoundedCorners / 2;
  const my = m * Math.cos(angleRad);
  const mx = m * -Math.sin(angleRad);
  const goToBFromA = `m ${mx} ${my}`;

  const drawBC = l(angleRad + (3 / 2) * Math.PI, widthWithoutRoundedCorners);
  const drawCD = a(angleRad + (3 / 2) * Math.PI, cornerRadius);
  const drawDE = l(angleRad + (0 / 2) * Math.PI, heightWithoutRoundedCorners);
  const drawEF = a(angleRad + (0 / 2) * Math.PI, cornerRadius);
  const drawFG = l(angleRad + (1 / 2) * Math.PI, widthWithoutRoundedCorners);
  const drawGH = a(angleRad + (1 / 2) * Math.PI, cornerRadius);
  const drawHI = l(angleRad + (2 / 2) * Math.PI, heightWithoutRoundedCorners);
  const drawIB = a(angleRad + (2 / 2) * Math.PI, cornerRadius);

  return `
    ${goToA}
    ${goToBFromA}
    ${drawBC}
    ${drawCD}
    ${drawDE}
    ${drawEF}
    ${drawFG}
    ${drawGH}
    ${drawHI}
    ${drawIB}
  `;
};

/** Draws a line of length `d` at angle `rad` (radians) */
const l = (rad: number, d: number) => `l ${d * Math.cos(rad)} ${d * Math.sin(rad)}`;

/** Draws an arc of radius `r` at angle `rad` (radians) */
const a = (deg: number, r: number) =>
  `a ${r * Math.SQRT1_2} ${r * Math.SQRT1_2} 0 0 1 ${r * Math.cos(deg + 45)} ${r * Math.sin(deg + 45)}`;
