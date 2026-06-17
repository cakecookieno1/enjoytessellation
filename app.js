const board = document.querySelector("#tessellationBoard");
const viewportLayer = document.querySelector("#viewportLayer");
const templateLayer = document.querySelector("#templateLayer");
const tileLayer = document.querySelector("#tileLayer");
const objectLayer = document.querySelector("#objectLayer");
const decorateClip = document.querySelector("#decorateClip");
const tileCount = document.querySelector("#tileCount");
const scoreLabel = document.querySelector("#scoreLabel");
const paletteTray = document.querySelector("#paletteTray");
const paletteHint = document.querySelector("#paletteHint");
const templatePanel = document.querySelector("#templatePanel");
const decoratePanel = document.querySelector("#decoratePanel");
const templateStatus = document.querySelector("#templateStatus");
const completeButton = document.querySelector("#completeButton");
const clearButton = document.querySelector("#clearButton");
const objectSizeRange = document.querySelector("#objectSizeRange");
const objectSizeLabel = document.querySelector("#objectSizeLabel");
const boardTitle = document.querySelector("#boardTitle");
const boardHint = document.querySelector("#boardHint");
const zoomLabel = document.querySelector("#zoomLabel");
const downloadButton = document.querySelector("#downloadButton");
const groupMoveButton = document.querySelector("#groupMoveButton");

const shapeButtons = [...document.querySelectorAll(".shape-button")];
const modeButtons = [...document.querySelectorAll(".mode-button")];
const templateButtons = [...document.querySelectorAll(".template-button")];
const objectButtons = [...document.querySelectorAll(".object-button")];

const NS = "http://www.w3.org/2000/svg";
const SIDE = 72;
const SNAP_DISTANCE = 24;
const TEMPLATE_SNAP_DISTANCE = 72;
const TEMPLATE_ROTATION_TOLERANCE = 4;
const HANDLE_RADIUS = 4.5;
const LONG_PRESS_MS = 650;
const LONG_PRESS_MOVE_LIMIT = 8;
const BOARD_BOUNDS = { minX: 40, minY: 40, maxX: 780, maxY: 580 };
const GROUP_EDGE_DISTANCE = 6;
const GROUP_EDGE_ANGLE_TOLERANCE = 0.16;
const palette = ["#f76f53", "#ffd166", "#06a77d", "#4d96ff", "#8e5cf7", "#ffffff"];

const shapeSides = {
  triangle: 3,
  square: 4,
  hexagon: 6,
  octagon: 8,
  dodecagon: 12,
};

const shapeNames = {
  triangle: "정삼각형",
  square: "정사각형",
  hexagon: "정육각형",
  octagon: "정팔각형",
  dodecagon: "정십이각형",
};

const archimedeanConfigs = {
  t31212: { name: "(3, 12²)", polygons: [3, 12, 12] },
  t4612: { name: "(4, 6, 12)", polygons: [4, 6, 12] },
  t488: { name: "(4, 8²)", polygons: [4, 8, 8] },
  t3464: { name: "(3, 4, 6, 4)", polygons: [3, 4, 6, 4] },
  t3636: { name: "(3, 6, 3, 6)", polygons: [3, 6, 3, 6] },
  t33336: { name: "(3⁴, 6)", polygons: [3, 3, 3, 3, 6] },
  t33434: { name: "(3², 4, 3, 4)", polygons: [3, 3, 4, 3, 4] },
  t33344: { name: "(3³, 4²)", polygons: [3, 3, 3, 4, 4] },
};

const decorateObjects = {
  clock: {
    name: "시계",
    title: "시계 안을 테셀레이션으로 꾸며 보세요",
    hint: "원 안에 도형을 직접 놓고, 완성하면 시곗바늘이 나타납니다.",
  },
  suitcase: {
    name: "캐리어",
    title: "캐리어를 테셀레이션으로 꾸며 보세요",
    hint: "캐리어 몸체 안을 꾸미고, 완성하면 손잡이와 바퀴가 나타납니다.",
  },
  window: {
    name: "창문",
    title: "창문을 테셀레이션으로 꾸며 보세요",
    hint: "아치형 창문 안을 꾸미고, 완성하면 창틀이 나타납니다.",
  },
};

let selectedShape = "triangle";
let activeMode = "free";
let activeTemplateId = "t31212";
let activeObjectId = "clock";
let decorateComplete = false;
let templates = {};
let nextTileId = 1;
let tiles = [];
let dragState = null;
let selectedTile = null;
let undoStack = [];
let viewScale = 1;
let viewRotation = 0;
let objectScale = 1.15;
let groupMoveEnabled = false;

board.setAttribute("viewBox", "0 0 820 620");
applyViewportTransform();

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function regularPolygonPoints(sides) {
  const radius = SIDE / (2 * Math.sin(Math.PI / sides));
  const start = sides === 4 ? -45 : -90;
  return Array.from({ length: sides }, (_, index) => {
    const angle = toRadians(start + index * 360 / sides);
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
}

function basePoints(shape) {
  return regularPolygonPoints(shapeSides[shape]);
}

function shapeForSides(sides) {
  return Object.keys(shapeSides).find((shape) => shapeSides[shape] === sides);
}

function polygonAtSharedVertex(sides, vertex, startAngle) {
  const points = [{ ...vertex }];
  let current = { ...vertex };

  for (let edgeIndex = 0; edgeIndex < sides - 1; edgeIndex += 1) {
    const direction = toRadians(startAngle + edgeIndex * 360 / sides);
    current = {
      x: current.x + SIDE * Math.cos(direction),
      y: current.y + SIDE * Math.sin(direction),
    };
    points.push(current);
  }

  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / sides, y: sum.y + point.y / sides }),
    { x: 0, y: 0 },
  );
  const baseFirst = basePoints(shapeForSides(sides))[0];
  const baseAngle = toDegrees(Math.atan2(baseFirst.y, baseFirst.x));
  const firstAngle = toDegrees(Math.atan2(points[0].y - center.y, points[0].x - center.x));

  return {
    center,
    rotation: firstAngle - baseAngle,
    points,
  };
}

function buildArchimedeanTemplates() {
  const vertex = { x: 410, y: 310 };
  const result = {};

  Object.entries(archimedeanConfigs).forEach(([id, config]) => {
    let angle = -90;
    const slots = config.polygons.map((sides, index) => {
      const polygon = polygonAtSharedVertex(sides, vertex, angle);
      angle += 180 - 360 / sides;
      return {
        id: `${id}-${index}`,
        shape: shapeForSides(sides),
        x: polygon.center.x,
        y: polygon.center.y,
        rotation: polygon.rotation,
      };
    });
    result[id] = { name: config.name, slots };
  });

  return result;
}

templates = buildArchimedeanTemplates();

function rotatePoint(point, degrees) {
  const angle = toRadians(degrees);
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
}

function worldPoints(item, position = item.position, rotation = item.rotation) {
  return basePoints(item.shape).map((point) => {
    const rotated = rotatePoint(point, rotation);
    return { x: rotated.x + position.x, y: rotated.y + position.y };
  });
}

function slotPoints(slot) {
  return worldPoints({
    shape: slot.shape,
    position: { x: slot.x, y: slot.y },
    rotation: slot.rotation,
  });
}

function edgesFor(tile) {
  const points = worldPoints(tile);
  return points.map((start, index) => {
    const end = points[(index + 1) % points.length];
    return {
      start,
      end,
      midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    };
  });
}

function pointsToString(points) {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function getBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function palettePoints(shape) {
  const points = basePoints(shape);
  const bounds = getBounds(points);
  const scale = 52 / Math.max(bounds.width, bounds.height);
  return points.map((point) => ({
    x: (point.x - bounds.minX) * scale + 10,
    y: (point.y - bounds.minY) * scale + 10,
  }));
}

function renderPalette() {
  paletteTray.replaceChildren();
  palette.forEach((color) => {
    const button = document.createElement("button");
    button.className = "palette-shape";
    button.type = "button";
    button.disabled = activeMode === "decorate" && decorateComplete;
    button.dataset.color = color;
    const paletteAction = activeMode === "decorate" ? "만들기" : "끌어오기";
    button.setAttribute("aria-label", `${shapeNames[selectedShape]} ${color} ${paletteAction}`);

    const svg = createSvgElement("svg", { viewBox: "0 0 72 72", "aria-hidden": "true" });
    const polygon = createSvgElement("polygon", {
      points: pointsToString(palettePoints(selectedShape)),
      fill: color,
      stroke: "#17202a",
      "stroke-width": "2",
    });
    svg.appendChild(polygon);
    button.appendChild(svg);
    button.addEventListener("pointerdown", (event) => startPaletteDrag(event, color));
    paletteTray.appendChild(button);
  });
}

function getActiveTemplate() {
  return templates[activeTemplateId];
}

function getOccupiedSlotIds() {
  return new Set(tiles.map((tile) => tile.slotId).filter(Boolean));
}

function renderTemplate() {
  templateLayer.replaceChildren();
  if (activeMode !== "template") return;

  const occupied = getOccupiedSlotIds();
  getActiveTemplate().slots.forEach((slot, index) => {
    const polygon = createSvgElement("polygon", {
      class: `template-slot${occupied.has(slot.id) ? " occupied" : ""}`,
      points: pointsToString(slotPoints(slot)),
      "data-slot-id": slot.id,
      "data-shape": slot.shape,
    });
    templateLayer.appendChild(polygon);

    if (!occupied.has(slot.id)) {
      const label = createSvgElement("text", {
        class: "template-slot-number",
        x: slot.x,
        y: slot.y + 5,
        "text-anchor": "middle",
      });
      label.textContent = index + 1;
      templateLayer.appendChild(label);
    }
  });
}

function createDecorativeBoundary(objectId, className = "") {
  let boundary;
  if (objectId === "clock") {
    boundary = createSvgElement("circle", {
      class: className,
      cx: 410,
      cy: 310,
      r: 252,
    });
  } else if (objectId === "suitcase") {
    boundary = createSvgElement("rect", {
      class: className,
      x: 180,
      y: 100,
      width: 460,
      height: 430,
      rx: 58,
    });
  } else {
    boundary = createSvgElement("path", {
      class: className,
      d: "M200 560V300A210 210 0 0 1 620 300V560Z",
    });
  }

  boundary.setAttribute("transform", objectScaleTransform());
  return boundary;
}

function objectScaleTransform() {
  return `translate(410 310) scale(${objectScale}) translate(-410 -310)`;
}

function baseDecorativeBounds(objectId) {
  if (objectId === "clock") return { minX: 158, minY: 58, maxX: 662, maxY: 562 };
  if (objectId === "suitcase") return { minX: 180, minY: 100, maxX: 640, maxY: 530 };
  return { minX: 200, minY: 90, maxX: 620, maxY: 560 };
}

function scaleBoundsFromCenter(bounds, scale) {
  const center = { x: 410, y: 310 };
  return {
    minX: center.x + (bounds.minX - center.x) * scale,
    minY: center.y + (bounds.minY - center.y) * scale,
    maxX: center.x + (bounds.maxX - center.x) * scale,
    maxY: center.y + (bounds.maxY - center.y) * scale,
  };
}

function getWorkspaceBounds() {
  if (activeMode !== "decorate") return BOARD_BOUNDS;
  const objectBounds = scaleBoundsFromCenter(baseDecorativeBounds(activeObjectId), objectScale);
  return {
    minX: Math.min(BOARD_BOUNDS.minX, objectBounds.minX),
    minY: Math.min(BOARD_BOUNDS.minY, objectBounds.minY),
    maxX: Math.max(BOARD_BOUNDS.maxX, objectBounds.maxX),
    maxY: Math.max(BOARD_BOUNDS.maxY, objectBounds.maxY),
  };
}

function appendObjectLine(x1, y1, x2, y2, className = "object-detail") {
  objectLayer.appendChild(createSvgElement("line", { class: className, x1, y1, x2, y2 }));
}

function renderClockDetails() {
  [
    { value: "12", x: 410, y: 91 },
    { value: "3", x: 628, y: 318 },
    { value: "6", x: 410, y: 548 },
    { value: "9", x: 192, y: 318 },
  ].forEach((item) => {
    const text = createSvgElement("text", {
      class: "clock-number",
      x: item.x,
      y: item.y,
    });
    text.textContent = item.value;
    objectLayer.appendChild(text);
  });
  appendObjectLine(410, 310, 410, 165);
  appendObjectLine(410, 310, 520, 375);
  appendObjectLine(410, 310, 350, 420, "object-detail thin");
  objectLayer.appendChild(createSvgElement("circle", {
    cx: 410,
    cy: 310,
    r: 11,
    fill: "#f76f53",
    stroke: "#17202a",
    "stroke-width": 4,
  }));
}

function renderSuitcaseDetails() {
  objectLayer.appendChild(createSvgElement("path", {
    class: "object-detail",
    d: "M330 100V58Q330 38 350 38H470Q490 38 490 58V100",
  }));
  appendObjectLine(410, 115, 410, 515, "object-detail thin");
  objectLayer.appendChild(createSvgElement("circle", {
    cx: 255, cy: 552, r: 18, fill: "#17202a",
  }));
  objectLayer.appendChild(createSvgElement("circle", {
    cx: 565, cy: 552, r: 18, fill: "#17202a",
  }));
}

function renderWindowDetails() {
  appendObjectLine(410, 92, 410, 560, "object-detail thin");
  appendObjectLine(200, 360, 620, 360, "object-detail thin");
  appendObjectLine(410, 300, 260, 155, "object-detail thin");
  appendObjectLine(410, 300, 560, 155, "object-detail thin");
}

function renderDecorativeObject() {
  decorateClip.replaceChildren();
  objectLayer.replaceChildren();
  objectLayer.setAttribute("class", "object-layer");
  objectLayer.setAttribute("transform", objectScaleTransform());
  board.classList.toggle("decorate-complete", activeMode === "decorate" && decorateComplete);

  if (activeMode !== "decorate") {
    tileLayer.removeAttribute("clip-path");
    return;
  }

  const clipBoundary = createDecorativeBoundary(activeObjectId);
  decorateClip.appendChild(clipBoundary);
  tileLayer.setAttribute("clip-path", "url(#decorateClip)");
  const outline = createDecorativeBoundary(activeObjectId, "object-outline");
  outline.removeAttribute("transform");
  objectLayer.appendChild(outline);

  if (!decorateComplete) {
    const guide = createDecorativeBoundary(activeObjectId, "object-guide");
    guide.removeAttribute("transform");
    objectLayer.appendChild(guide);
    return;
  }

  if (activeObjectId === "clock") renderClockDetails();
  if (activeObjectId === "suitcase") renderSuitcaseDetails();
  if (activeObjectId === "window") renderWindowDetails();
}

function isPointInsideDecorativeArea(point) {
  const localPoint = {
    x: (point.x - 410) / objectScale + 410,
    y: (point.y - 310) / objectScale + 310,
  };

  if (activeObjectId === "clock") {
    return Math.hypot(localPoint.x - 410, localPoint.y - 310) <= 252;
  }

  if (activeObjectId === "suitcase") {
    return localPoint.x >= 180 && localPoint.x <= 640 && localPoint.y >= 100 && localPoint.y <= 530;
  }

  if (localPoint.x < 200 || localPoint.x > 620 || localPoint.y > 560 || localPoint.y < 90) return false;
  if (localPoint.y >= 300) return true;
  return Math.hypot(localPoint.x - 410, localPoint.y - 300) <= 210;
}

function createTile(shape, position, color, rotation = 0, id = nextTileId, slotId = null) {
  const tile = {
    id,
    shape,
    color,
    rotation,
    position: { ...position },
    slotId,
    group: null,
    polygon: null,
    handles: [],
  };
  nextTileId = Math.max(nextTileId, id + 1);
  tile.group = drawTile(tile);
  tiles.push(tile);
  selectTile(tile);
  updateStats();
  return tile;
}

function drawTile(tile) {
  const group = createSvgElement("g", { class: "tile-group" });
  const polygon = createSvgElement("polygon", {
    class: "tile placed-tile",
    fill: tile.color,
    tabindex: "0",
    role: "button",
    "aria-label": `${shapeNames[tile.shape]} 도형`,
  });
  polygon.dataset.id = tile.id;
  polygon.addEventListener("pointerdown", (event) => startMoveDrag(event, tile));
  group.appendChild(polygon);
  tile.polygon = polygon;
  tileLayer.appendChild(group);
  updateTile(tile);
  return group;
}

function updateTile(tile) {
  const points = worldPoints(tile);
  tile.polygon.setAttribute("points", pointsToString(points));
  tile.handles.forEach((handle) => handle.remove());
  tile.handles = [];

  if (tile !== selectedTile || (activeMode === "decorate" && decorateComplete)) return;

  points.forEach((point, index) => {
    const handle = createSvgElement("circle", {
      class: "corner-handle",
      cx: point.x,
      cy: point.y,
      r: HANDLE_RADIUS,
      tabindex: "0",
      "aria-label": "회전 핸들",
    });
    handle.dataset.index = index;
    handle.addEventListener("pointerdown", (event) => startRotateDrag(event, tile));
    tile.group.appendChild(handle);
    tile.handles.push(handle);
  });
}

function selectTile(tile) {
  if (activeMode === "decorate" && decorateComplete) return;
  selectedTile = tile;
  tileLayer.appendChild(tile.group);
  tiles.forEach((item) => {
    item.group.classList.toggle("selected", item === tile);
    updateTile(item);
  });
}

function getBoardPoint(event) {
  const point = board.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const boardPoint = point.matrixTransform(board.getScreenCTM().inverse());
  const center = { x: 410, y: 310 };
  const scaled = {
    x: (boardPoint.x - center.x) / viewScale,
    y: (boardPoint.y - center.y) / viewScale,
  };
  const unrotated = rotatePoint(scaled, -viewRotation);
  return {
    x: unrotated.x + center.x,
    y: unrotated.y + center.y,
  };
}

function applyViewportTransform() {
  viewportLayer.setAttribute(
    "transform",
    `translate(410 310) scale(${viewScale}) rotate(${viewRotation}) translate(-410 -310)`,
  );
  zoomLabel.textContent = `${Math.round(viewScale * 100)}%`;
}

function changeZoom(amount) {
  viewScale = Math.max(0.1, Math.min(2, Number((viewScale + amount).toFixed(2))));
  applyViewportTransform();
}

function rotateView() {
  viewRotation = (viewRotation + 90) % 360;
  applyViewportTransform();
}

function updateGroupMoveButton() {
  if (activeMode === "decorate" && decorateComplete) groupMoveEnabled = false;
  groupMoveButton.classList.toggle("active", groupMoveEnabled);
  groupMoveButton.setAttribute("aria-pressed", groupMoveEnabled ? "true" : "false");
  groupMoveButton.disabled = activeMode === "decorate" && decorateComplete;
}

function toggleGroupMove() {
  if (activeMode === "decorate" && decorateComplete) return;
  groupMoveEnabled = !groupMoveEnabled;
  updateGroupMoveButton();
}

function startPaletteDrag(event, color) {
  if (activeMode === "decorate" && decorateComplete) return;
  event.preventDefault();
  const before = captureState();
  const position = activeMode === "decorate"
    ? getDecorativeSpawnPoint()
    : keepInsideBoard(getBoardPoint(event));
  const tile = createTile(selectedShape, position, color);
  tile.group.classList.add("dragging");
  dragState = {
    mode: "move",
    tile,
    groupTiles: [tile],
    startPositions: [{
      tile,
      position: { ...tile.position },
    }],
    offset: { x: 0, y: 0 },
    before,
    startClient: { x: event.clientX, y: event.clientY },
    longPressTimer: null,
  };
  beginGlobalDrag(event.pointerId);
}

function getDecorativeSpawnPoint() {
  const offsets = [
    { x: 0, y: 0 },
    { x: -54, y: 0 },
    { x: 54, y: 0 },
    { x: 0, y: -54 },
    { x: 0, y: 54 },
    { x: -54, y: -54 },
    { x: 54, y: -54 },
    { x: -54, y: 54 },
    { x: 54, y: 54 },
  ];
  const offset = offsets[tiles.length % offsets.length];
  return { x: 410 + offset.x, y: 310 + offset.y };
}

function releaseTemplateSlot(tile) {
  if (!tile.slotId) return;
  tile.slotId = null;
  renderTemplate();
  updateStats();
}

function releaseTemplateSlots(groupTiles) {
  let released = false;
  groupTiles.forEach((tile) => {
    if (!tile.slotId) return;
    tile.slotId = null;
    released = true;
  });

  if (released) {
    renderTemplate();
    updateStats();
  }
}

function startMoveDrag(event, tile) {
  if (activeMode === "decorate" && decorateComplete) return;
  event.preventDefault();
  selectTile(tile);
  const before = captureState();
  const groupTiles = groupMoveEnabled ? getConnectedTiles(tile) : [tile];
  releaseTemplateSlots(groupTiles);
  const point = getBoardPoint(event);
  groupTiles.forEach((groupTile) => {
    groupTile.group.classList.toggle("group-moving", groupTiles.length > 1);
  });
  tile.group.classList.add("dragging");
  dragState = {
    mode: "move",
    tile,
    groupTiles,
    startPositions: groupTiles.map((groupTile) => ({
      tile: groupTile,
      position: { ...groupTile.position },
    })),
    offset: { x: point.x - tile.position.x, y: point.y - tile.position.y },
    before,
    startClient: { x: event.clientX, y: event.clientY },
    longPressTimer: window.setTimeout(() => deleteLongPressedTile(tile), LONG_PRESS_MS),
  };
  beginGlobalDrag(event.pointerId);
}

function startRotateDrag(event, tile) {
  if (activeMode === "decorate" && decorateComplete) return;
  event.preventDefault();
  event.stopPropagation();
  selectTile(tile);
  const before = captureState();
  releaseTemplateSlot(tile);
  const point = getBoardPoint(event);
  tile.group.classList.add("rotating");
  dragState = {
    mode: "rotate",
    tile,
    startAngle: toDegrees(Math.atan2(point.y - tile.position.y, point.x - tile.position.x)),
    startRotation: tile.rotation,
    before,
    startClient: { x: event.clientX, y: event.clientY },
    longPressTimer: null,
  };
  beginGlobalDrag(event.pointerId);
}

function beginGlobalDrag(pointerId) {
  document.addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  try {
    board.setPointerCapture(pointerId);
  } catch {
    // Global listeners keep dragging reliable when pointer capture is unavailable.
  }
}

function moveDrag(event) {
  if (!dragState) return;
  cancelLongPressIfMoved(event);
  const point = getBoardPoint(event);

  if (dragState.mode === "rotate") {
    const angle = toDegrees(Math.atan2(point.y - dragState.tile.position.y, point.x - dragState.tile.position.x));
    dragState.tile.rotation = dragState.startRotation + angle - dragState.startAngle;
    updateTile(dragState.tile);
    updateOverlapWarnings();
    return;
  }

  const startPosition = dragState.startPositions.find((item) => item.tile === dragState.tile).position;
  const targetPosition = keepInsideBoard({
    x: point.x - dragState.offset.x,
    y: point.y - dragState.offset.y,
  });
  const rawDelta = {
    x: targetPosition.x - startPosition.x,
    y: targetPosition.y - startPosition.y,
  };
  const delta = clampGroupDelta(dragState.startPositions, rawDelta);
  dragState.startPositions.forEach((item) => {
    item.tile.position = {
      x: item.position.x + delta.x,
      y: item.position.y + delta.y,
    };
    updateTile(item.tile);
  });
  updateOverlapWarnings();
}

function getActiveDragTiles() {
  if (!dragState) return [];
  return dragState.groupTiles ?? [dragState.tile];
}

function clampGroupDelta(startPositions, rawDelta) {
  const bounds = getWorkspaceBounds();
  let minX = -Infinity;
  let maxX = Infinity;
  let minY = -Infinity;
  let maxY = Infinity;

  startPositions.forEach((item) => {
    minX = Math.max(minX, bounds.minX - item.position.x);
    maxX = Math.min(maxX, bounds.maxX - item.position.x);
    minY = Math.max(minY, bounds.minY - item.position.y);
    maxY = Math.min(maxY, bounds.maxY - item.position.y);
  });

  return {
    x: Math.max(minX, Math.min(maxX, rawDelta.x)),
    y: Math.max(minY, Math.min(maxY, rawDelta.y)),
  };
}

function endDrag(event) {
  if (!dragState) return;
  const { tile, mode } = dragState;
  const before = dragState.before;
  clearLongPressTimer();

  const isGroupMove = mode === "move" && dragState.groupTiles?.length > 1;

  if (mode === "move" && !isGroupMove) {
    const templateSnap = findTemplateSnap(tile);
    const edgeSnap = templateSnap ? null : findSnap(tile);

    if (templateSnap) {
      applyTemplateSnap(tile, templateSnap);
    } else if (edgeSnap) {
      tile.position = edgeSnap;
      tile.group.classList.add("snapped");
      window.setTimeout(() => tile.group.classList.remove("snapped"), 260);
    } else if (!isMostlyInside(tile)) {
      removeTile(tile);
    }
  }

  if (mode === "rotate") {
    const templateSnap = findTemplateSnap(tile);
    if (templateSnap) applyTemplateSnap(tile, templateSnap);
  }

  if (
    tile.group.isConnected
    && activeMode === "decorate"
    && !getActiveDragTiles().every((dragTile) => isPointInsideDecorativeArea(dragTile.position))
  ) {
    restoreDraggedTiles(before);
  }

  if (!isGroupMove && tile.group.isConnected && tileOverlapsOthers(tile)) {
    const autoFit = findAutoFit(tile);
    if (autoFit) {
      tile.position = autoFit.position;
      tile.rotation = autoFit.rotation;
      tile.slotId = null;
      tile.group.classList.add("template-snapped");
      window.setTimeout(() => tile.group?.classList.remove("template-snapped"), 360);
    }
  }

  if (tile.group.isConnected) {
    tile.group.classList.remove("dragging", "rotating");
    getActiveDragTiles().forEach(updateTile);
  }
  pushUndoIfChanged(before);
  renderTemplate();
  updateStats();
  cleanupDragState();
  try {
    board.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer capture may already be released by the browser.
  }
}

function findTemplateSnap(tile) {
  if (activeMode !== "template") return null;
  const occupied = getOccupiedSlotIds();
  let best = null;

  getActiveTemplate().slots.forEach((slot) => {
    if (slot.shape !== tile.shape || occupied.has(slot.id)) return;
    if (!rotationMatchesSlot(tile, slot)) return;
    const distance = Math.hypot(tile.position.x - slot.x, tile.position.y - slot.y);
    if (distance > TEMPLATE_SNAP_DISTANCE) return;
    if (!best || distance < best.distance) best = { slot, distance };
  });

  return best?.slot || null;
}

function applyTemplateSnap(tile, slot) {
  tile.position = { x: slot.x, y: slot.y };
  tile.slotId = slot.id;
  tile.group.classList.add("template-snapped");
  window.setTimeout(() => tile.group.classList.remove("template-snapped"), 360);
}

function rotationMatchesSlot(tile, slot) {
  const period = 360 / shapeSides[tile.shape];
  const rawDifference = Math.abs(tile.rotation - slot.rotation) % period;
  const difference = Math.min(rawDifference, period - rawDifference);
  return difference <= TEMPLATE_ROTATION_TOLERANCE;
}

function cancelLongPressIfMoved(event) {
  if (!dragState?.longPressTimer || !dragState.startClient) return;
  const distance = Math.hypot(event.clientX - dragState.startClient.x, event.clientY - dragState.startClient.y);
  if (distance > LONG_PRESS_MOVE_LIMIT) clearLongPressTimer();
}

function clearLongPressTimer() {
  if (dragState?.longPressTimer) {
    window.clearTimeout(dragState.longPressTimer);
    dragState.longPressTimer = null;
  }
}

function deleteLongPressedTile(tile) {
  if (!dragState || dragState.tile !== tile || dragState.mode !== "move") return;
  const before = dragState.before;
  removeTile(tile);
  pushUndoSnapshot(before);
  renderTemplate();
  updateStats();
  cleanupDragState();
}

function cleanupDragState() {
  if (dragState?.tile?.group) {
    dragState.tile.group.classList.remove("dragging", "rotating");
  }
  dragState?.groupTiles?.forEach((tile) => tile.group.classList.remove("group-moving"));
  clearLongPressTimer();
  dragState = null;
  document.removeEventListener("pointermove", moveDrag);
  document.removeEventListener("pointerup", endDrag);
  document.removeEventListener("pointercancel", endDrag);
}

function keepInsideBoard(position) {
  const bounds = getWorkspaceBounds();
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y)),
  };
}

function isMostlyInside(tile) {
  const bounds = getWorkspaceBounds();
  const margin = SIDE * 2;
  return worldPoints(tile).some((point) => (
    point.x > bounds.minX - margin
    && point.x < bounds.maxX + margin
    && point.y > bounds.minY - margin
    && point.y < bounds.maxY + margin
  ));
}

function removeTile(tile) {
  tiles = tiles.filter((item) => item !== tile);
  tile.group.remove();
  if (selectedTile === tile) selectedTile = null;
}

function projectPolygon(points, axis) {
  const values = points.map((point) => point.x * axis.x + point.y * axis.y);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function polygonBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function boundsOverlap(boundsA, boundsB) {
  return !(
    boundsA.maxX < boundsB.minX
    || boundsB.maxX < boundsA.minX
    || boundsA.maxY < boundsB.minY
    || boundsB.maxY < boundsA.minY
  );
}

function polygonsOverlap(pointsA, pointsB) {
  const polygons = [pointsA, pointsB];

  for (const points of polygons) {
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      const edge = { x: end.x - start.x, y: end.y - start.y };
      const length = Math.hypot(edge.x, edge.y);
      const axis = { x: -edge.y / length, y: edge.x / length };
      const projectionA = projectPolygon(pointsA, axis);
      const projectionB = projectPolygon(pointsB, axis);
      const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
      if (overlap <= 0.75) return false;
    }
  }

  return true;
}

function tileOverlapsOthers(tile) {
  const points = worldPoints(tile);
  const bounds = polygonBounds(points);
  return tiles.some((other) => {
    if (other === tile) return false;
    const otherPoints = worldPoints(other);
    return boundsOverlap(bounds, polygonBounds(otherPoints)) && polygonsOverlap(points, otherPoints);
  });
}

function edgesAreJoined(edgeA, edgeB) {
  const directionGap = angleDifference(edgeA.angle, edgeB.angle);
  if (directionGap > GROUP_EDGE_ANGLE_TOLERANCE) return false;

  return Math.hypot(
    edgeA.midpoint.x - edgeB.midpoint.x,
    edgeA.midpoint.y - edgeB.midpoint.y,
  ) <= GROUP_EDGE_DISTANCE;
}

function tilesAreConnected(tile, other) {
  const tilePoints = worldPoints(tile);
  const otherPoints = worldPoints(other);
  if (boundsOverlap(polygonBounds(tilePoints), polygonBounds(otherPoints)) && polygonsOverlap(tilePoints, otherPoints)) {
    return false;
  }

  return edgesFor(tile).some((edge) => edgesFor(other).some((otherEdge) => edgesAreJoined(edge, otherEdge)));
}

function getConnectedTiles(startTile) {
  const connected = new Set([startTile]);
  const queue = [startTile];

  while (queue.length) {
    const tile = queue.shift();
    tiles.forEach((candidate) => {
      if (connected.has(candidate)) return;
      if (!tilesAreConnected(tile, candidate)) return;
      connected.add(candidate);
      queue.push(candidate);
    });
  }

  return [...connected];
}

function updateOverlapWarnings() {
  tiles.forEach((tile) => tile.group.classList.remove("overlap-warning"));
  const geometry = new Map(tiles.map((tile) => {
    const points = worldPoints(tile);
    return [tile, { points, bounds: polygonBounds(points) }];
  }));

  for (let firstIndex = 0; firstIndex < tiles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < tiles.length; secondIndex += 1) {
      const first = tiles[firstIndex];
      const second = tiles[secondIndex];
      const firstGeometry = geometry.get(first);
      const secondGeometry = geometry.get(second);
      if (!boundsOverlap(firstGeometry.bounds, secondGeometry.bounds)) continue;
      if (!polygonsOverlap(firstGeometry.points, secondGeometry.points)) continue;
      first.group.classList.add("overlap-warning");
      second.group.classList.add("overlap-warning");
    }
  }
}

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function rotationDistance(a, b) {
  const difference = Math.abs(normalizeRotation(a) - normalizeRotation(b));
  return Math.min(difference, 360 - difference);
}

function findAutoFit(tile) {
  const originalPosition = { ...tile.position };
  const originalRotation = tile.rotation;
  let best = null;

  tiles.filter((other) => other !== tile).forEach((other) => {
    edgesFor(other).forEach((targetEdge) => {
      const base = basePoints(tile.shape);
      base.forEach((start, index) => {
        const end = base[(index + 1) % base.length];
        const baseEdgeAngle = toDegrees(Math.atan2(end.y - start.y, end.x - start.x));
        const targetAngle = toDegrees(targetEdge.angle);
        const rotation = targetAngle - baseEdgeAngle + 180;
        const rotatedStart = rotatePoint(start, rotation);
        const rotatedEnd = rotatePoint(end, rotation);
        const midpoint = {
          x: (rotatedStart.x + rotatedEnd.x) / 2,
          y: (rotatedStart.y + rotatedEnd.y) / 2,
        };
        const position = {
          x: targetEdge.midpoint.x - midpoint.x,
          y: targetEdge.midpoint.y - midpoint.y,
        };

        tile.position = position;
        tile.rotation = rotation;
        const inside = isMostlyInside(tile);
        const overlaps = tileOverlapsOthers(tile);
        const moveDistance = Math.hypot(position.x - originalPosition.x, position.y - originalPosition.y);
        const turnDistance = rotationDistance(rotation, originalRotation);
        const score = moveDistance + turnDistance * 0.25;

        if (inside && !overlaps && moveDistance <= SIDE * 1.35 && (!best || score < best.score)) {
          best = { position, rotation, score };
        }
      });
    });
  });

  tile.position = originalPosition;
  tile.rotation = originalRotation;
  return best;
}

function restoreDraggedTile(tile, snapshot) {
  const previous = snapshot.find((item) => item.id === tile.id);
  if (!previous) {
    removeTile(tile);
    return;
  }

  tile.position = { ...previous.position };
  tile.rotation = previous.rotation;
  tile.slotId = previous.slotId;
  updateTile(tile);
}

function restoreDraggedTiles(snapshot) {
  getActiveDragTiles().forEach((tile) => restoreDraggedTile(tile, snapshot));
}

function captureState() {
  return tiles.map((tile) => ({
    id: tile.id,
    shape: tile.shape,
    color: tile.color,
    rotation: tile.rotation,
    position: { ...tile.position },
    slotId: tile.slotId,
  }));
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function pushUndoIfChanged(before) {
  if (!statesEqual(before, captureState())) pushUndoSnapshot(before);
}

function pushUndoSnapshot(snapshot) {
  undoStack.push(snapshot);
  if (undoStack.length > 40) undoStack.shift();
  updateUndoButton();
}

function restoreState(snapshot) {
  tiles.forEach((tile) => tile.group.remove());
  tiles = [];
  selectedTile = null;
  nextTileId = 1;
  snapshot.forEach((item) => {
    createTile(item.shape, item.position, item.color, item.rotation, item.id, item.slotId);
  });
  if (tiles.length) selectTile(tiles[tiles.length - 1]);
  renderTemplate();
  updateStats();
}

function undoLastAction() {
  const snapshot = undoStack.pop();
  if (!snapshot) return;
  restoreState(snapshot);
  updateUndoButton();
}

function updateUndoButton() {
  const undoButton = document.querySelector("#undoButton");
  if (undoButton) {
    undoButton.disabled = undoStack.length === 0 || (activeMode === "decorate" && decorateComplete);
  }
}

function angleDifference(a, b) {
  const diff = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  return Math.min(diff, Math.abs(Math.PI - diff));
}

function findSnap(movingTile) {
  let best = null;
  const movingEdges = edgesFor(movingTile);
  const otherTiles = tiles.filter((tile) => tile !== movingTile);

  for (const movingEdge of movingEdges) {
    for (const otherTile of otherTiles) {
      for (const targetEdge of edgesFor(otherTile)) {
        const directionGap = angleDifference(movingEdge.angle, targetEdge.angle);
        if (directionGap > 0.16) continue;

        const dx = targetEdge.midpoint.x - movingEdge.midpoint.x;
        const dy = targetEdge.midpoint.y - movingEdge.midpoint.y;
        const distance = Math.hypot(dx, dy);
        if (distance > SNAP_DISTANCE) continue;

        const candidatePosition = {
          x: movingTile.position.x + dx,
          y: movingTile.position.y + dy,
        };
        const centerDistance = Math.hypot(
          candidatePosition.x - otherTile.position.x,
          candidatePosition.y - otherTile.position.y,
        );
        if (centerDistance < SIDE * 0.45) continue;

        if (!best || distance < best.distance) {
          best = { distance, position: candidatePosition };
        }
      }
    }
  }

  return best ? keepInsideBoard(best.position) : null;
}

function updateStats() {
  updateOverlapWarnings();

  if (activeMode === "template") {
    const total = getActiveTemplate().slots.length;
    const filled = getOccupiedSlotIds().size;
    tileCount.textContent = `${filled}/${total}`;
    scoreLabel.textContent = "도안 완성";
    templateStatus.hidden = false;
    templateStatus.textContent = filled === total ? "완성!" : `${filled} / ${total}`;
    templateStatus.classList.toggle("complete", filled === total);
  } else if (activeMode === "decorate") {
    tileCount.textContent = tiles.length;
    scoreLabel.textContent = decorateComplete ? "꾸미기 완성" : "사용한 도형";
    templateStatus.hidden = true;
    completeButton.disabled = tiles.length === 0;
    clearButton.disabled = decorateComplete || tiles.length === 0;
  } else {
    tileCount.textContent = tiles.length;
    scoreLabel.textContent = "배치한 도형";
    templateStatus.hidden = true;
  }
}

function resetBoardState() {
  tiles.forEach((tile) => tile.group.remove());
  tiles = [];
  selectedTile = null;
  nextTileId = 1;
  undoStack = [];
  decorateComplete = false;
  updateUndoButton();
}

function clearBoard() {
  if (activeMode === "decorate" && decorateComplete) return;
  const before = captureState();
  if (!before.length) return;
  tiles.forEach((tile) => tile.group.remove());
  tiles = [];
  selectedTile = null;
  pushUndoSnapshot(before);
  renderTemplate();
  updateStats();
}

function selectShape(shape) {
  selectedShape = shape;
  shapeButtons.forEach((button) => {
    const active = button.dataset.shape === shape;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  renderPalette();
}

function updateShapeAvailability() {
  const neededShapes = activeMode === "template"
    ? new Set(getActiveTemplate().slots.map((slot) => slot.shape))
    : new Set(Object.keys(shapeSides));

  shapeButtons.forEach((button) => {
    const available = neededShapes.has(button.dataset.shape);
    button.disabled = !available || (activeMode === "decorate" && decorateComplete);
    button.classList.toggle("not-needed", !available);
  });

  if (!neededShapes.has(selectedShape)) {
    selectShape([...neededShapes][0]);
  } else {
    renderPalette();
  }
}

function confirmResetIfNeeded(nextName) {
  if (!tiles.length) return true;
  return window.confirm(`지금 만든 도형이 지워져요.\n${nextName}로 바꿀까요?`);
}

function setMode(mode) {
  if (activeMode === mode) return;
  const modeName = { free: "자유", template: "도안", decorate: "꾸미기" }[mode];
  if (!confirmResetIfNeeded(modeName)) return;
  activeMode = mode;
  resetBoardState();
  templatePanel.hidden = mode !== "template";
  decoratePanel.hidden = mode !== "decorate";
  completeButton.hidden = mode !== "decorate";
  completeButton.textContent = "완성";
  completeButton.classList.remove("editing");
  paletteHint.textContent = mode === "decorate"
    ? "원하는 색의 도형을 누르면 물건 안에 바로 나타납니다."
    : "원하는 색의 도형을 작업판으로 끌어오세요.";
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  if (mode === "template") {
    boardTitle.textContent = `${getActiveTemplate().name} 도안 채우기`;
    boardHint.textContent = "도형을 직접 회전해 점선과 같은 방향으로 맞춘 뒤 가까이 놓으세요.";
  } else if (mode === "decorate") {
    const object = decorateObjects[activeObjectId];
    boardTitle.textContent = object.title;
    boardHint.textContent = object.hint;
  } else {
    boardTitle.textContent = "같은 길이의 변으로 붙이기";
    boardHint.textContent = "가운데를 잡으면 이동하고, 꼭짓점을 잡으면 회전합니다.";
  }

  updateShapeAvailability();
  renderTemplate();
  renderDecorativeObject();
  updateStats();
  updateGroupMoveButton();
}

function setTemplate(templateId) {
  if (activeTemplateId === templateId && activeMode === "template") return;
  if (!confirmResetIfNeeded("다른 도안")) return;
  activeTemplateId = templateId;
  resetBoardState();
  templateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.template === templateId);
  });
  boardTitle.textContent = `${getActiveTemplate().name} 도안 채우기`;
  updateShapeAvailability();
  renderTemplate();
  updateStats();
}

function setDecorativeObject(objectId) {
  if (activeObjectId === objectId && activeMode === "decorate") return;
  if (!confirmResetIfNeeded(decorateObjects[objectId].name)) return;
  activeObjectId = objectId;
  objectScale = 1.15;
  objectSizeRange.value = "115";
  objectSizeLabel.textContent = "115%";
  resetBoardState();
  objectButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.object === objectId);
  });
  const object = decorateObjects[objectId];
  boardTitle.textContent = object.title;
  boardHint.textContent = object.hint;
  completeButton.textContent = "완성";
  completeButton.classList.remove("editing");
  updateShapeAvailability();
  renderDecorativeObject();
  updateStats();
}

function toggleDecorateComplete() {
  if (activeMode !== "decorate" || tiles.length === 0) return;
  decorateComplete = !decorateComplete;
  selectedTile = null;
  tiles.forEach(updateTile);
  completeButton.textContent = decorateComplete ? "수정" : "완성";
  completeButton.classList.toggle("editing", decorateComplete);
  updateShapeAvailability();
  renderDecorativeObject();
  updateStats();
  updateUndoButton();
  updateGroupMoveButton();
}

function getExportTransform() {
  const contentBounds = viewportLayer.getBBox();
  const minX = Math.min(0, contentBounds.x);
  const minY = Math.min(0, contentBounds.y);
  const maxX = Math.max(820, contentBounds.x + contentBounds.width);
  const maxY = Math.max(620, contentBounds.y + contentBounds.height);
  const width = maxX - minX;
  const height = maxY - minY;
  const quarterTurn = Math.abs(viewRotation % 180) === 90;
  const rotatedWidth = quarterTurn ? height : width;
  const rotatedHeight = quarterTurn ? width : height;
  const margin = 24;
  const scale = Math.min(
    (820 - margin * 2) / rotatedWidth,
    (620 - margin * 2) / rotatedHeight,
  );
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return `translate(410 310) scale(${scale}) rotate(${viewRotation}) translate(${-centerX} ${-centerY})`;
}

function addExportStyles(clone) {
  const style = createSvgElement("style");
  style.textContent = `
    .tile { stroke: #17202a; stroke-width: 1.6; }
    .object-outline { fill: none; stroke: #17202a; stroke-width: 6; vector-effect: non-scaling-stroke; }
    .object-guide { fill: none; stroke: #8b98aa; stroke-width: 2.5; stroke-dasharray: 9 7; vector-effect: non-scaling-stroke; }
    .object-detail { fill: none; stroke: #17202a; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .object-detail.thin { stroke-width: 3; }
    .clock-number { fill: #17202a; font: 900 24px Arial, sans-serif; text-anchor: middle; }
  `;
  clone.querySelector("defs")?.appendChild(style);
}

async function createPngBlob() {
  const clone = board.cloneNode(true);
  clone.querySelector("#templateLayer")?.remove();
  clone.querySelector("#viewportLayer")?.setAttribute("transform", getExportTransform());
  clone.querySelectorAll(".corner-handle").forEach((node) => node.remove());
  clone.querySelectorAll(".dragging,.rotating,.selected,.overlap-warning").forEach((node) => {
    node.classList.remove("dragging", "rotating", "selected", "overlap-warning");
  });
  clone.setAttribute("xmlns", NS);
  clone.setAttribute("width", "820");
  clone.setAttribute("height", "620");
  clone.setAttribute("viewBox", "0 0 820 620");
  addExportStyles(clone);

  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 1640;
    canvas.height = 1240;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("PNG 변환에 실패했습니다.");
    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function downloadPng() {
  downloadButton.disabled = true;

  try {
    const pngBlob = await createPngBlob();
    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "my-tessellation.png";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } catch (error) {
    console.error(error);
    window.alert("PNG 파일을 만들지 못했습니다. 다시 시도해 주세요.");
  } finally {
    downloadButton.disabled = false;
  }
}

shapeButtons.forEach((button) => {
  button.addEventListener("click", () => selectShape(button.dataset.shape));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => setTemplate(button.dataset.template));
});

objectButtons.forEach((button) => {
  button.addEventListener("click", () => setDecorativeObject(button.dataset.object));
});

objectSizeRange.addEventListener("input", () => {
  objectScale = Number(objectSizeRange.value) / 100;
  objectSizeLabel.textContent = `${objectSizeRange.value}%`;
  renderDecorativeObject();
});

document.querySelector("#undoButton").addEventListener("click", undoLastAction);
clearButton.addEventListener("click", clearBoard);
downloadButton.addEventListener("click", downloadPng);
groupMoveButton.addEventListener("click", toggleGroupMove);
completeButton.addEventListener("click", toggleDecorateComplete);
document.querySelector("#rotateViewButton").addEventListener("click", rotateView);
document.querySelector("#zoomOutButton").addEventListener("click", () => changeZoom(-0.15));
document.querySelector("#zoomInButton").addEventListener("click", () => changeZoom(0.15));

renderPalette();
renderTemplate();
renderDecorativeObject();
updateStats();
updateUndoButton();
updateGroupMoveButton();

const initialParams = new URLSearchParams(window.location.search);
const initialTemplate = initialParams.get("template");
if (initialTemplate && templates[initialTemplate]) {
  activeTemplateId = initialTemplate;
  templateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.template === initialTemplate);
  });
}
if (initialParams.get("mode") === "template") {
  setMode("template");
}
if (initialParams.get("mode") === "decorate") {
  const initialObject = initialParams.get("object");
  if (initialObject && decorateObjects[initialObject]) {
    activeObjectId = initialObject;
    objectButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.object === initialObject);
    });
  }
  setMode("decorate");
}
