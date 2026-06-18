const crypto = require("crypto");
const { getUser, saveSession, saveUser } = require("./_storage");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function normalizeUserName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, 12);
}

function hashPassword(name, password) {
  return crypto
    .createHash("sha256")
    .update(`${name}:${password}`)
    .digest("hex");
}

function createPasswordRecord(password, existingSalt = crypto.randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const passwordHash = crypto
    .pbkdf2Sync(password, existingSalt, iterations, 32, "sha256")
    .toString("hex");

  return {
    algorithm: "pbkdf2-sha256",
    iterations,
    passwordHash,
    salt: existingSalt,
  };
}

function passwordMatches(user, name, password) {
  if (!user) return false;
  if (user.algorithm === "pbkdf2-sha256" && user.salt && user.iterations) {
    const candidate = createPasswordRecord(password, user.salt);
    return crypto.timingSafeEqual(
      Buffer.from(candidate.passwordHash, "hex"),
      Buffer.from(user.passwordHash, "hex"),
    );
  }

  return user.passwordHash === hashPassword(name, password);
}

function needsPasswordUpgrade(user) {
  return user?.algorithm !== "pbkdf2-sha256";
}

function createSessionToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function readJson(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJson(req);
    const name = normalizeUserName(body.name);
    const password = String(body.password || "").trim();

    if (!name || !password) {
      sendJson(res, 400, { error: "이름과 비밀번호를 입력해 주세요." });
      return;
    }

    const existing = await getUser(name);

    if (existing && !passwordMatches(existing, name, password)) {
      sendJson(res, 401, { error: "비밀번호가 맞지 않아요." });
      return;
    }

    if (!existing) {
      await saveUser({
        name,
        ...createPasswordRecord(password),
        createdAt: new Date().toISOString(),
      });
    } else if (needsPasswordUpgrade(existing)) {
      await saveUser({
        ...existing,
        ...createPasswordRecord(password),
        upgradedAt: new Date().toISOString(),
      });
    }

    const token = createSessionToken();
    await saveSession(token, {
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      name,
      createdAt: new Date().toISOString(),
    });

    sendJson(res, 200, { user: { name, token } });
  } catch {
    sendJson(res, 500, { error: "입장 처리에 실패했습니다." });
  }
};
