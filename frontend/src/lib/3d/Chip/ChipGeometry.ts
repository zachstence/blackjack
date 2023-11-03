import { BufferGeometry, LatheGeometry, Path } from 'three';

export const ChipGeometry = (
  radius: number,
  thickness: number,
  filletRadius: number,
  pathSegments: number,
  radialSegments: number,
): BufferGeometry => {
  const faceRadius = radius - filletRadius;
  const sideHeight = thickness - 2 * filletRadius;

  const path = new Path();
  path.moveTo(0, thickness / 2);
  path.lineTo(faceRadius, sideHeight / 2);
  path.arc(0, -filletRadius, filletRadius, Math.PI / 2, 0, true);
  path.lineTo(radius, -sideHeight / 2);
  path.arc(-filletRadius, 0, filletRadius, 0, -Math.PI / 2, true);
  path.lineTo(0, -thickness / 2);

  const points = path.getSpacedPoints(pathSegments);

  const geometry = new LatheGeometry(points, radialSegments);

  return geometry;
};
