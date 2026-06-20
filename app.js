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
const accountStatus = document.querySelector("#accountStatus");
const openLoginButton = document.querySelector("#openLoginButton");
const classCodeInput = document.querySelector("#classCodeInput");
const userNameInput = document.querySelector("#userNameInput");
const passwordInput = document.querySelector("#passwordInput");
const loginButton = document.querySelector("#loginButton");
const logoutButton = document.querySelector("#logoutButton");
const entryOverlay = document.querySelector("#entryOverlay");
const entryTitle = document.querySelector("#entryTitle");
const entryDescription = document.querySelector(".entry-description");
const entryChoices = document.querySelector("#entryChoices");
const entryLoginForm = document.querySelector("#entryLoginForm");
const chooseLoginButton = document.querySelector("#chooseLoginButton");
const guestEntryButton = document.querySelector("#guestEntryButton");
const entryBackButton = document.querySelector("#entryBackButton");
const entryLoginError = document.querySelector("#entryLoginError");
const orientationOverlay = document.querySelector("#orientationOverlay");
const shareButton = document.querySelector("#shareButton");
const communityPanel = document.querySelector("#communityPanel");
const closeCommunityButton = document.querySelector("#closeCommunityButton");
const communityList = document.querySelector("#communityList");
const communityHint = document.querySelector("#communityHint");
const shareSuccessOverlay = document.querySelector("#shareSuccessOverlay");
const shareSuccessYesButton = document.querySelector("#shareSuccessYesButton");
const shareSuccessNoButton = document.querySelector("#shareSuccessNoButton");
const guideOverlay = document.querySelector("#guideOverlay");
const guideSpotlight = document.querySelector("#guideSpotlight");
const guideBubble = document.querySelector("#guideBubble");
const guideText = document.querySelector("#guideText");
const guideNextButton = document.querySelector("#guideNextButton");
const guideSkipButton = document.querySelector("#guideSkipButton");

const shapeButtons = [...document.querySelectorAll(".shape-button")];
const modeButtons = [...document.querySelectorAll(".mode-button")];
const templateButtons = [...document.querySelectorAll(".template-button")];
const objectButtons = [...document.querySelectorAll(".object-button")];

const NS = "http://www.w3.org/2000/svg";
const SIDE = 72;
const SNAP_DISTANCE = 24;
const SNAP_ROTATION_TOLERANCE = 10;
const TEMPLATE_SNAP_DISTANCE = 72;
const TEMPLATE_ROTATION_TOLERANCE = 4;
const TEMPLATE_MAX_SLOTS = 180;
const HANDLE_RADIUS = 4.5;
const LONG_PRESS_MS = 650;
const LONG_PRESS_MOVE_LIMIT = 8;
const BOARD_BOUNDS = { minX: 40, minY: 40, maxX: 780, maxY: 580 };
const GROUP_EDGE_DISTANCE = 6;
const GROUP_EDGE_ANGLE_TOLERANCE = 0.16;
const GUIDE_STORAGE_KEY = "tessellationGuideSeen";
const ACCOUNT_STORAGE_KEY = "tessellationAccounts";
const SESSION_STORAGE_KEY = "tessellationSession";
const COMMUNITY_STORAGE_KEY = "tessellationCommunityPosts";
const ENTRY_CHOICE_STORAGE_KEY = "tessellationEntryChoice";
const DEFAULT_CLASS_CODE = "class-1";
const palette = ["#ffffff", "#ffd166", "#f76f53", "#06a77d", "#4d96ff"];

const guideSteps = [
  { selector: '.mode-button[data-mode="free"]', text: "자유롭게 도형을 붙여볼 수 있어요." },
  { selector: ".shape-button.active", text: "도형을 고르면 아래에 색깔 도형이 나와요." },
  { selector: "#tessellationBoard", text: "빈 곳을 끌면 화면이 움직이고, 도형 꼭짓점은 회전해요." },
  { selector: ".viewport-controls", text: "화면을 돌리거나 크게 볼 수 있어요." },
];

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
let viewOffset = { x: 0, y: 0 };
let objectScale = 1.15;
let groupMoveEnabled = false;
let guideStepIndex = 0;
let currentUser = null;
let customColor = "#8e5cf7";

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
  const start = sides === 4 ? -45 : sides === 12 ? -105 : -90;
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

function pointsMatch(pointA, pointB, tolerance = 0.6) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y) <= tolerance;
}

function polygonMatches(record, polygon) {
  return record.sides === polygon.sides && pointsMatch(record.center, polygon.center);
}

function polygonIntersectsTemplateArea(points) {
  const bounds = polygonBounds(points);
  return bounds.maxX >= -2
    && bounds.minX <= 822
    && bounds.maxY >= -2
    && bounds.minY <= 622;
}

function polygonCenterWithinExpansionArea(center) {
  const margin = SIDE * 3.5;
  return center.x >= -margin
    && center.x <= 820 + margin
    && center.y >= -margin
    && center.y <= 620 + margin;
}

function createVertexFan(config, vertex, startAngle, startIndex = 0) {
  let angle = startAngle;
  return Array.from({ length: config.polygons.length }, (_, offset) => {
    const sides = config.polygons[(startIndex + offset) % config.polygons.length];
    const geometry = polygonAtSharedVertex(sides, vertex, angle);
    angle += 180 - 360 / sides;
    return { sides, ...geometry };
  });
}

function fanFitsExistingPolygons(fan, records) {
  let matches = 0;
  for (const polygon of fan) {
    if (records.some((record) => polygonMatches(record, polygon))) {
      matches += 1;
      continue;
    }
    if (records.some((record) => (
      boundsOverlap(polygonBounds(record.points), polygonBounds(polygon.points))
      && polygonsOverlap(record.points, polygon.points)
    ))) return null;
  }
  return { fan, matches };
}

function polygonRecordFromPoints(sides, points) {
  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / sides, y: sum.y + point.y / sides }),
    { x: 0, y: 0 },
  );
  const baseFirst = basePoints(shapeForSides(sides))[0];
  const baseAngle = toDegrees(Math.atan2(baseFirst.y, baseFirst.x));
  const firstAngle = toDegrees(Math.atan2(points[0].y - center.y, points[0].x - center.x));
  return { sides, center, points, rotation: firstAngle - baseAngle };
}

function buildSnubSquarePolygons() {
  const period = SIDE * (1 + Math.sqrt(3));
  const origin = { x: 410, y: 310 };
  const records = [];
  const recordKeys = new Set();

  const addRecord = (record) => {
    const key = `${record.sides}|${Math.round(record.center.x * 10)},${Math.round(record.center.y * 10)}`;
    if (recordKeys.has(key)) return;
    recordKeys.add(key);
    records.push(record);
  };

  for (let row = -6; row <= 6; row += 1) {
    for (let column = -6; column <= 6; column += 1) {
      const cell = {
        x: origin.x + column * period,
        y: origin.y + row * period,
      };
      [
        { x: 0, y: 0, rotation: 30 },
        { x: period / 2, y: 0, rotation: 60 },
        { x: period / 2, y: -period / 2, rotation: 30 },
        { x: period, y: -period / 2, rotation: 60 },
      ].forEach((motif) => {
        const center = { x: cell.x + motif.x, y: cell.y + motif.y };
        const points = basePoints("square").map((point) => {
          const rotated = rotatePoint(point, motif.rotation);
          return { x: center.x + rotated.x, y: center.y + rotated.y };
        });
        addRecord({ sides: 4, center, points, rotation: motif.rotation });
      });
    }
  }

  const squares = [...records];
  squares.forEach((square) => {
    square.points.forEach((edgeStart, index) => {
      const edgeEnd = square.points[(index + 1) % square.points.length];
      const reversedAngle = Math.atan2(edgeStart.y - edgeEnd.y, edgeStart.x - edgeEnd.x);
      const thirdPoint = {
        x: edgeStart.x + SIDE * Math.cos(reversedAngle + 2 * Math.PI / 3),
        y: edgeStart.y + SIDE * Math.sin(reversedAngle + 2 * Math.PI / 3),
      };
      addRecord(polygonRecordFromPoints(3, [edgeEnd, edgeStart, thirdPoint]));
    });
  });

  return records.filter((record) => polygonIntersectsTemplateArea(record.points));
}

function expandArchimedeanTemplate(config) {
  const origin = { x: 410, y: 310 };
  const records = createVertexFan(config, origin, -90).map((polygon) => ({ ...polygon }));
  const vertexQueue = records.flatMap((record) => record.points.map((point) => ({ ...point })));
  const processedVertices = new Set();

  while (vertexQueue.length && records.length < TEMPLATE_MAX_SLOTS) {
    const vertex = vertexQueue.shift();
    const vertexKey = `${Math.round(vertex.x * 10)},${Math.round(vertex.y * 10)}`;
    if (processedVertices.has(vertexKey)) continue;
    processedVertices.add(vertexKey);

    const incident = records.filter((record) => record.points.some((point) => pointsMatch(point, vertex)));
    let best = null;

    incident.forEach((anchor) => {
      const vertexIndex = anchor.points.findIndex((point) => pointsMatch(point, vertex));
      const nextPoint = anchor.points[(vertexIndex + 1) % anchor.points.length];
      const startAngle = toDegrees(Math.atan2(nextPoint.y - vertex.y, nextPoint.x - vertex.x));

      config.polygons.forEach((sides, configIndex) => {
        if (sides !== anchor.sides) return;
        const fan = createVertexFan(config, vertex, startAngle, configIndex);
        if (!polygonMatches(anchor, fan[0])) return;
        const candidate = fanFitsExistingPolygons(fan, records);
        if (!candidate) return;
        if (!best || candidate.matches > best.matches) best = candidate;
      });
    });

    if (!best) continue;
    best.fan.forEach((polygon) => {
      if (!polygonCenterWithinExpansionArea(polygon.center)) return;
      if (records.some((record) => polygonMatches(record, polygon))) return;
      records.push({ ...polygon });
      polygon.points.forEach((point) => vertexQueue.push({ ...point }));
    });
  }

  return records.filter((record) => polygonIntersectsTemplateArea(record.points));
}

function buildArchimedeanTemplate(id) {
  const config = archimedeanConfigs[id];
  const polygons = id === "t33434" ? buildSnubSquarePolygons() : expandArchimedeanTemplate(config);
  const slots = polygons.map((polygon, index) => ({
    id: `${id}-${index}`,
    shape: shapeForSides(polygon.sides),
    x: polygon.center.x,
    y: polygon.center.y,
    rotation: polygon.rotation,
  }));
  return { name: config.name, slots };
}

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
  const appendPaletteButton = (color, container = paletteTray, custom = false) => {
    const button = document.createElement("button");
    button.className = "palette-shape";
    button.type = "button";
    button.disabled = activeMode === "decorate" && decorateComplete;
    button.dataset.color = color;
    const paletteAction = activeMode === "decorate" ? "만들기" : "끌어오기";
    button.setAttribute(
      "aria-label",
      `${shapeNames[selectedShape]} ${custom ? "내가 고른 색" : color} ${paletteAction}`,
    );

    const svg = createSvgElement("svg", { viewBox: "0 0 72 72", "aria-hidden": "true" });
    const polygon = createSvgElement("polygon", {
      points: pointsToString(palettePoints(selectedShape)),
      fill: color,
      stroke: "#17202a",
      "stroke-width": "2",
    });
    svg.appendChild(polygon);
    button.appendChild(svg);
    button.addEventListener("pointerdown", (event) => startPaletteDrag(event, button.dataset.color));
    container.appendChild(button);
    return { button, polygon };
  };

  palette.forEach((color) => appendPaletteButton(color));

  const customCell = document.createElement("div");
  customCell.className = "custom-palette-cell";
  const customShape = appendPaletteButton(customColor, customCell, true);
  const colorInput = document.createElement("input");
  colorInput.className = "custom-color-input";
  colorInput.type = "color";
  colorInput.value = customColor;
  colorInput.setAttribute("aria-label", "도형 색상 직접 고르기");
  colorInput.title = "색상 직접 고르기";
  colorInput.addEventListener("pointerdown", (event) => event.stopPropagation());
  colorInput.addEventListener("input", () => {
    customColor = colorInput.value;
    customShape.button.dataset.color = customColor;
    customShape.button.setAttribute(
      "aria-label",
      `${shapeNames[selectedShape]} 내가 고른 색 ${activeMode === "decorate" ? "만들기" : "끌어오기"}`,
    );
    customShape.polygon.setAttribute("fill", customColor);
  });
  const rainbowIndicator = document.createElement("span");
  rainbowIndicator.className = "custom-color-indicator";
  rainbowIndicator.setAttribute("aria-hidden", "true");
  customCell.append(customShape.button, rainbowIndicator, colorInput);
  paletteTray.appendChild(customCell);
}

function getActiveTemplate() {
  if (!templates[activeTemplateId]) {
    templates[activeTemplateId] = buildArchimedeanTemplate(activeTemplateId);
  }
  return templates[activeTemplateId];
}

function getOccupiedSlotIds() {
  return new Set(tiles.map((tile) => tile.slotId).filter(Boolean));
}

function templateEdgeKey(pointA, pointB) {
  const pointKey = (point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  return [pointKey(pointA), pointKey(pointB)].sort().join("|");
}

function renderTemplate() {
  templateLayer.replaceChildren();
  if (activeMode !== "template") return;

  const occupied = getOccupiedSlotIds();
  const uniqueEdges = new Map();
  getActiveTemplate().slots.forEach((slot) => {
    const points = slotPoints(slot);
    const polygon = createSvgElement("polygon", {
      class: `template-slot${occupied.has(slot.id) ? " occupied" : ""}`,
      points: pointsToString(points),
      "data-slot-id": slot.id,
      "data-shape": slot.shape,
    });
    templateLayer.appendChild(polygon);
    points.forEach((start, index) => {
      const end = points[(index + 1) % points.length];
      const key = templateEdgeKey(start, end);
      if (!uniqueEdges.has(key)) uniqueEdges.set(key, { start, end });
    });
  });

  uniqueEdges.forEach(({ start, end }) => {
    templateLayer.appendChild(createSvgElement("line", {
      class: "template-edge",
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    }));
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
  if (selectedShape !== tile.shape) selectShape(tile.shape);
  selectedTile = tile;
  tileLayer.appendChild(tile.group);
  tiles.forEach((item) => {
    item.group.classList.toggle("selected", item === tile);
    updateTile(item);
  });
}

function getSvgPoint(event) {
  return getSvgPointFromClient(event.clientX, event.clientY);
}

function getSvgPointFromClient(clientX, clientY) {
  const point = board.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(board.getScreenCTM().inverse());
}

function getBoardPoint(event) {
  return getBoardPointFromClient(event.clientX, event.clientY);
}

function getBoardPointFromClient(clientX, clientY) {
  const boardPoint = getSvgPointFromClient(clientX, clientY);
  const center = { x: 410, y: 310 };
  const scaled = {
    x: (boardPoint.x - center.x - viewOffset.x) / viewScale,
    y: (boardPoint.y - center.y - viewOffset.y) / viewScale,
  };
  const unrotated = rotatePoint(scaled, -viewRotation);
  return {
    x: unrotated.x + center.x,
    y: unrotated.y + center.y,
  };
}

function getVisibleSpawnPoint() {
  const rect = board.getBoundingClientRect();
  const bounds = getWorkspaceBounds();
  const clientPoints = [
    [0.5, 0.5],
    [0.35, 0.5], [0.65, 0.5], [0.5, 0.35], [0.5, 0.65],
    [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75],
  ];

  const visiblePoints = clientPoints.map(([xRatio, yRatio]) => (
    getBoardPointFromClient(rect.left + rect.width * xRatio, rect.top + rect.height * yRatio)
  )).filter((point) => (
    point.x >= bounds.minX
    && point.x <= bounds.maxX
    && point.y >= bounds.minY
    && point.y <= bounds.maxY
    && (activeMode !== "decorate" || isPointInsideDecorativeArea(point))
  ));

  if (visiblePoints.length) return visiblePoints[0];

  viewOffset = { x: 0, y: 0 };
  applyViewportTransform();
  return { x: 410, y: 310 };
}

function applyViewportTransform() {
  viewportLayer.setAttribute(
    "transform",
    `translate(${410 + viewOffset.x} ${310 + viewOffset.y}) scale(${viewScale}) rotate(${viewRotation}) translate(-410 -310)`,
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
  groupMoveButton.title = groupMoveEnabled ? "묶음 이동 켜짐: 눌러서 끄기" : "묶음 이동 꺼짐: 눌러서 켜기";
  groupMoveButton.setAttribute("aria-pressed", groupMoveEnabled ? "true" : "false");
  groupMoveButton.setAttribute("aria-label", `묶음 이동 ${groupMoveEnabled ? "켜짐" : "꺼짐"}`);
  groupMoveButton.disabled = activeMode === "decorate" && decorateComplete;
}

function toggleGroupMove() {
  if (activeMode === "decorate" && decorateComplete) return;
  groupMoveEnabled = !groupMoveEnabled;
  updateGroupMoveButton();
}

function startPanDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (event.target !== board) return;
  event.preventDefault();
  dragState = {
    mode: "pan",
    startClient: { x: event.clientX, y: event.clientY },
    startBoardPoint: getSvgPoint(event),
    startOffset: { ...viewOffset },
    longPressTimer: null,
  };
  board.classList.add("panning");
  beginGlobalDrag(event.pointerId);
}

function hasSeenGuide() {
  try {
    return localStorage.getItem(GUIDE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markGuideSeen() {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, "1");
  } catch {
    // The guide can still close normally if storage is blocked.
  }
}

function finishGuide() {
  if (!guideOverlay) return;
  guideOverlay.hidden = true;
  markGuideSeen();
}

function positionGuide() {
  if (!guideOverlay || guideOverlay.hidden) return;
  const step = guideSteps[guideStepIndex];
  const target = document.querySelector(step.selector);
  if (!target) return;

  const targetRect = target.getBoundingClientRect();
  const margin = 8;
  guideSpotlight.style.left = `${Math.max(margin, targetRect.left - margin)}px`;
  guideSpotlight.style.top = `${Math.max(margin, targetRect.top - margin)}px`;
  guideSpotlight.style.width = `${targetRect.width + margin * 2}px`;
  guideSpotlight.style.height = `${targetRect.height + margin * 2}px`;

  const bubbleRect = guideBubble.getBoundingClientRect();
  let left = targetRect.right + 14;
  let top = targetRect.top;

  if (left + bubbleRect.width > window.innerWidth - margin) {
    left = targetRect.left;
    top = targetRect.bottom + 14;
  }
  if (top + bubbleRect.height > window.innerHeight - margin) {
    top = targetRect.top - bubbleRect.height - 14;
  }

  guideBubble.style.left = `${Math.max(margin, Math.min(left, window.innerWidth - bubbleRect.width - margin))}px`;
  guideBubble.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - bubbleRect.height - margin))}px`;
}

function showGuideStep(index) {
  if (!guideOverlay) return;
  guideStepIndex = Math.min(index, guideSteps.length - 1);
  guideText.textContent = guideSteps[guideStepIndex].text;
  guideNextButton.textContent = guideStepIndex === guideSteps.length - 1 ? "시작하기" : "다음";
  guideOverlay.hidden = false;
  requestAnimationFrame(positionGuide);
}

function startGuide() {
  if (
    !guideOverlay
    || hasSeenGuide()
    || (entryOverlay && !entryOverlay.hidden)
    || (orientationOverlay && !orientationOverlay.hidden)
  ) return;
  showGuideStep(0);
}

function shouldShowOrientationNotice() {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const touchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const screenWidth = Math.min(
    window.screen?.width || window.innerWidth,
    window.screen?.height || window.innerHeight
  );
  return portrait && touchDevice && (screenWidth <= 1024 || window.innerWidth <= 1024);
}

function updateOrientationNotice() {
  if (!orientationOverlay) return;
  const wasVisible = !orientationOverlay.hidden;
  const isVisible = shouldShowOrientationNotice();
  orientationOverlay.hidden = !isVisible;
  document.body.classList.toggle("orientation-blocked", isVisible);

  if (wasVisible && !isVisible) {
    setTimeout(startGuide, 250);
  }
}

function showNextGuideStep() {
  if (guideStepIndex >= guideSteps.length - 1) {
    finishGuide();
    return;
  }
  showGuideStep(guideStepIndex + 1);
}

function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    window.alert("이 기기에는 저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요.");
  }
}

function getEntryChoice() {
  try {
    return localStorage.getItem(ENTRY_CHOICE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function setEntryChoice(choice) {
  try {
    localStorage.setItem(ENTRY_CHOICE_STORAGE_KEY, choice);
  } catch {
    // Entry selection still works for the current visit if storage is blocked.
  }
}

function hideEntryOverlay() {
  if (!entryOverlay) return;
  entryOverlay.hidden = true;
  document.body.classList.remove("entry-open");
  setTimeout(startGuide, 250);
}

function showEntryChoices() {
  if (!entryOverlay) return;
  entryTitle.textContent = "어떻게 시작할까요?";
  entryDescription.textContent = "로그인하면 같은 반 친구들과 작품을 나눌 수 있어요.";
  entryChoices.hidden = false;
  entryLoginForm.hidden = true;
  entryLoginError.hidden = true;
  entryOverlay.hidden = false;
  document.body.classList.add("entry-open");
}

function showEntryLogin() {
  if (!entryOverlay) return;
  entryTitle.textContent = "반 친구들과 시작해요";
  entryDescription.textContent = "처음 입력한 이름과 비밀번호로 계정이 만들어져요.";
  entryChoices.hidden = true;
  entryLoginForm.hidden = false;
  entryLoginError.hidden = true;
  entryOverlay.hidden = false;
  document.body.classList.add("entry-open");
  requestAnimationFrame(() => userNameInput?.focus());
}

function enterAsGuest() {
  setEntryChoice("guest");
  hideEntryOverlay();
  updateAccountUi();
}

function initializeEntryScreen() {
  if (!entryOverlay || currentUser?.name || getEntryChoice()) {
    hideEntryOverlay();
    return;
  }
  showEntryChoices();
}

function normalizeUserName(name) {
  return name.trim().replace(/\s+/g, " ").slice(0, 12);
}

function normalizeClassCode(classCode) {
  return String(classCode || DEFAULT_CLASS_CODE).trim().replace(/\s+/g, "-").toLowerCase().slice(0, 24);
}

function getCloudBridge() {
  return window.tessellationCloud || null;
}

async function getCloudIfAvailable() {
  const cloud = getCloudBridge();
  if (!cloud?.isAvailable) return null;
  try {
    return await cloud.isAvailable() ? cloud : null;
  } catch {
    return null;
  }
}

function hashPassword(name, password) {
  const source = `${name}:${password}`;
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash) + source.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getLocalAccounts() {
  return readJsonStorage(ACCOUNT_STORAGE_KEY, {});
}

function setSession(user) {
  currentUser = {
    ...user,
    classCode: normalizeClassCode(user.classCode),
  };
  writeJsonStorage(SESSION_STORAGE_KEY, currentUser);
  updateAccountUi();
  renderCommunityPosts();
}

async function clearSession() {
  try {
    await getCloudBridge()?.signOut?.();
  } catch {
    // Local sign-out should still continue when Firebase is unavailable.
  }
  currentUser = null;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
  setEntryChoice("guest");
  updateAccountUi();
  renderCommunityPosts();
}

function restoreSession() {
  const saved = readJsonStorage(SESSION_STORAGE_KEY, null);
  if (saved?.name) currentUser = { ...saved, classCode: normalizeClassCode(saved.classCode) };
  if (classCodeInput && !classCodeInput.value) {
    classCodeInput.value = currentUser?.classCode || DEFAULT_CLASS_CODE;
  }
  updateAccountUi();
}

function updateAccountUi() {
  if (!accountStatus) return;
  const signedIn = Boolean(currentUser?.name);
  accountStatus.textContent = signedIn ? `${currentUser.name} · ${currentUser.classCode || DEFAULT_CLASS_CODE}` : "손님 모드";
  openLoginButton.hidden = signedIn;
  logoutButton.hidden = !signedIn;
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (currentUser?.token && !headers.Authorization) {
    headers.Authorization = `Bearer ${currentUser.token}`;
  }

  const response = await fetch(path, {
    headers,
    ...options,
  });
  if (!response.ok) {
    const rawMessage = await response.text();
    let message = rawMessage;
    try {
      message = JSON.parse(rawMessage).error || rawMessage;
    } catch {
      // Plain text errors are shown as-is.
    }
    const error = new Error(message || `HTTP ${response.status}`);
    error.status = response.status;
    if (response.status === 401 && currentUser?.token) {
      clearSession();
    }
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

async function authenticateUser(name, password, classCode) {
  const cloud = await getCloudIfAvailable();
  if (cloud) {
    return cloud.signIn({ name, password, classCode });
  }

  try {
    const data = await apiRequest("./api/auth", {
      method: "POST",
      body: JSON.stringify({ name, password, classCode }),
    });
    return {
      ...data.user,
      classCode,
    };
  } catch (error) {
    if (error.status && error.status !== 404) throw error;
    const accounts = getLocalAccounts();
    const accountKey = `${classCode}:${name}`;
    const passwordHash = hashPassword(accountKey, password);
    const existing = accounts[accountKey];

    if (existing && existing.passwordHash !== passwordHash) {
      throw new Error("비밀번호가 맞지 않아요.");
    }

    accounts[accountKey] = existing || {
      name,
      classCode,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    writeJsonStorage(ACCOUNT_STORAGE_KEY, accounts);
    return { name, classCode };
  }
}

async function signIn() {
  if (loginButton) loginButton.disabled = true;
  if (entryLoginError) entryLoginError.hidden = true;
  const classCode = normalizeClassCode(classCodeInput?.value);
  const name = normalizeUserName(userNameInput.value);
  const password = passwordInput.value.trim();
  if (!classCode || !name || !password) {
    if (entryLoginError) {
      entryLoginError.textContent = "반 코드, 이름, 비밀번호를 모두 입력해 주세요.";
      entryLoginError.hidden = false;
    }
    if (loginButton) loginButton.disabled = false;
    return;
  }

  try {
    const user = await authenticateUser(name, password, classCode);
    passwordInput.value = "";
    setSession(user);
    setEntryChoice("login");
    hideEntryOverlay();
  } catch (error) {
    if (entryLoginError) {
      entryLoginError.textContent = error.message || "입장하지 못했습니다.";
      entryLoginError.hidden = false;
    }
  } finally {
    if (loginButton) loginButton.disabled = false;
  }
}

function getLocalCommunityPosts() {
  return readJsonStorage(COMMUNITY_STORAGE_KEY, []);
}

function saveLocalCommunityPosts(posts) {
  writeJsonStorage(COMMUNITY_STORAGE_KEY, posts.slice(0, 24));
}

async function getCommunityPosts() {
  const cloud = await getCloudIfAvailable();
  if (cloud && currentUser?.name) {
    return cloud.listPosts(currentUser);
  }

  try {
    const data = await apiRequest("./api/posts");
    return data.posts || [];
  } catch {
    return getLocalCommunityPosts();
  }
}

async function saveCommunityPost(post) {
  const cloud = await getCloudIfAvailable();
  if (cloud) {
    return cloud.savePost(post, currentUser);
  }

  try {
    const data = await apiRequest("./api/posts", {
      method: "POST",
      body: JSON.stringify(post),
    });
    return data.post;
  } catch (error) {
    if (error.status && error.status !== 404) throw error;
    const posts = getLocalCommunityPosts();
    posts.unshift(post);
    saveLocalCommunityPosts(posts);
    return post;
  }
}

async function removeCommunityPost(postId, author) {
  const cloud = await getCloudIfAvailable();
  if (cloud) {
    await cloud.deletePost(postId, currentUser);
    return;
  }

  try {
    await apiRequest(`./api/posts?id=${encodeURIComponent(postId)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error.status && error.status !== 404) throw error;
    const posts = getLocalCommunityPosts();
    saveLocalCommunityPosts(posts.filter((item) => !(item.id === postId && item.author === author)));
  }
}

function formatPostTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function createBoardPost() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: currentUser.name,
    ownerUid: currentUser.uid || "",
    classCode: currentUser.classCode || DEFAULT_CLASS_CODE,
    createdAt: new Date().toISOString(),
    mode: activeMode,
    templateId: activeTemplateId,
    objectId: activeObjectId,
    objectScale,
    tileCount: tiles.length,
    tiles: captureState(),
    thumbnailWebp: await createWebpThumbnailDataUrl(),
  };
}

async function publishCurrentBoard() {
  if (!currentUser?.name) {
    window.alert("이름과 비밀번호로 먼저 입장해 주세요.");
    userNameInput?.focus();
    return;
  }
  if (!tiles.length) {
    window.alert("공유할 도형을 먼저 만들어 주세요.");
    return;
  }

  shareButton.disabled = true;
  shareButton.textContent = "올리는 중";
  try {
    await saveCommunityPost(await createBoardPost());
    showShareSuccessDialog();
  } catch (error) {
    window.alert(error.message || "공유하지 못했습니다.");
  } finally {
    shareButton.disabled = false;
    shareButton.textContent = "공유";
  }
}

function showShareSuccessDialog() {
  shareSuccessOverlay.hidden = false;
  shareSuccessYesButton.focus();
}

function closeShareSuccessDialog() {
  shareSuccessOverlay.hidden = true;
  shareButton.focus();
}

async function openClassCommunityAfterShare() {
  shareSuccessOverlay.hidden = true;
  communityPanel.hidden = false;
  await renderCommunityPosts();
  closeCommunityButton.focus();
}

async function loadCommunityPost(postId) {
  const post = (await getCommunityPosts()).find((item) => item.id === postId);
  if (!post) return;
  if (tiles.length && !window.confirm("지금 만든 도형이 지워져요.\n게시판 작품을 불러올까요?")) return;
  activeMode = post.mode || "free";
  activeTemplateId = post.templateId || activeTemplateId;
  activeObjectId = post.objectId || activeObjectId;
  objectScale = post.objectScale || objectScale;
  objectSizeRange.value = String(Math.round(objectScale * 100));
  objectSizeLabel.textContent = `${objectSizeRange.value}%`;
  templatePanel.hidden = activeMode !== "template";
  decoratePanel.hidden = activeMode !== "decorate";
  completeButton.hidden = activeMode !== "decorate";
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === activeMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  templateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.template === activeTemplateId);
  });
  objectButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.object === activeObjectId);
  });
  if (activeMode === "template") {
    boardTitle.textContent = `${getActiveTemplate().name} 도안 채우기`;
    boardHint.textContent = "도형을 직접 회전해 점선과 같은 방향으로 맞춘 뒤 가까이 놓으세요.";
  } else if (activeMode === "decorate") {
    const object = decorateObjects[activeObjectId];
    boardTitle.textContent = object.title;
    boardHint.textContent = object.hint;
  } else {
    boardTitle.textContent = "같은 길이의 변으로 붙이기";
    boardHint.textContent = "빈 곳: 화면 이동 · 도형: 이동/회전";
  }
  restoreState(post.tiles || post.designData?.tiles || []);
  renderDecorativeObject();
  updateShapeAvailability();
  updateStats();
}

async function deleteCommunityPost(postId) {
  const posts = await getCommunityPosts();
  const post = posts.find((item) => item.id === postId);
  const canDelete = post?.ownerUid && currentUser?.uid
    ? post.ownerUid === currentUser.uid
    : post?.author === currentUser?.name;
  if (!post || !canDelete) return;
  try {
    await removeCommunityPost(postId, currentUser.name);
    renderCommunityPosts();
  } catch (error) {
    window.alert(error.message || "삭제하지 못했습니다.");
  }
}

async function renderCommunityPosts() {
  if (!communityList) return;
  const posts = await getCommunityPosts();
  communityList.replaceChildren();
  if (!posts.length) {
    const empty = document.createElement("p");
    empty.className = "community-empty";
    empty.textContent = "아직 올라온 보드가 없어요.";
    communityList.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "community-card";

    const title = document.createElement("strong");
    title.textContent = `${post.author}의 테셀레이션`;
    const meta = document.createElement("span");
    meta.textContent = `${post.tileCount || 0}개 도형 · ${formatPostTime(post.createdAt)}`;

    if (post.thumbnailWebp) {
      const preview = document.createElement("img");
      preview.src = post.thumbnailWebp;
      preview.alt = `${post.author} 미리보기`;
      preview.loading = "lazy";
      card.appendChild(preview);
    }

    const actions = document.createElement("div");
    actions.className = "community-card-actions";
    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.textContent = "불러오기";
    loadButton.addEventListener("click", () => loadCommunityPost(post.id));
    actions.appendChild(loadButton);

    const canDelete = post.ownerUid && currentUser?.uid
      ? post.ownerUid === currentUser.uid
      : post.author === currentUser?.name;
    if (canDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "삭제";
      deleteButton.addEventListener("click", () => deleteCommunityPost(post.id));
      actions.appendChild(deleteButton);
    }

    card.append(title, meta, actions);
    communityList.appendChild(card);
  });
}

function startPaletteDrag(event, color) {
  if (activeMode === "decorate" && decorateComplete) return;
  event.preventDefault();
  const before = captureState();
  const visiblePoint = getVisibleSpawnPoint();
  const position = activeMode === "decorate"
    ? getDecorativeSpawnPoint(visiblePoint)
    : keepInsideBoard(visiblePoint);
  const tile = createTile(selectedShape, position, color);
  const pointerPoint = getBoardPoint(event);
  tile.group.classList.add("dragging");
  dragState = {
    mode: "move",
    tile,
    groupTiles: [tile],
    startPositions: [{
      tile,
      position: { ...tile.position },
    }],
    offset: { x: pointerPoint.x - position.x, y: pointerPoint.y - position.y },
    fromPalette: true,
    before,
    startClient: { x: event.clientX, y: event.clientY },
    longPressTimer: null,
  };
  beginGlobalDrag(event.pointerId);
}

function getDecorativeSpawnPoint(center = { x: 410, y: 310 }) {
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
  const startIndex = tiles.length % offsets.length;
  for (let index = 0; index < offsets.length; index += 1) {
    const offset = offsets[(startIndex + index) % offsets.length];
    const point = { x: center.x + offset.x, y: center.y + offset.y };
    if (isPointInsideDecorativeArea(point)) return point;
  }
  return { x: 410, y: 310 };
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

  if (dragState.mode === "pan") {
    const point = getSvgPoint(event);
    viewOffset = {
      x: dragState.startOffset.x + point.x - dragState.startBoardPoint.x,
      y: dragState.startOffset.y + point.y - dragState.startBoardPoint.y,
    };
    applyViewportTransform();
    positionGuide();
    return;
  }

  const point = getBoardPoint(event);

  if (dragState.mode === "move" && dragState.fromPalette) {
    const boardRect = board.getBoundingClientRect();
    if (
      event.clientX >= boardRect.left && event.clientX <= boardRect.right
      && event.clientY >= boardRect.top && event.clientY <= boardRect.bottom
    ) {
      dragState.offset = { x: 0, y: 0 };
      dragState.fromPalette = false;
    }
  }

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
  clearLongPressTimer();

  if (mode === "pan") {
    cleanupDragState();
    try {
      board.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    return;
  }

  const before = dragState.before;

  const isGroupMove = mode === "move" && dragState.groupTiles?.length > 1;

  if (mode === "move" && !isGroupMove) {
    const templateSnap = findTemplateSnap(tile);
    const edgeSnap = templateSnap ? null : findSnap(tile);

    if (templateSnap) {
      applyTemplateSnap(tile, templateSnap);
    } else if (edgeSnap) {
      tile.position = edgeSnap.position;
      tile.rotation = edgeSnap.rotation;
      tile.slotId = null;
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
  tile.rotation = slot.rotation;
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
  board.classList.remove("panning");
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

function tileOverlapsOthersAt(tile, position, rotation) {
  const points = worldPoints(tile, position, rotation);
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

function exactEdgeSnapCandidate(movingTile, movingIndex, movingEdge, targetEdge) {
  return window.TessellationGeometry.computeExactEdgeSnap({
    basePoints: basePoints(movingTile.shape),
    movingEdge,
    movingIndex,
    movingRotation: movingTile.rotation,
    targetEdge,
    toleranceDegrees: SNAP_ROTATION_TOLERANCE,
  });
}

function findSnap(movingTile) {
  let best = null;
  const movingEdges = edgesFor(movingTile);
  const otherTiles = tiles.filter((tile) => tile !== movingTile);

  for (let movingIndex = 0; movingIndex < movingEdges.length; movingIndex += 1) {
    const movingEdge = movingEdges[movingIndex];
    for (const otherTile of otherTiles) {
      for (const targetEdge of edgesFor(otherTile)) {
        const candidate = exactEdgeSnapCandidate(movingTile, movingIndex, movingEdge, targetEdge);
        if (!candidate) continue;
        const candidatePosition = candidate.position;
        const candidateRotation = candidate.rotation;
        const distance = Math.hypot(
          candidatePosition.x - movingTile.position.x,
          candidatePosition.y - movingTile.position.y,
        );
        if (distance > SNAP_DISTANCE) continue;

        const centerDistance = Math.hypot(
          candidatePosition.x - otherTile.position.x,
          candidatePosition.y - otherTile.position.y,
        );
        if (centerDistance < SIDE * 0.45) continue;
        if (tileOverlapsOthersAt(movingTile, candidatePosition, candidateRotation)) continue;
        if (candidate.endpointError > 0.01) continue;

        const score = distance + Math.abs(candidate.correctionDegrees) * 0.35;

        if (!best || score < best.score) {
          best = {
            score,
            position: candidatePosition,
            rotation: normalizeRotation(candidateRotation),
          };
        }
      }
    }
  }

  return best;
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
  if (paletteHint) {
    paletteHint.textContent = mode === "decorate"
      ? "원하는 색의 도형을 누르면 물건 안에 바로 나타납니다."
      : "원하는 색의 도형을 작업판으로 끌어오세요.";
  }
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
    boardHint.textContent = "빈 곳: 화면 이동 · 도형: 이동/회전";
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
    .clock-number { fill: #17202a; font: 900 24px "A2Z", Arial, sans-serif; text-anchor: middle; }
  `;
  clone.querySelector("defs")?.appendChild(style);
}

async function createBoardRasterBlob({
  type = "image/png",
  width = 1640,
  height = 1240,
  maxWidth = null,
  maxHeight = null,
  quality,
} = {}) {
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
    if (maxWidth && maxHeight) {
      const scale = Math.min(maxWidth / 820, maxHeight / 620);
      canvas.width = Math.max(1, Math.round(820 * scale));
      canvas.height = Math.max(1, Math.round(620 * scale));
    } else {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const outputBlob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!outputBlob) throw new Error("이미지 변환에 실패했습니다.");
    return outputBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function createPngBlob() {
  return createBoardRasterBlob({ type: "image/png", width: 1640, height: 1240 });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

async function createWebpThumbnailDataUrl() {
  try {
    const blob = await createBoardRasterBlob({
      type: "image/webp",
      maxWidth: 480,
      maxHeight: 320,
      quality: 0.72,
    });
    return await blobToDataUrl(blob);
  } catch (error) {
    console.warn("WebP thumbnail failed:", error);
    return "";
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
board.addEventListener("pointerdown", startPanDrag);
openLoginButton?.addEventListener("click", showEntryLogin);
logoutButton?.addEventListener("click", clearSession);
chooseLoginButton?.addEventListener("click", showEntryLogin);
guestEntryButton?.addEventListener("click", enterAsGuest);
entryBackButton?.addEventListener("click", showEntryChoices);
entryLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  signIn();
});
shareButton?.addEventListener("click", publishCurrentBoard);
shareSuccessYesButton?.addEventListener("click", openClassCommunityAfterShare);
shareSuccessNoButton?.addEventListener("click", closeShareSuccessDialog);
closeCommunityButton?.addEventListener("click", () => {
  communityPanel.hidden = true;
});
document.querySelector("#rotateViewButton").addEventListener("click", rotateView);
document.querySelector("#zoomOutButton").addEventListener("click", () => changeZoom(-0.15));
document.querySelector("#zoomInButton").addEventListener("click", () => changeZoom(0.15));
guideNextButton?.addEventListener("click", showNextGuideStep);
guideSkipButton?.addEventListener("click", finishGuide);
window.addEventListener("resize", () => {
  positionGuide();
  updateOrientationNotice();
});
window.addEventListener("orientationchange", updateOrientationNotice);
window.addEventListener("tessellation-cloud-ready", async () => {
  const ready = await getCloudBridge()?.getReadyState?.();
  if (classCodeInput && !classCodeInput.value) {
    classCodeInput.value = currentUser?.classCode || ready?.classCode || DEFAULT_CLASS_CODE;
  }
  renderCommunityPosts();
});

renderPalette();
renderTemplate();
renderDecorativeObject();
updateStats();
updateUndoButton();
updateGroupMoveButton();
restoreSession();
initializeEntryScreen();
updateOrientationNotice();
renderCommunityPosts();

const initialParams = new URLSearchParams(window.location.search);
const initialTemplate = initialParams.get("template");
if (initialTemplate && archimedeanConfigs[initialTemplate]) {
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

setTimeout(startGuide, 350);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
