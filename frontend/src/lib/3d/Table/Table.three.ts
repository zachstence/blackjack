import {
  BufferGeometry,
  CanvasTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
} from 'three';
import {
  NUM_TABLE_SEATS,
  TABLE_ARC_ANGLE,
  TABLE_ARC_INNER_RADIUS,
  TABLE_BET_BOX_PADDING,
  TABLE_ARC_THICKNESS,
  TABLE_BET_BOX_HEIGHT,
  TABLE_BET_BOX_WIDTH,
  TABLE_OUTLINE_WIDTH,
  TABLE_RADIUS,
} from './Table.constants';
import { onMount } from 'svelte';
import { polarToRectangular } from '../polar';
import { CARD_HEIGHT, CARD_WIDTH } from '../Card/Card.constants';

interface TableOpts {
  color: string;
  resolution: number;
}

export const Table = (opts: TableOpts): Group => {
  const table = new Group();

  onMount(() => {
    const feltGeometry = createFeltGeometry(opts);
    const feltTexture = createFeltCanvasTexture(opts);
    const feltMaterial = new MeshStandardMaterial({ map: feltTexture });
    const felt = new Mesh(feltGeometry, feltMaterial);

    table.add(felt);
  });

  return table;
};

const createFeltGeometry = (opts: TableOpts): BufferGeometry => {
  const shape = new Shape();
  shape.arc(0, 0, TABLE_RADIUS, 0, Math.PI, true);
  shape.lineTo(TABLE_RADIUS, 0);

  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);

  return geometry;
};

const createFeltCanvasTexture = (opts: TableOpts): CanvasTexture => {
  const canvas = createFeltCanvas(opts);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.center.set(0.5, 0);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / (TABLE_RADIUS * 2), 1 / TABLE_RADIUS);

  return texture;
};

export const createFeltCanvas = (opts: TableOpts): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2d context is null');

  ctx.canvas.width = TABLE_RADIUS * 2 * opts.resolution;
  ctx.canvas.height = TABLE_RADIUS * opts.resolution;
  const { width: w, height: h } = ctx.canvas;
  const cx = w / 2;
  const cy = h / 2;

  const arcInnerRadius = TABLE_ARC_INNER_RADIUS * opts.resolution;
  const arcThickness = TABLE_ARC_THICKNESS * opts.resolution;
  const arcOuterRadius = arcInnerRadius + arcThickness;
  const arcCenterRadius = arcInnerRadius + arcThickness / 2;
  const arcStartAngle = Math.PI / 2 - TABLE_ARC_ANGLE / 2;
  const arcEndAngle = arcStartAngle + TABLE_ARC_ANGLE;

  const arcCx = cx;
  const arcCy = cy - arcInnerRadius;

  // Table base color
  ctx.fillStyle = opts.color;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = TABLE_OUTLINE_WIDTH * opts.resolution;

  // Inner arc
  ctx.beginPath();
  ctx.arc(arcCx, arcCy, arcInnerRadius, arcStartAngle, arcEndAngle);
  ctx.stroke();

  // Outer arc
  ctx.beginPath();
  ctx.arc(arcCx, arcCy, arcOuterRadius, arcStartAngle, arcEndAngle);
  ctx.stroke();

  const capRadius = arcThickness / 2;
  const capCy = arcCy + arcCenterRadius * Math.sin(arcStartAngle);
  const capStartAngle = -Math.PI + arcEndAngle;
  const capEndAngle = capStartAngle + Math.PI;

  // Left cap
  const leftCapCx = arcCx + arcCenterRadius * Math.cos(arcEndAngle);
  ctx.beginPath();
  ctx.arc(leftCapCx, capCy, capRadius, capStartAngle, capEndAngle, true);
  ctx.stroke();

  // Right cap
  const rightCapCx = arcCx + arcCenterRadius * Math.cos(arcStartAngle);
  ctx.beginPath();
  ctx.arc(rightCapCx, capCy, capRadius, -capStartAngle, -capEndAngle, true);
  ctx.stroke();

  // Insurance text
  // ctx.fillStyle = 'yellow';
  // ctx.font = `${arcThickness / 2}px sans-serif`;
  // ctx.textAlign = 'center';
  // ctx.textBaseline = 'middle';
  // arcText(ctx, 'INSURANCE PAYS 2:1', arcCx, arcCy, arcCenterRadius, arcEndAngle, arcStartAngle, true);

  // Box per each seat
  const boxWidth = TABLE_BET_BOX_WIDTH * opts.resolution;
  const boxHeight = TABLE_BET_BOX_HEIGHT * opts.resolution;
  const boxPadding = TABLE_BET_BOX_PADDING * opts.resolution;
  const boxRadius = arcOuterRadius + boxPadding;

  const dAngle = Math.abs(arcEndAngle - arcStartAngle) / (NUM_TABLE_SEATS - 1);
  for (let i = 0; i < NUM_TABLE_SEATS; i++) {
    const a = arcStartAngle + dAngle * i;
    const { x: relX, y: relY } = polarToRectangular(boxRadius, a);
    const cardX = arcCx + relX;
    const cardY = arcCy + relY;

    ctx.save();
    ctx.translate(cardX, cardY);
    ctx.rotate(a - Math.PI / 2);
    ctx.strokeRect(-boxWidth / 2, 0, boxWidth, boxHeight);
    ctx.restore();
  }

  return canvas;
};
