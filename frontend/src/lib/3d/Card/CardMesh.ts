import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
} from 'three';

import type { ICard } from 'blackjack-types';
import { CORNER_RADIUS, ColorBySuit, HEIGHT, RankToString, SuitToString, THICKNESS, WIDTH } from './Card.constants';

interface CardOpts {
  card: ICard;
  pxPerMm: number;
}

export const CardMesh = (opts: CardOpts): Group => {
  const { front, back } = createGeometries();

  const frontTexture = createFrontCanvasTexture(opts);

  const frontMaterial = new MeshStandardMaterial({
    map: frontTexture,
  });
  const sideMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });
  const backMaterial = new MeshStandardMaterial({ color: 'black' });

  const frontMesh = new Mesh(front, [frontMaterial, sideMaterial]);
  frontMesh.translateZ(THICKNESS / 2);
  const backMesh = new Mesh(back, [backMaterial, sideMaterial]);

  const group = new Group();
  group.add(frontMesh);
  group.add(backMesh);

  return group;
};

const createGeometries = (): { front: BufferGeometry; back: BufferGeometry } => {
  const shape = new Shape();
  shape.moveTo(CORNER_RADIUS, 0);
  shape.lineTo(WIDTH - CORNER_RADIUS, 0);
  shape.arc(0, -CORNER_RADIUS, CORNER_RADIUS, Math.PI / 2, 0, true);
  shape.lineTo(WIDTH, -(HEIGHT - CORNER_RADIUS));
  shape.arc(-CORNER_RADIUS, 0, CORNER_RADIUS, 0, -Math.PI / 2, true);
  shape.lineTo(CORNER_RADIUS, -HEIGHT);
  shape.arc(0, CORNER_RADIUS, CORNER_RADIUS, -Math.PI / 2, Math.PI, true);
  shape.lineTo(0, -CORNER_RADIUS);
  shape.arc(CORNER_RADIUS, 0, CORNER_RADIUS, Math.PI, Math.PI / 2, true);

  const face = new ExtrudeGeometry(shape, {
    depth: THICKNESS / 2,
    curveSegments: 16,
  });

  const front = face;
  const back = face.clone();

  return { front, back };
};

const createFrontCanvasTexture = ({ card, pxPerMm }: CardOpts): CanvasTexture => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2d context is null');

  ctx.canvas.width = WIDTH * pxPerMm;
  ctx.canvas.height = HEIGHT * pxPerMm;
  const { width, height } = ctx.canvas;

  // No idea why this texture is so weird... But this setup seems to fit it correctly
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const xRepeat = 100 / width;
  const aspectRatio = width / height;
  texture.repeat.set(xRepeat, xRepeat * aspectRatio);

  // Fill card with white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Don't draw suit/rank on hidden cards
  if (card.hidden) return texture;

  // Draw suit and rank
  ctx.fillStyle = ColorBySuit[card.suit];
  ctx.font = '3000px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = `${SuitToString[card.suit]}${RankToString[card.rank]}`;
  ctx.fillText(text, width / 2, height / 2);

  return texture;
};
