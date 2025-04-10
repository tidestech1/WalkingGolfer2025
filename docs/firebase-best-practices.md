# Firebase Best Practices

> ⚠️ This document is the authoritative source for working with Firebase in this project.  
> It combines schema rules, access methods, and defensive coding strategies.  
> Follow it strictly to avoid runtime errors and schema mismatches.

---

## ✅ Firebase Access Rules

- Always access Firebase via:
  - `useFirebase()` hook
  - Utility functions in `firebaseUtils.ts`
- Never access Firebase directly (`db`, `auth`, etc.) in components
- All Firebase reads/writes must be wrapped in `try/catch`
- Provide human useful fall back messages when Firebase is unavailable
- Only use Firestore collections:
  - `courses`
  - `reviews`
  - `users`

---

## 💥 Common Firebase Errors (to Avoid)

- "Cannot read properties of null"
- "Expected first argument to collection() to be a CollectionReference..."
- "No Firebase App '[DEFAULT]' has been created"
- "Missing or insufficient permissions"
- "Firestore database not available"

---

## 🔐 Safe Access Patterns

### Avoid this:
```ts
// ❌ Direct access — unsafe
const coursesRef = collection(db, 'courses');
