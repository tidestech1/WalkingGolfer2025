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

## Development Testing Guidelines

### Testing Email Verification Flow

**Issue**: Firebase Auth email verification links point to production domain, not localhost during development.

**Solutions**:

#### Option 1: Manual Navigation (Recommended for Development)
1. Sign up on `localhost:3000`
2. Check email and click verification link (goes to production)
3. After email is verified, manually navigate to `localhost:3000/complete-profile`
4. Profile will complete using data stored in localStorage

#### Option 2: Use Firebase Auth Emulator (Advanced)
```bash
# Install Firebase tools if not already installed
npm install -g firebase-tools

# Start the emulator with auth
firebase emulators:start --only auth

# Update your development environment to use emulator
# Add to your .env.local:
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
```

#### Option 3: Testing Specific User States
For testing different user states without going through the full signup flow:

1. **Test incomplete profiles**: Clear localStorage, then navigate to `/complete-profile`
2. **Test profile completion**: Use browser dev tools to set localStorage data:
   ```javascript
   localStorage.setItem('pendingProfileData', JSON.stringify({
     firstName: 'Test',
     lastName: 'User',
     zipcode: '10001',
     // ... other test data
   }));
   ```

#### Development Helper Features
- Development-only notifications show in signup success message
- Complete profile page shows localStorage data in development mode
- Manual profile completion fallback at `/complete-profile-manual`

### Firebase Configuration Notes
- Email verification links use production `authDomain` from Firebase Console
- Custom action handlers redirect to `/auth/action` for processing
- Profile completion data is stored in localStorage during signup
- Profile completion happens after email verification is confirmed

### Progressive Profile System

**Philosophy**: Minimize signup friction, then progressively collect data when users see value.

#### Signup Flow (Minimal Friction)
- **Required**: First Name, Last Name, Email, Password, ZIP Code
- **Optional**: None (maximum simplicity)
- **Storage**: Basic data stored in localStorage for post-verification completion

#### Progressive Data Collection Strategy
1. **Welcome Dialog**: Appears on first profile visit, encourages golf preferences
2. **Contextual Prompts**: Smart prompts in Overview tab based on missing data:
   - Golf experience → Better course recommendations
   - Walking method → Personalized course features
   - Travel preferences → Discover new destinations
   - Profile photo → Connect with other golfers (post-signup only)
3. **Visual Progress**: Progress bar and completion percentage
4. **Benefit-Focused**: Each prompt explains the value of providing information

#### Implementation Details
- Profile completion tracked with weighted scoring
- Contextual prompts only show for missing high-value fields
- Welcome dialog redirects to relevant profile tabs
- Success state celebrates 100% completion
- Data collection happens when users are engaged, not during signup

#### Benefits
- Higher signup conversion (shorter form)
- Better data quality (contextual collection)
- Improved user engagement (progressive value)
- Reduced abandonment (phased approach)
