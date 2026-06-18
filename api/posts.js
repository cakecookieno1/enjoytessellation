const { addPost, getSession, listPosts, removePost } = require("./_storage");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

async function requireSession(req, res) {
  const session = await getSession(getBearerToken(req));
  if (!session?.name) {
    sendJson(res, 401, { error: "먼저 입장해 주세요." });
    return null;
  }
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    sendJson(res, 401, { error: "다시 입장해 주세요." });
    return null;
  }
  return session;
}

function sanitizePost(body, author) {
  const tiles = Array.isArray(body.tiles) ? body.tiles.slice(0, 400) : [];
  if (!author || !tiles.length) return null;

  return {
    id: String(body.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    author,
    createdAt: body.createdAt || new Date().toISOString(),
    mode: body.mode || "free",
    templateId: body.templateId || "t31212",
    objectId: body.objectId || "clock",
    objectScale: Number(body.objectScale) || 1.15,
    tileCount: tiles.length,
    tiles,
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      sendJson(res, 200, { posts: await listPosts() });
      return;
    }

    if (req.method === "POST") {
      const session = await requireSession(req, res);
      if (!session) return;

      const post = sanitizePost(await readJson(req), session.name);
      if (!post) {
        sendJson(res, 400, { error: "공유할 보드가 없습니다." });
        return;
      }
      await addPost(post);
      sendJson(res, 200, { post, posts: await listPosts() });
      return;
    }

    if (req.method === "DELETE") {
      const session = await requireSession(req, res);
      if (!session) return;

      const { id } = req.query || {};
      const before = (await listPosts()).length;
      const posts = await removePost(id, session.name);
      sendJson(res, before === posts.length ? 404 : 200, { posts });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch {
    sendJson(res, 500, { error: "게시판 처리에 실패했습니다." });
  }
};
