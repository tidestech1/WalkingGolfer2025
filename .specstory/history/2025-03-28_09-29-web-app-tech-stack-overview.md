## SpecStory

## Web App Tech Stack Overview (28/03/2025, 09:29:15)

_**User**_

What tools or tech stack are we using for this web app please?

---

_**Assistant**_

Based on the code and custom instructions provided, I can outline the main tech stack and tools being used for this web application:

1. **Core Framework & Runtime**
- Next.js 14 with App Router
- TypeScript for type safety
- React for UI components

2. **Styling & UI**
- Tailwind CSS for styling
- Lucide React for icons

3. **Maps & Location**
- Google Maps JavaScript API
- @react-google-maps/api for React integration
- @googlemaps/markerclusterer for map marker clustering

4. **Backend & Database**
- Firebase
  - Firestore for database
  - Firebase Authentication
  - Firebase configuration utilities

5. **AI Integration**
- Vercel AI SDK for AI interactions and streaming responses

6. **Development Environment**
- Cursor IDE
- Replit for deployment and environment management
- SSH connection for development

7. **External APIs**
- Replicate API for image generation
- Google Maps API for mapping functionality

8. **Project Structure**
```
src/
├── app/
│   ├── api/         # API routes
│   ├── components/  # React components
│   └── lib/         # Utilities, hooks, contexts
├── types/          # TypeScript type definitions
└── styles/         # CSS and styling files
```

9. **Key Features**
- Type-safe development with strict TypeScript rules
- USA-focused golf course application
- Geographic validation for US locations
- Real-time map updates with marker clustering
- Search and filtering capabilities
- User authentication and profiles
- Course reviews and ratings system

10. **Environment Management**
- Replit Secrets for managing API keys and environment variables
- No local .env files in the codebase

This appears to be a modern, full-stack application focused on providing a "TripAdvisor for Walking Golfers" experience, with strong emphasis on type safety, geographic accuracy, and real-time updates.

---



---

