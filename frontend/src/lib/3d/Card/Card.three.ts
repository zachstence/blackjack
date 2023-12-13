import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  RepeatWrapping,
  Shape,
} from 'three';

import { Rank, type ICard, Suit } from 'blackjack-types';
import {
  CARD_CORNER_RADIUS,
  ColorBySuit,
  CARD_HEIGHT,
  RankToString,
  SuitToString,
  CARD_THICKNESS,
  CARD_WIDTH,
  CARD_CORNER_MARGIN,
  CARD_ART_MARGIN,
  PX_PER_MM,
} from './Card.constants';
import { onMount } from 'svelte';

interface CardOpts {
  card: ICard;
}

export const CardMesh = (opts: CardOpts): Group => {
  const group = new Group();

  onMount(() => {
    const { front, back } = createGeometries();

    let frontTexture: CanvasTexture;
    if (opts.card.hidden) {
      frontTexture = HIDDEN_CARD_TEXTURE;
    } else {
      frontTexture = CARD_TEXTURES[opts.card.suit][opts.card.rank];
    }

    const frontMaterial = new MeshStandardMaterial({
      map: frontTexture,
    });
    const sideMaterial = new MeshStandardMaterial({ color: 'white', side: DoubleSide });
    const backMaterial = new MeshStandardMaterial({ color: 'black' });

    const frontMesh = new Mesh(front, [frontMaterial, sideMaterial]);
    frontMesh.translateZ(CARD_THICKNESS / 2);
    const backMesh = new Mesh(back, [backMaterial, sideMaterial]);

    group.add(frontMesh);
    group.add(backMesh);
    group.rotateX(-Math.PI / 2);
  });

  return group;
};

const createGeometries = (): { front: BufferGeometry; back: BufferGeometry } => {
  const shape = new Shape();
  shape.moveTo(CARD_CORNER_RADIUS, 0);
  shape.lineTo(CARD_WIDTH - CARD_CORNER_RADIUS, 0);
  shape.arc(0, -CARD_CORNER_RADIUS, CARD_CORNER_RADIUS, Math.PI / 2, 0, true);
  shape.lineTo(CARD_WIDTH, -(CARD_HEIGHT - CARD_CORNER_RADIUS));
  shape.arc(-CARD_CORNER_RADIUS, 0, CARD_CORNER_RADIUS, 0, -Math.PI / 2, true);
  shape.lineTo(CARD_CORNER_RADIUS, -CARD_HEIGHT);
  shape.arc(0, CARD_CORNER_RADIUS, CARD_CORNER_RADIUS, -Math.PI / 2, Math.PI, true);
  shape.lineTo(0, -CARD_CORNER_RADIUS);
  shape.arc(CARD_CORNER_RADIUS, 0, CARD_CORNER_RADIUS, Math.PI, Math.PI / 2, true);

  const face = new ExtrudeGeometry(shape, {
    depth: CARD_THICKNESS / 2,
    curveSegments: 16,
    bevelEnabled: false,
  });

  const front = face;
  const back = face.clone();

  return { front, back };
};

export const createFrontCanvasTexture = (opts: CardOpts): CanvasTexture => {
  const canvas = createFrontCanvas(opts);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / CARD_WIDTH, 1 / CARD_HEIGHT);

  return texture;
};

export const createFrontCanvas = ({ card }: CardOpts): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2d context is null');

  ctx.canvas.width = CARD_WIDTH * PX_PER_MM;
  ctx.canvas.height = CARD_HEIGHT * PX_PER_MM;
  const { width, height } = ctx.canvas;

  // Fill card with white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Don't draw suit/rank on hidden cards
  if (card.hidden) return canvas;

  // Draw suit and rank
  ctx.fillStyle = ColorBySuit[card.suit];
  const fontSize = 10 * PX_PER_MM;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const margin = CARD_CORNER_MARGIN * PX_PER_MM;
  const suitStr = SuitToString[card.suit];
  const rankStr = RankToString[card.rank];

  // ... Top left
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const { width: rankWidth } = ctx.measureText(rankStr);
  const { width: suitWidth } = ctx.measureText(suitStr);
  const maxWidth = Math.max(rankWidth, suitWidth);
  ctx.fillText(rankStr, margin + maxWidth / 2, margin);
  ctx.fillText(suitStr, margin + maxWidth / 2, margin + fontSize);

  // ... Upside-down in bottom right
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.PI);
  ctx.translate(-width / 2, -height / 2);
  ctx.fillText(rankStr, margin + maxWidth / 2, margin);
  ctx.fillText(suitStr, margin + maxWidth / 2, margin + fontSize);
  ctx.restore();

  // Draw placeholder box for card art in the middle
  ctx.strokeStyle = 'black';
  const artOutlineStrokeWidth = 0.5 * PX_PER_MM;
  ctx.lineWidth = artOutlineStrokeWidth;
  const cardArtMargin = CARD_ART_MARGIN * PX_PER_MM;
  const artOutlineX = cardArtMargin;
  const artOutlineY = cardArtMargin;
  const artOutlineWidth = width - cardArtMargin * 2;
  const artOutlineHeight = height - cardArtMargin * 2;
  ctx.strokeRect(artOutlineX, artOutlineY, artOutlineWidth, artOutlineHeight);

  return canvas;
};

const CARD_TEXTURES = {} as Record<Suit, Record<Rank, CanvasTexture>>;
Object.values(Suit).forEach((suit) => {
  CARD_TEXTURES[suit] = {} as Record<Rank, CanvasTexture>;
  Object.values(Rank).forEach((rank) => {
    CARD_TEXTURES[suit][rank] = createFrontCanvasTexture({ card: { hidden: false, suit, rank } });
  });
});
const HIDDEN_CARD_TEXTURE = createFrontCanvasTexture({ card: { hidden: true } });
