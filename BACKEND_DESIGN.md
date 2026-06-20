# Backend Design

This document defines the target backend shape for the tessellation app's second phase:
PWA support, simple student login, class-scoped sharing, and a lightweight community board.

## Chosen Direction

Firebase is the chosen backend for the next dynamic version.

Current implementation files:

- `firebase-client.js`: browser-side Firebase Auth and Firestore bridge
- `cloud-config.js`: public Firebase web config
- `firebase-config.example.js`: copy/reference config shape
- `firestore.rules`: first Firestore security rules draft
- `app.js`: uses Firebase first when configured, otherwise falls back to the local/API draft

The project can still open without Firebase values. Once `cloud-config.js` is filled with
the real Firebase web app values, login and sharing will use Firebase automatically.

## Recommendation

Use Firebase for the first real dynamic version.

- Firebase Auth: account sessions
- Cloud Firestore: class membership and shared works
- Firebase Hosting or Vercel: static frontend hosting
- Cloud Storage: optional later; not required for phase 1 if thumbnails are stored as small WebP data URLs

The app is aimed at elementary students, so the visible login UI should stay simple:

- Class code
- Name
- Password

Internally, the app can map those fields to Firebase email/password auth.

Example:

```text
classCode: 3-2-K7Q9
name: minjun
internal email: 3-2-k7q9_minjun@tessellation.local
```

Students should never need to understand or type an email address.

## Firestore Collections

### users/{uid}

Stores user profile data that is safe to show in the app.

```json
{
  "displayName": "minjun",
  "classIds": ["class_3_2_k7q9"],
  "createdAt": "serverTimestamp",
  "lastLoginAt": "serverTimestamp"
}
```

### classes/{classId}

Stores class metadata.

```json
{
  "name": "3-2",
  "joinCode": "3-2-K7Q9",
  "joinCodeLower": "3-2-k7q9",
  "ownerUid": null,
  "createdAt": "serverTimestamp",
  "archived": false
}
```

Notes:

- `joinCode` is what students type.
- `joinCodeLower` is used for lookup and duplicate checks.
- `ownerUid` can stay `null` until a teacher/admin account exists.

### classes/{classId}/members/{uid}

Stores class membership and role.

```json
{
  "displayName": "minjun",
  "role": "student",
  "joinedAt": "serverTimestamp"
}
```

Allowed roles:

- `student`
- `teacher`

Phase 1 only needs `student`. `teacher` can be added when an admin screen exists.

### classes/{classId}/works/{workId}

Stores shared works for one class.

```json
{
  "title": "My tessellation",
  "ownerUid": "firebase-auth-uid",
  "ownerName": "minjun",
  "mode": "free",
  "templateId": null,
  "objectId": null,
  "objectScale": 1.4,
  "tileCount": 42,
  "designData": {
    "version": 1,
    "canvas": {
      "zoom": 1,
      "panX": 0,
      "panY": 0
    },
    "tiles": []
  },
  "thumbnailWebp": "data:image/webp;base64,...",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

Important storage rule:

- `designData` is the real editable source of the work.
- `thumbnailWebp` is only for the board preview.
- User download still stays PNG because PNG is the safest classroom-friendly export.

## Work Data Shape

The editable source should be JSON, not a full image.

```json
{
  "version": 1,
  "mode": "decorate",
  "templateId": null,
  "objectId": "clock",
  "objectScale": 1.7,
  "tiles": [
    {
      "id": "tile_001",
      "shape": "hexagon",
      "color": "#2f7dd1",
      "x": 120,
      "y": 80,
      "rotation": 30
    }
  ]
}
```

This keeps Firestore usage small and makes it possible to reopen/edit a shared work later.

## Thumbnail Strategy

For shared works, generate a small WebP preview in the browser.

Recommended first version:

- max width: 480px
- max height: 320px
- format: `image/webp`
- quality: `0.72`

Keep PNG for the existing Save button.

Reason:

- WebP is smaller for board previews.
- PNG remains predictable for user downloads and printing.
- JSON remains the source of truth.

## Security Rules Draft

The key rule is: students can only see works from classes they belong to.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isMember(classId) {
      return signedIn()
        && exists(/databases/$(database)/documents/classes/$(classId)/members/$(request.auth.uid));
    }

    function memberRole(classId) {
      return get(/databases/$(database)/documents/classes/$(classId)/members/$(request.auth.uid)).data.role;
    }

    function isTeacher(classId) {
      return isMember(classId) && memberRole(classId) == "teacher";
    }

    match /users/{uid} {
      allow read, create, update: if signedIn() && request.auth.uid == uid;
    }

    match /classes/{classId} {
      allow read: if isMember(classId);
      allow create: if signedIn();
      allow update, delete: if isTeacher(classId);

      match /members/{uid} {
        allow read: if isMember(classId);
        allow create: if signedIn() && request.auth.uid == uid;
        allow update: if signedIn() && request.auth.uid == uid;
        allow delete: if signedIn() && (request.auth.uid == uid || isTeacher(classId));
      }

      match /works/{workId} {
        allow read: if isMember(classId);

        allow create: if isMember(classId)
          && request.resource.data.ownerUid == request.auth.uid
          && request.resource.data.tileCount is int
          && request.resource.data.tileCount <= 500;

        allow update: if isMember(classId)
          && resource.data.ownerUid == request.auth.uid
          && request.resource.data.ownerUid == request.auth.uid;

        allow delete: if isMember(classId)
          && (resource.data.ownerUid == request.auth.uid || isTeacher(classId));
      }
    }
  }
}
```

Before production, tighten the rules with field allowlists and size limits.

## Phase 1 Feature Scope

Build only the minimum class-sharing flow first.

- Student creates/logs into an account with class code, name, password
- Student joins one class
- Student shares current board to that class
- Student sees shared works from the same class
- Student can reopen a shared work
- Student can delete only their own shared works
- Board previews use WebP thumbnails
- Download button still exports PNG

Do not build these in phase 1:

- comments
- likes
- public global gallery
- teacher dashboard
- moderation tools
- multiple classes per student

Those can be phase 2 after class sharing works reliably.

## Migration From Current Vercel API Draft

The current local draft has `/api/auth` and `/api/posts` serverless routes. If Firebase is chosen:

1. Keep the PWA files: `manifest.webmanifest`, `sw.js`, and icons.
2. Replace API calls in `app.js` with Firebase SDK calls.
3. Remove or ignore `api/auth.js`, `api/posts.js`, and `api/_storage.js`.
4. Replace the community post model with class-scoped works.
5. Update verification to check Firebase config presence and WebP thumbnail generation.

## Environment Variables

For Firebase web SDK, the public Firebase config can be shipped to the browser.
Security comes from Firebase Auth and Firestore rules, not from hiding the web config.

Recommended config names if the project later uses a build step:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

If the app remains no-build static HTML, store config in a small `cloud-config.js` file
that is generated locally and not committed until the project is ready.
