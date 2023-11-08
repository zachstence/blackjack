import { BufferGeometry, CanvasTexture, Group, LinearFilter, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import {
  TABLE_ARC_ANGLE,
  TABLE_ARC_INNER_RADIUS,
  TABLE_ARC_THICKNESS,
  TABLE_OUTLINE_WIDTH,
  TABLE_RADIUS,
} from './Table.constants';
import { onMount } from 'svelte';
import { arcText } from './arcText';

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
  // TODO half-circle
  const plane = new PlaneGeometry(TABLE_RADIUS * 2, TABLE_RADIUS);
  plane.rotateX(-Math.PI / 2);

  return plane;
};

const createFeltCanvasTexture = (opts: TableOpts): CanvasTexture => {
  const canvas = createFeltCanvas(opts);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
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
  ctx.fillStyle = 'yellow';
  ctx.font = `${arcThickness / 2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  arcText(ctx, 'INSURANCE PAYS 2:1', arcCx, arcCy, arcCenterRadius, arcEndAngle, arcStartAngle, true);

  return canvas;
};
