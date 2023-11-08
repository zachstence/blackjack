export const polarToRectangular = (r: number, a: number): { x: number; y: number } => ({
  x: r * Math.cos(a),
  y: r * Math.sin(a),
});
