const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAEy2WfY7y5GRcs74RKffWfNt50QwotRdI";
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "enjoytessellation";
const CLASS_ID = "class_class-1";
const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function jsonRequest(url, options = {}, expected = [200]) {
  const response = await fetch(url, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!expected.includes(response.status)) {
    throw new Error(`${options.method || "GET"} ${url} failed (${response.status}): ${text}`);
  }
  return { body, status: response.status };
}

function authHeaders(idToken) {
  return {
    Authorization: `Bearer ${idToken}`,
    "Content-Type": "application/json",
  };
}

async function patchDocument(path, fields, idToken, expected = [200]) {
  return jsonRequest(`${FIRESTORE_BASE}/${path}`, {
    method: "PATCH",
    headers: authHeaders(idToken),
    body: JSON.stringify({ fields }),
  }, expected);
}

async function deleteDocument(path, idToken) {
  return jsonRequest(`${FIRESTORE_BASE}/${path}`, {
    method: "DELETE",
    headers: authHeaders(idToken),
  }, [200, 404]);
}

async function main() {
  const stamp = Date.now();
  const email = `codex-live-${stamp}@tessellation.local`;
  const password = `Codex-${stamp}-test`;
  const now = new Date().toISOString();
  let idToken = "";
  let uid = "";
  let workPath = "";

  try {
    const signUp = await jsonRequest(`${AUTH_BASE}:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    idToken = signUp.body.idToken;
    uid = signUp.body.localId;

    await patchDocument(`classes/${CLASS_ID}/members/${uid}`, {
      displayName: { stringValue: "CodexTest" },
      joinedAt: { timestampValue: now },
      role: { stringValue: "student" },
    }, idToken);

    const classRead = await jsonRequest(`${FIRESTORE_BASE}/classes/${CLASS_ID}`, {
      headers: authHeaders(idToken),
    }, [200, 404]);
    if (classRead.status === 404) {
      await patchDocument(`classes/${CLASS_ID}`, {
        name: { stringValue: "class-1" },
        joinCode: { stringValue: "class-1" },
        joinCodeLower: { stringValue: "class-1" },
        ownerUid: { nullValue: null },
        createdAt: { timestampValue: now },
        archived: { booleanValue: false },
      }, idToken);
    }

    await patchDocument(`users/${uid}`, {
      displayName: { stringValue: "CodexTest" },
      classIds: { arrayValue: { values: [{ stringValue: CLASS_ID }] } },
      lastLoginAt: { timestampValue: now },
    }, idToken);

    const created = await jsonRequest(`${FIRESTORE_BASE}/classes/${CLASS_ID}/works`, {
      method: "POST",
      headers: authHeaders(idToken),
      body: JSON.stringify({
        fields: {
          classCode: { stringValue: "class-1" },
          title: { stringValue: "CodexTest tessellation" },
          ownerUid: { stringValue: uid },
          ownerName: { stringValue: "CodexTest" },
          mode: { stringValue: "free" },
          templateId: { nullValue: null },
          objectId: { nullValue: null },
          objectScale: { doubleValue: 1.15 },
          tileCount: { integerValue: "1" },
          designData: {
            mapValue: {
              fields: {
                version: { integerValue: "1" },
                mode: { stringValue: "free" },
                templateId: { nullValue: null },
                objectId: { nullValue: null },
                objectScale: { doubleValue: 1.15 },
                tiles: {
                  arrayValue: {
                    values: [{
                      mapValue: {
                        fields: {
                          id: { integerValue: "1" },
                          shape: { stringValue: "square" },
                          color: { stringValue: "#ffffff" },
                          rotation: { integerValue: "0" },
                          position: {
                            mapValue: {
                              fields: {
                                x: { integerValue: "410" },
                                y: { integerValue: "310" },
                              },
                            },
                          },
                        },
                      },
                    }],
                  },
                },
              },
            },
          },
          thumbnailWebp: { stringValue: "" },
          createdAt: { timestampValue: now },
          updatedAt: { timestampValue: now },
        },
      }),
    });
    workPath = created.body.name.split("/documents/")[1];

    const listed = await jsonRequest(`${FIRESTORE_BASE}/classes/${CLASS_ID}/works`, {
      headers: authHeaders(idToken),
    });
    if (!listed.body.documents?.some((document) => document.name === created.body.name)) {
      throw new Error("Created work was not returned by the class work list.");
    }

    await patchDocument(`classes/${CLASS_ID}/members/${uid}`, {
      displayName: { stringValue: "CodexTest" },
      joinedAt: { timestampValue: now },
      role: { stringValue: "teacher" },
    }, idToken, [403]);

    console.log("firebase-live-test ok: auth, membership, work CRUD, and role protection");
  } finally {
    if (idToken && workPath) await deleteDocument(workPath, idToken).catch(() => {});
    if (idToken && uid) await deleteDocument(`classes/${CLASS_ID}/members/${uid}`, idToken).catch(() => {});
    if (idToken && uid) await deleteDocument(`users/${uid}`, idToken).catch(() => {});
    if (idToken) {
      await jsonRequest(`${AUTH_BASE}:delete?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }).catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
