const { computeExactEdgeSnap } = require("../geometry-core");

const SIDE = 72;
const SHAPES = {
  triangle: 3,
  square: 4,
  hexagon: 6,
  octagon: 8,
  dodecagon: 12,
};

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function rotatePoint(point, degrees) {
  const angle = toRadians(degrees);
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
}

function regularPolygonPoints(sides) {
  const radius = SIDE / (2 * Math.sin(Math.PI / sides));
  const start = sides === 4 ? -45 : sides === 12 ? -105 : -90;
  return Array.from({ length: sides }, (_, index) => {
    const angle = toRadians(start + index * 360 / sides);
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}

function edgeFor(points, rotation, position, index = 0) {
  const world = points.map((point) => {
    const rotated = rotatePoint(point, rotation);
    return { x: rotated.x + position.x, y: rotated.y + position.y };
  });
  const start = world[index];
  const end = world[(index + 1) % world.length];
  return {
    start,
    end,
    midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    angle: Math.atan2(end.y - start.y, end.x - start.x),
  };
}

let tests = 0;
const dodecagonPoints = regularPolygonPoints(12);
if (Math.abs(dodecagonPoints[0].y - dodecagonPoints[1].y) > 1e-8) {
  throw new Error("dodecagon must start with a horizontal edge");
}

for (const [movingShape, movingSides] of Object.entries(SHAPES)) {
  for (const [targetShape, targetSides] of Object.entries(SHAPES)) {
    const movingPoints = regularPolygonPoints(movingSides);
    const targetPoints = regularPolygonPoints(targetSides);
    const targetEdge = edgeFor(targetPoints, 0, { x: 410, y: 310 });
    const baseMovingEdge = edgeFor(movingPoints, 0, { x: 0, y: 0 });
    const nearlyAlignedRotation = toDegrees(targetEdge.angle + Math.PI - baseMovingEdge.angle) + 3;
    const movingEdge = edgeFor(movingPoints, nearlyAlignedRotation, { x: 0, y: 0 });
    const result = computeExactEdgeSnap({
      basePoints: movingPoints,
      movingEdge,
      movingIndex: 0,
      movingRotation: nearlyAlignedRotation,
      targetEdge,
      toleranceDegrees: 10,
    });

    if (!result) throw new Error(`${movingShape} to ${targetShape} did not snap`);
    if (result.endpointError > 1e-8) {
      throw new Error(`${movingShape} to ${targetShape} endpoint error: ${result.endpointError}`);
    }
    if (Math.abs(Math.abs(result.correctionDegrees) - 3) > 1e-8) {
      throw new Error(`${movingShape} to ${targetShape} correction was not exact`);
    }
    tests += 1;
  }
}

console.log(`verify-geometry ok (${tests} edge combinations)`);
