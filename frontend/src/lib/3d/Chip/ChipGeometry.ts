import { BufferGeometry, EllipseCurve, LatheGeometry, LineCurve, Vector2 } from 'three';

export const ChipGeometry = (
  radius: number,
  height: number,
  filletRadius: number,
  radialSegments: number,
  faceSegments: number,
  heightSegments: number,
  filletSegments: number,
): BufferGeometry => {
  const faceRadius = radius - filletRadius;
  const sideHeight = height - 2 * filletRadius;

  const topFaceCurve = new LineCurve(new Vector2(0, height / 2), new Vector2(faceRadius, height / 2));
  const topFacePoints = topFaceCurve.getPoints(faceSegments);

  const topEdgeCurve = new EllipseCurve(
    faceRadius,
    sideHeight / 2,
    filletRadius,
    filletRadius,
    Math.PI / 2,
    0,
    true,
    0,
  );
  const topEdgePoints = topEdgeCurve.getPoints(filletSegments);

  const sideCurve = new LineCurve(new Vector2(radius, sideHeight / 2), new Vector2(radius, -sideHeight / 2));
  const sidePoints = sideCurve.getPoints(heightSegments);

  const bottomEdgeCurve = new EllipseCurve(
    faceRadius,
    -sideHeight / 2,
    filletRadius,
    filletRadius,
    0,
    -Math.PI / 2,
    true,
    0,
  );
  const bottomEdgePoints = bottomEdgeCurve.getPoints(filletSegments);

  const bottomFaceCurve = new LineCurve(new Vector2(0, -height / 2), new Vector2(faceRadius, -height / 2));
  const bottomFacePoints = bottomFaceCurve.getPoints(faceSegments);

  const geometry = new LatheGeometry(
    [...topFacePoints, ...topEdgePoints, ...sidePoints, ...bottomEdgePoints, ...bottomFacePoints],
    radialSegments,
  );

  return geometry;
};
