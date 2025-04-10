# Development Guidelines

> 📚 This document works with:
> - [.cursorrules](../.cursorrules)
> - [Firebase Best Practices](./firebase-best-practices.md)
> - [Brand Guidelines](../src/docs/brandguide.md)

## Dev Resource Index
| Topic              | File                            |
|-------------------|----------------------------------|
| Firebase Setup     | docs/firebase-best-practices.md |
| Schema Definitions | src/types/*.ts                  |
| Firebase Utils     | src/lib/firebaseUtils.ts        |
| Styling & Tokens   | src/docs/brandguide.md          |

---

## Development Environment
- Code editing is via Cursor (SSH-connected to Replit)
- Use Replit Secrets for all API keys
- Replit handles automatic deployment
- Never commit `.env` files

## TypeScript Best Practices

### Type Definitions
- Define types before implementing logic
- Always use or extend from `src/types/*.ts`
- Avoid `any` type
- Use descriptive type and interface names

### Code Quality
- Keep functions focused and pure
- Use consistent error handling with `try/catch`
- Break down large logic into smaller units
- Comment complex logic where necessary

### Development Process
1. **Planning**: define data flow, type structures
2. **Implementation**: follow patterns, validate types
3. **Testing**: validate output, error handling, fallback logic

### Firebase Coding Rules
- Use `useFirebase` and utilities from `firebaseUtils.ts`
- Always check for Firebase availability
- Wrap operations in `try/catch`
- Provide fallback data for all reads

### Code Review Checklist
- [ ] Types used correctly, no `any`
- [ ] Firebase used safely
- [ ] Schema and collection names verified
- [ ] UI adheres to design tokens
- [ ] Output is type-safe and predictable

### File Organization
| Purpose         | Location                     |
|----------------|-------------------------------|
| Types          | `src/types/*.ts`              |
| Components     | `src/app/components`          |
| Firebase Code  | `src/lib/firebase/*.ts`       |
| API Routes     | `src/app/api/`                |
| Scripts        | `src/scripts/`                |
