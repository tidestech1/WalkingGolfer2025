# Klaviyo Integration Guide

## Overview

This document outlines the correct way to integrate with Klaviyo API for WalkingGolfer.com. This guide was created after extensive troubleshooting and should be followed for all future Klaviyo integration work.

## Key Architecture Decisions

### API Version & Implementation
- **Use API version**: `2023-12-15` (not 2024-07-15)
- **Use Private API Key integration** (not public/client-side)
- **Single implementation**: Use `src/lib/klaviyo.ts` (not the server-side functions version)

### Critical Success Factors

1. **Consistent API Structure**: Always use the modern JSON:API format with proper `data` wrappers
2. **Field Separation**: Standard fields go in `attributes`, custom properties in `attributes.properties`
3. **Error Handling**: Always wrap Klaviyo calls in try/catch blocks and don't fail the main operation

## Working Implementation Structure

### Profile Creation/Update Payload
```json
{
  "data": {
    "type": "profile",
    "attributes": {
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe", 
      "phone_number": "+1234567890",
      "properties": {
        "Golf Experience": "intermediate",
        "Golf Handicap": 15.2,
        "Zip Code": "90210",
        "Walking Golfer Member": true,
        "signup_source": "walkinggolfer.com"
      }
    }
  }
}
```

### Event Tracking Payload
```json
{
  "data": {
    "type": "event",
    "attributes": {
      "profile": {
        "data": {
          "type": "profile",
          "attributes": {
            "email": "user@example.com"
          }
        }
      },
      "metric": {
        "data": {
          "type": "metric",
          "attributes": {
            "name": "Profile Updated"
          }
        }
      },
      "properties": {
        "golf_experience": "intermediate",
        "updated_fields": ["golf_handicap"]
      }
    }
  }
}
```

## Implementation Guidelines

### 1. Profile Management
```typescript
// ✅ CORRECT: Use this pattern
const klaviyoProfile = createKlaviyoProfile(email, displayName, userProfile);
const profileId = await klaviyoClient.createOrUpdateProfileAttributes(klaviyoProfile);
```

### 2. Event Tracking
```typescript
// ✅ CORRECT: Use this pattern
await klaviyoClient.trackEvent(
  KlaviyoEvents.PROFILE_UPDATED,
  email,
  {
    golf_experience: userProfile.golfingExperience,
    updated_fields: ['golf_handicap']
  }
);

// ❌ WRONG: Don't use createKlaviyoEvent (removed)
const event = createKlaviyoEvent(...);
await klaviyoClient.trackEvent(event);
```

### 3. Custom Properties
- Use human-readable names: `"Golf Experience"`, `"Golf Handicap"`
- Only include properties that have values
- Store standard fields (`first_name`, `last_name`) in attributes, not properties
- Store zip codes as custom property `"Zip Code"` (not standard field)

### 4. Error Handling
```typescript
try {
  await klaviyoClient.createOrUpdateProfileAttributes(profile);
  console.log('Successfully synced to Klaviyo');
} catch (error) {
  console.warn('Klaviyo sync failed (non-blocking):', error);
  // Don't fail the main operation
}
```

## File Structure

### Primary Implementation
- **Main client**: `src/lib/klaviyo.ts` - Use this for all integrations
- **Profile sync**: `src/lib/firebase/userUtils.ts` - `syncUserProfileToKlaviyo` function

### Integration Points
- **User registration**: `src/lib/firebase/authUtils.ts`
- **Newsletter signup**: `src/app/newsletter/actions.ts`
- **Contact form**: `src/app/contact/actions.ts`
- **Review submission**: `src/app/api/reviews/submit/route.ts`
- **Profile updates**: `src/app/api/profile/update/route.ts`

## Environment Variables
- `KLAVIYO_PRIVATE_KEY`: Your Klaviyo private API key (stored in Replit Secrets)

## Common Pitfalls to Avoid

1. **❌ Don't mix API versions** - Stick to 2023-12-15
2. **❌ Don't put custom properties in attributes root** - Use attributes.properties
3. **❌ Don't use server-side functions implementation** - Use src/lib/klaviyo.ts
4. **❌ Don't fail operations on Klaviyo errors** - Always catch and log
5. **❌ Don't send undefined/null custom properties** - Filter them out

## Testing Strategy

1. **Test on newsletter signup first** - This is your known working baseline
2. **Check Klaviyo Developer Tools** - Use their API logs to see exact payloads
3. **Verify both CREATE (409 duplicate) and PATCH scenarios**
4. **Test event tracking separately from profile sync**

## Reference Documentation

- [Klaviyo Profiles API Overview](https://developers.klaviyo.com/en/reference/profiles_api_overview)
- [Klaviyo API Overview](https://developers.klaviyo.com/en/reference/api_overview)
- Working newsletter signup in production as reference implementation

## Troubleshooting Checklist

When Klaviyo integration fails:

1. ✅ Check API version is `2023-12-15`
2. ✅ Verify payload structure matches working examples above
3. ✅ Confirm custom properties are in `attributes.properties`
4. ✅ Check standard fields are in `attributes` root
5. ✅ Verify all imports are from `src/lib/klaviyo.ts`
6. ✅ Test with newsletter signup to confirm baseline works
7. ✅ Check Klaviyo Developer Tools for detailed error messages

## Success Criteria

A successful Klaviyo integration should show:
- "Klaviyo profile updated successfully" (for updates)
- "Successfully synced user profile to Klaviyo"
- "Tracking Klaviyo event: [Event Name]" (no errors)
- Profile data visible in Klaviyo dashboard with correct custom properties 