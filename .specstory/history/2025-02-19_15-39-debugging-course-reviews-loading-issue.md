## SpecStory

## Debugging Course Reviews Loading Issue (19/02/2025, 15:39:21)

_**User**_

It seem this line of code is causing the "Your Reviews" section not to load, can you see what is wrong? @Codebase 

---

_**Assistant**_

I can see the issue. The problem is in the dependency array of the `useEffect` hook. You're including `loadUserReviews` in the dependency array, but since `loadUserReviews` is defined inside the component, it will create a new function reference on every render, causing an infinite loop.

Here's how to fix it:

1. Either wrap `loadUserReviews` with `useCallback` hook, or
2. Remove `loadUserReviews` from the dependency array since it only depends on `user` which is already in the dependencies

The simplest fix is to remove `loadUserReviews` from the dependency array:

```typescript:src/app/profile/page.tsx
useEffect(() => {
  if (!user) {
    router.push('/login')
    return
  }

  loadUserReviews()
}, [user, router]) // Remove loadUserReviews from dependencies
```

Alternatively, if you prefer to keep the function memoized (which can be beneficial for larger applications), you can use `useCallback`:

```typescript:src/app/profile/page.tsx
const loadUserReviews = useCallback(async () => {
  if (!user) return

  try {
    setLoading(true)
    const q = query(collection(db, 'reviews'), where('userId', '==', user.uid))
    const querySnapshot = await getDocs(q)
    
    const userReviews: CourseReview[] = []
    querySnapshot.forEach((doc) => {
      userReviews.push({ id: doc.id, ...doc.data() } as CourseReview)
    })

    setReviews(userReviews)
  } catch (error) {
    console.error('Error loading user reviews:', error)
  } finally {
    setLoading(false)
  }
}, [user]) // Only depend on user

useEffect(() => {
  if (!user) {
    router.push('/login')
    return
  }

  loadUserReviews()
}, [user, router, loadUserReviews])
```

Either solution will fix the infinite loop issue. The first solution is simpler, while the second solution with `useCallback` is more proper for performance in larger applications where the function might be passed as a prop to child components.

---

_**User**_

Great thanks

---

_**Assistant**_

You're welcome! The reviews section should now load correctly without causing any infinite loops. Let me know if you need help with anything else!

---



---

