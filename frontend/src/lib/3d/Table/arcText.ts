export const arcText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  counterclockwise?: boolean,
): void => {
  const chars = text.split('');
  const numChars = chars.length;
  const angle = Math.abs(endAngle - startAngle);
  const dAngle = angle / (numChars - 1);

  console.log({ numChars, angle, dAngle });

  for (const [i, char] of chars.entries()) {
    const a = counterclockwise ? startAngle - dAngle * i : startAngle + dAngle * i;

    const { x: relX, y: relY } = polarToRectangular(radius, a);
    const charX = x + relX;
    const charY = y + relY;

    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(a - Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

const polarToRectangular = (r: number, a: number): { x: number; y: number } => ({
  x: r * Math.cos(a),
  y: r * Math.sin(a),
});
