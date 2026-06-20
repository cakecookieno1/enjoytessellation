const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function assertFile(filePath) {
  assert(fs.existsSync(path.join(root, filePath)), `${filePath} is missing`);
}

async function callApi(handler, method, body, query = {}, headers = {}) {
  const response = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(value) {
      this.body = value || "";
    },
  };

  await handler({
    headers,
    method,
    body,
    query,
    [Symbol.asyncIterator]: async function* iterator() {},
  }, response);

  return {
    body: response.body ? JSON.parse(response.body) : null,
    status: response.statusCode,
  };
}

async function main() {
  [
    "index.html",
    "app.js",
    "styles.css",
    "manifest.webmanifest",
    "sw.js",
    "vercel.json",
    "firebase-client.js",
    "geometry-core.js",
    "scripts/verify-geometry.js",
    "cloud-config.js",
    "firebase-config.example.js",
    ".firebaserc",
    "firebase.json",
    "firestore.rules",
    "assets/icons/favicon.ico",
    "assets/icons/favicon-32.png",
    "assets/icons/icon-180.png",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "api/auth.js",
    "api/posts.js",
    "api/_storage.js",
  ].forEach(assertFile);

  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert(manifest.name === "테셀레이션 놀이터", "manifest name is wrong");
  assert(manifest.display === "standalone", "manifest display must be standalone");
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "manifest needs app icons");

  const html = read("index.html");
  assert(html.includes('rel="manifest"'), "index.html must link manifest");
  assert(html.includes("serviceWorker") || read("app.js").includes("serviceWorker"), "service worker registration is missing");
  assert(html.includes("shareButton"), "share button is missing");
  assert(html.includes("userNameInput"), "login UI is missing");
  assert(html.includes("classCodeInput"), "class code UI is missing");
  assert(html.includes("firebase-client.js"), "Firebase client script is missing");
  assert(html.includes("geometry-core.js"), "geometry core script is missing");
  assert(html.includes("entryOverlay"), "entry choice screen is missing");
  assert(html.includes("guestEntryButton"), "guest entry choice is missing");
  assert(html.includes("orientationOverlay"), "portrait orientation notice is missing");
  assert(html.includes("group-move-switch"), "group move toggle indicator is missing");
  assert(html.includes("shareSuccessOverlay"), "share success dialog is missing");
  assert(html.includes("우리 반 게시판"), "class community title is missing");

  const app = read("app.js");
  assert(app.includes("tessellationCloud"), "app.js must use the Firebase bridge");
  assert(app.includes("createWebpThumbnailDataUrl"), "WebP thumbnail generation is missing");
  assert(app.includes("initializeEntryScreen"), "entry screen initialization is missing");
  assert(app.includes("expandArchimedeanTemplate"), "expanded Archimedean template generation is missing");
  assert(app.includes("computeExactEdgeSnap"), "exact edge snapping is missing");
  assert(app.includes("updateOrientationNotice"), "orientation notice behavior is missing");
  assert(app.includes("buildSnubSquarePolygons"), "exact snub-square template generation is missing");
  assert(app.includes("getVisibleSpawnPoint"), "visible viewport spawning is missing");
  assert(app.includes("templateEdgeKey"), "template edges must be deduplicated");
  assert(
    app.includes('const palette = ["#ffffff", "#ffd166", "#f76f53", "#06a77d", "#4d96ff"]'),
    "palette colors or order are wrong",
  );
  assert(app.includes('colorInput.type = "color"'), "custom color picker is missing");
  assert(app.includes("묶음 이동 ${groupMoveEnabled ?"), "group move state label is missing");
  assert(app.includes("openClassCommunityAfterShare"), "share success navigation is missing");

  const sw = read("sw.js");
  assert(sw.includes("CACHE_NAME"), "service worker cache is missing");
  assert(sw.includes("/api/"), "service worker must bypass API cache");
  assert(sw.includes("firebase-client.js"), "service worker must cache Firebase bridge");
  assert(sw.includes("cloud-config.js"), "service worker must bypass Firebase config cache");

  const firebaseClient = read("firebase-client.js");
  assert(firebaseClient.includes("firebase-auth.js"), "Firebase Auth SDK import is missing");
  assert(firebaseClient.includes("firebase-firestore.js"), "Firestore SDK import is missing");
  assert(firebaseClient.includes("classes"), "Firebase client must use class-scoped collections");

  const firestoreRules = read("firestore.rules");
  assert(firestoreRules.includes("match /classes/{classId}"), "Firestore class rules are missing");
  assert(firestoreRules.includes("match /works/{workId}"), "Firestore class work rules are missing");
  assert(firestoreRules.includes("thumbnailWebp.size() < 250000"), "Firestore thumbnail size limit is missing");
  assert(firestoreRules.includes('request.resource.data.role == "student"'), "Firestore student role must be immutable");

  const auth = require(path.join(root, "api/auth"));
  const posts = require(path.join(root, "api/posts"));
  const storage = require(path.join(root, "api/_storage"));
  const login = await callApi(auth, "POST", { name: "검증", password: "1234" });
  assert(login.status === 200 && login.body.user.name === "검증", "auth API failed");
  assert(login.body.user.token, "auth API must return a session token");
  const user = await storage.getUser("검증");
  assert(user.algorithm === "pbkdf2-sha256" && user.salt, "auth API must store pbkdf2 password records");

  const badLogin = await callApi(auth, "POST", { name: "검증", password: "9999" });
  assert(badLogin.status === 401, "auth API must reject bad password");

  const post = await callApi(posts, "POST", {
    id: "verify-post",
    tiles: [
      {
        color: "#fff",
        id: 1,
        position: { x: 410, y: 310 },
        rotation: 0,
        shape: "triangle",
      },
    ],
  }, {}, { authorization: `Bearer ${login.body.user.token}` });
  assert(post.status === 200, "post API failed");
  assert(post.body.post.author === "검증", "post API must use session author");

  const list = await callApi(posts, "GET");
  assert(list.body.posts.some((item) => item.id === "verify-post"), "post list failed");

  const unauthorized = await callApi(posts, "POST", {
    id: "blocked-post",
    author: "검증",
    tiles: [{ id: 2, shape: "square", color: "#fff", rotation: 0, position: { x: 410, y: 310 } }],
  });
  assert(unauthorized.status === 401, "post API must require session token");

  await storage.saveSession("expired-token", {
    name: "검증",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  const expired = await callApi(posts, "POST", {
    id: "expired-post",
    tiles: [{ id: 3, shape: "square", color: "#fff", rotation: 0, position: { x: 410, y: 310 } }],
  }, {}, { authorization: "Bearer expired-token" });
  assert(expired.status === 401, "post API must reject expired sessions");

  const deleted = await callApi(posts, "DELETE", null, { id: "verify-post" }, { authorization: `Bearer ${login.body.user.token}` });
  assert(deleted.status === 200, "post delete failed");

  console.log("verify-app ok");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
