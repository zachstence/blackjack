import { BufferGeometry, CircleGeometry, CylinderGeometry, LatheGeometry, Vector2 } from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export const ChipGeometry = (
  radius: number,
  height: number,
  filletRadius: number,
  radialSegments: number,
  heightSegments: number,
  filletSegments: number,
): BufferGeometry => {
  const faceRadius = radius - filletRadius;
  const sideHeight = height - 2 * filletRadius;

  const topGeometry = new CircleGeometry(faceRadius, radialSegments);
  topGeometry.rotateX(-Math.PI / 2);
  topGeometry.translate(0, height / 2, 0);

  const topEdgeGeometry = new LatheGeometry(
    edgePoints(new Vector2(faceRadius, sideHeight / 2), filletRadius, 1, 1, filletSegments),
    radialSegments,
  );

  const sideGeometry = new CylinderGeometry(radius, radius, sideHeight, radialSegments, heightSegments, true);

  const bottomEdgeGeometry = topEdgeGeometry.clone();
  bottomEdgeGeometry.rotateX(Math.PI);

  const bottomGeometry = topGeometry.clone();
  bottomGeometry.rotateX(Math.PI);

  const geometry = BufferGeometryUtils.mergeGeometries([
    topGeometry,
    topEdgeGeometry,
    sideGeometry,
    bottomEdgeGeometry,
    bottomGeometry,
  ]);

  return geometry;
};

const edgePoints = (
  center: Vector2,
  radius: number,
  xDirection: -1 | 1,
  yDirection: -1 | 1,
  segments: number,
): Vector2[] => {
  const a = Math.PI / 2 / segments;
  const numPoints = segments + 1;
  return Array.from({ length: numPoints }).map((_, i) => {
    const x = center.x + xDirection * radius * Math.cos(a * i);
    const y = center.y + yDirection * radius * Math.sin(a * i);
    return new Vector2(x, y);
  });
};
