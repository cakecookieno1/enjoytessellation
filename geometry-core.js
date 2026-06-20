(function initializeGeometryCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.TessellationGeometry = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  function normalizeRotation(rotation) {
    return ((rotation % 360) + 360) % 360;
  }

  function rotatePoint(point, degrees) {
    const angle = toRadians(degrees);
    return {
      x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
      y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
    };
  }

  function computeExactEdgeSnap({
    basePoints,
    movingEdge,
    movingIndex,
    movingRotation,
    targetEdge,
    toleranceDegrees = 10,
  }) {
    const desiredAngle = targetEdge.angle + Math.PI;
    const correction = Math.atan2(
      Math.sin(desiredAngle - movingEdge.angle),
      Math.cos(desiredAngle - movingEdge.angle),
    );
    const correctionDegrees = toDegrees(correction);
    if (Math.abs(correctionDegrees) > toleranceDegrees) return null;

    const rotation = movingRotation + correctionDegrees;
    const localPoints = basePoints.map((point) => rotatePoint(point, rotation));
    const localStart = localPoints[movingIndex];
    const localEnd = localPoints[(movingIndex + 1) % localPoints.length];
    const position = {
      x: targetEdge.midpoint.x - (localStart.x + localEnd.x) / 2,
      y: targetEdge.midpoint.y - (localStart.y + localEnd.y) / 2,
    };
    const worldStart = { x: localStart.x + position.x, y: localStart.y + position.y };
    const worldEnd = { x: localEnd.x + position.x, y: localEnd.y + position.y };
    const endpointError = Math.max(
      Math.hypot(worldStart.x - targetEdge.end.x, worldStart.y - targetEdge.end.y),
      Math.hypot(worldEnd.x - targetEdge.start.x, worldEnd.y - targetEdge.start.y),
    );

    return {
      correctionDegrees,
      endpointError,
      position,
      rotation: normalizeRotation(rotation),
    };
  }

  return { computeExactEdgeSnap };
}));
