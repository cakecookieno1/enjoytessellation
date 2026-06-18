const memoryStore = globalThis.__tessellationMemoryStore || {
  users: {},
  posts: [],
  sessions: {},
};

globalThis.__tessellationMemoryStore = memoryStore;

const USERS_KEY = "tessellation:users";
const POSTS_KEY = "tessellation:posts";
const SESSIONS_KEY = "tessellation:sessions";

function hasKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvCommand(command) {
  const response = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`KV command failed: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

async function getJson(key, fallback) {
  if (!hasKvConfig()) return fallback;
  const value = await kvCommand(["GET", key]);
  return value ? JSON.parse(value) : fallback;
}

async function setJson(key, value) {
  if (!hasKvConfig()) return;
  await kvCommand(["SET", key, JSON.stringify(value)]);
}

async function getUser(name) {
  if (!hasKvConfig()) return memoryStore.users[name] || null;
  const users = await getJson(USERS_KEY, {});
  return users[name] || null;
}

async function saveUser(user) {
  if (!hasKvConfig()) {
    memoryStore.users[user.name] = user;
    return user;
  }

  const users = await getJson(USERS_KEY, {});
  users[user.name] = user;
  await setJson(USERS_KEY, users);
  return user;
}

async function getSession(token) {
  if (!token) return null;
  if (!hasKvConfig()) return memoryStore.sessions[token] || null;
  const sessions = await getJson(SESSIONS_KEY, {});
  return sessions[token] || null;
}

async function saveSession(token, session) {
  if (!hasKvConfig()) {
    memoryStore.sessions[token] = session;
    return session;
  }

  const sessions = await getJson(SESSIONS_KEY, {});
  sessions[token] = session;
  await setJson(SESSIONS_KEY, sessions);
  return session;
}

async function listPosts() {
  if (!hasKvConfig()) return memoryStore.posts;
  return getJson(POSTS_KEY, []);
}

async function addPost(post) {
  if (!hasKvConfig()) {
    memoryStore.posts.unshift(post);
    memoryStore.posts = memoryStore.posts.slice(0, 24);
    return post;
  }

  const posts = await listPosts();
  posts.unshift(post);
  await setJson(POSTS_KEY, posts.slice(0, 24));
  return post;
}

async function removePost(id, author) {
  const posts = await listPosts();
  const filtered = posts.filter((post) => !(post.id === id && post.author === author));

  if (!hasKvConfig()) {
    memoryStore.posts = filtered;
    return filtered;
  }

  await setJson(POSTS_KEY, filtered);
  return filtered;
}

module.exports = {
  addPost,
  getSession,
  getUser,
  hasKvConfig,
  listPosts,
  removePost,
  saveSession,
  saveUser,
};
