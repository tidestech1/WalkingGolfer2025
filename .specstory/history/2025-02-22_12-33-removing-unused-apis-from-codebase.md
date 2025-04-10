## SpecStory

## Removing Unused APIs from Codebase (22/02/2025, 12:33:04)

_**User**_

This site was created based on a template and we do not need some of the functions, specifically in the /home/runner/workspace/src/app/api folder we do not need Anthropic, deepgram, openai or replicate. We can remove these and references to them that are preventing the deploy in replit due to missing keys.

Does that sound sensible, and will not break anything? Could you check and ammend as necessary 

---

_**Assistant**_

Based on the provided codebase context, I can help analyze the dependencies and safely remove unnecessary API routes. Let's check the connections:

1. Looking at the main layout and components, there are no direct references to these APIs in the core application code.

2. The `.cursorrules` file shows these were pre-configured APIs but optional:

```9:21:.cursorrules
There are some pre-configured APIs in this template that can be used but only if required by the current project. These have already been created:
- Firebase
  - In src/lib/firebase there is a firebase.ts configuration file as well as firebaseUtils.ts for various utility functions when interacting with Firebase Database, Storage, and Authencation
  - In src/lib/contexts there is an AuthContext.tsx file that has user authentication with Firebase set up with the onAuthStateChanged listener.
  - In src/lib/hooks there is a useAuth.ts hook
- OpenAI 
  - src/app/api/openai has chat/route.ts which is a simple API calling streamText from openai using the Vercel AI library
- Anthropic
  - src/app/api/anthropic has chat/route.ts which is a simple API calling streamText from Anthropic using the Vercel AI library
- Replicate
  - src/app/api/replicate has generate-image/route.ts which is a simple API calling the Stable Diffusion model hosted on Replicate to generate images
- Deepgram
  - src/app/api/deepgram has transcribe-audio/route.ts which is a simple API that returns the Deepgram API key to be used in the client side to transcribe audio in real-time.
```


3. The only potential connection would be through the AuthContext and Firebase configuration, but these are separate and independent from the AI APIs.

You can safely remove:
- `/src/app/api/anthropic/`
- `/src/app/api/deepgram/`
- `/src/app/api/openai/`
- `/src/app/api/replicate/`

You should also:

1. Remove the unused dependencies from `package.json`:
```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^0.0.48",
    "@ai-sdk/openai": "^0.0.54",
    "@deepgram/sdk": "^3.6.0",
    "ai": "^3.3.20",
    "replicate": "^0.32.0"
  }
}
```

2. Update the `next.config.mjs` to remove unnecessary image patterns:
```typescript:next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
};
```

This will not break anything as:
1. The core application uses Firebase for authentication and data storage
2. The removed APIs were optional additions to the template
3. The main functionality (courses, profiles, authentication) doesn't depend on these APIs
4. The image configuration still maintains support for Firebase Storage and placeholder images

Would you like me to provide any additional details or specific code changes?

---



---

