## SpecStory

## Mobile Interface Navigation Issues (10/04/2025, 17:18:07)

_**User**_

Looking more at src/app/map on mobile.

We have a different mobile interface than on the main desktop version. You can see we have a bottom nav where we default to the map or the courses list, and are also able to navigate to and apply philtres At the moment this mobile version is not working properly. When I navigate to it or try to use the bottom navigation between the list, courses or philtres, I can briefly see the map and then it pops away. It's as though the method of navigating and showing the different areas of it are not working quite properly. 

How can I work with you to fix this so it works like it used to do? 

We need to be very careful with edits here as not to break teh 
As always we need to check the @codebase before suggesting or making changes to be sure we’re fully aware of how the files link and interact. We also need to ensure changes are compliant with .cursorrules please. 

---

_**Assistant**_



---

_****_

Okay, I understand. It sounds like the state management or conditional rendering logic for the mobile view within `src/app/map` isn't working correctly, causing the selected view (Map, List, or Filters) to display briefly and then disappear.

To fix this, let's first examine the relevant files to understand how the mobile navigation and view switching are currently implemented.

I'll start by listing the contents of the `src/app/map` directory to identify the main components involved.

---

_****_

<details>
            <summary>Listed directory src/app/map • **3** results</summary>
        
| Name |
|-------|
| 📄 `page.tsx` |
| 📁 `components` |
| 📁 `hooks` |

</details>

---

_****_

Okay, we have a main `page.tsx` and `components` and `hooks` directories.

Let's look at `page.tsx` first, as that's likely the entry point for this map view. I'll read the entire file since it's relatively small (285 lines) and likely contains the core logic for handling the different views (Map, List, Filters).

---

_****_

Read file: undefined

---

_****_



---

_****_

Okay, I've reviewed the `src/app/map/page.tsx` file. It appears the core logic for switching between the Map and List views on mobile relies on the `sidebarOpen` state variable and applies Tailwind CSS `transform` classes to slide the views in and out.

The `BottomNav` component updates the `sidebarOpen` state based on user interaction ('map' sets it to `false`, 'list' sets it to `true`). The `FilterBottomSheet` is controlled separately by the `filterSheetOpen` state.

I believe the issue lies in the conditional CSS classes applied to the **Map View** container. The logic seems reversed:

*   When `sidebarOpen` is `true` (List view should be active), the Map view gets `translate-x-0` (making it visible).
*   When `sidebarOpen` is `false` (Map view should be active), the Map view gets `translate-x-full` (sliding it *out* of view).

This likely causes the map to appear briefly when it shouldn't and disappear when it should be visible.

Let's correct the `className` for the Map View container. I'll reverse the `translate-x-0` and `translate-x-full` conditions.

```typescript:src/app/map/page.tsx
// ... existing code ...

export default function MapPage(): JSX.Element {
  // ... existing state declarations ...
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to map view initially
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'map' | 'list'>('map');


  // ... existing functions (loadCourses, handleBoundsChanged, etc.) ...

  useEffect(() => {
    // Initial load logic
    loadCourses(); 
    return () => {
      debouncedLoadCourses.cancel();
    };
  }, [loadCourses, debouncedLoadCourses]);

   // Handle view changes from BottomNav
   const handleViewChange = useCallback((view: 'map' | 'list' | 'filters') => {
    if (view === 'filters') {
      setFilterSheetOpen(true);
      // Keep the underlying map/list view state as is
    } else {
      setActiveMobileView(view);
      setFilterSheetOpen(false); // Close filter sheet when switching main views
    }
  }, []);


  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="fixed inset-x-0 top-10 bottom-0 bg-white">
      {/* Mobile Views */}
      <div className="lg:hidden h-full">
        {/* Map View */}
        <div className={cn(
          'fixed inset-x-0 top-10 bottom-24 transition-transform duration-300 transform',
          // Corrected logic: Show map when activeMobileView is 'map'
          activeMobileView === 'map' ? 'translate-x-0' : 'translate-x-full' 
        )}>
          <MapComponent
            courses={filteredCourses}
            selectedCourseId={selectedCourseId || null}
            onCourseSelect={handleCourseSelect}
            onBoundsChanged={handleBoundsChanged}
            loading={loading}
          />
        </div>

        {/* List View */}
        <div className={cn(
          'fixed inset-x-0 top-10 bottom-24 bg-white transition-transform duration-300 transform',
           // Show list when activeMobileView is 'list'
           activeMobileView === 'list' ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="h-full">
            <Sidebar
              courses={filteredCourses}
              filters={filters}
              onFilterChange={handleFilterChange}
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId || null}
              totalCourses={courses.length}
              listOnly={true}
               // The sidebar doesn't strictly need an onClose for this mobile pattern
               // We control visibility via the parent's activeMobileView state
              onClose={() => {}} // Provide a no-op or remove if not required by Sidebar props
            />
          </div>
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          allCourses={filteredCourses} // Pass filtered courses, or all courses if filters should apply to the full set
        />

        {/* Bottom Navigation */}
        <BottomNav
          // Pass the active view state and the handler
          activeView={filterSheetOpen ? 'filters' : activeMobileView}
          onViewChange={handleViewChange}
          totalCourses={filteredCourses.length}
        />
      </div>

      {/* Desktop Layout */}
      {/* ... existing desktop layout code ... */}
    </div>
  );
}
```

**Explanation of Changes:**

1.  **Map View `className`:** Reversed the `translate-x-0` and `translate-x-full` conditions based on `activeMobileView === 'map'`.
2.  **List View `className`:** Adjusted to use `activeMobileView === 'list'` for consistency. `translate-x-0` shows it, `-translate-x-full` hides it to the left.
3.  **State Management:**
    *   Introduced `activeMobileView` state (`'map'` | `'list'`) to explicitly track the main mobile view. Defaulted to `'map'`.
    *   Removed the direct dependency on `sidebarOpen` for controlling the map/list visibility, as `activeMobileView` is clearer. `sidebarOpen` seems more relevant for the desktop layout's collapsible sidebar.
    *   Created a `handleViewChange` callback to manage switching between `'map'`, `'list'`, and opening the `'filters'` sheet. This centralizes the logic.
    *   Updated `BottomNav` props to use `activeMobileView` (or `'filters'` if the sheet is open) and the new `handleViewChange` handler.
    *   Updated `FilterBottomSheet` props: Ensured `onClose` sets `filterSheetOpen` to `false`. Decided whether `allCourses` should be `filteredCourses` or `courses` depending on desired filter behaviour.
    *   Simplified the `Sidebar` props, removing the `onClose` logic tied to `setSidebarOpen` as visibility is now handled by the parent. Provided a no-op function or check if the prop is optional.

This change should correctly align the visibility of the Map and List views with the selection in the `BottomNav`.

Before applying this, would you like me to also check the `BottomNav` component (`src/app/map/components/BottomNav.tsx`) to ensure it correctly calls `onViewChange` with 'map', 'list', or 'filters' as expected?

---

_**User**_

I think its back to normal although some spacing has increased ref image. could we close up the white space between the price range input boxes and teh filter button etc below? Previously we had it so that no scroll was necessary. Also as you can see from the image the hidden footer slightly overlaps the botton so I think there is a minior alingment issue in that pertuclar view.

Thanks

---

_**Assistant**_



---

_****_

Okay, I understand. It looks like the filter view (`FilterBottomSheet`) has some layout issues on mobile:

1.  **Excess Whitespace:** Too much vertical space between the "Price Range" inputs and the bottom section containing the course count and "Apply Filters" button.
2.  **Overlap:** The main application's bottom navigation bar (with Map/List/Filters) is slightly overlapping the "Apply Filters" button area within the sheet.

Let's address these.

First, I need to examine the `FilterBottomSheet` component to see how the spacing and layout are handled.

---

_****_

Read file: undefined

---

_****_



---

_****_

Read file: undefined

---

_****_



---

_****_

Okay, I see the issues in `FilterBottomSheet.tsx`. Let's adjust the Tailwind classes to fix the spacing and overlap.

1.  **Reduce Whitespace:** We can decrease the bottom padding of the main scrollable content area and the top padding/margin within the fixed bottom button area.
2.  **Fix Overlap:** The fixed bottom button area needs bottom padding to account for the height of the main application's bottom navigation bar, pushing the "Apply Filters" button up. Looking back at `src/app/map/page.tsx`, the content area above the `BottomNav` ends at `bottom-24` (which is `6rem` or `96px`). So, we should add `pb-24` to the bottom sheet's fixed section to ensure it clears the main nav.

Here are the proposed changes for `src/app/map/components/FilterBottomSheet.tsx`:

```typescript:src/app/map/components/FilterBottomSheet.tsx
// ... existing code ...

export function FilterBottomSheet({
  // ... props
}: FilterBottomSheetProps): JSX.Element {
  // ... existing state and functions ...

  return (
    <BottomSheet
      // ... BottomSheet props
    >
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)'}}> {/* Consider if this height needs adjusting for bottom nav too */}
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Reduced pb-4 to pb-2 */}
          <div className="px-4 pt-2 pb-2 space-y-6"> 
            {/* ... Header with filter count and reset ... */}
            {/* ... Filter sections ... */}
             {/* Price Range */}
             <div className="space-y-3">
                {/* ... price range label and clear button ... */}
                {/* ... price range inputs ... */}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom section */}
        {/* Changed py-4 to pt-2 pb-24 to reduce top space and add bottom padding for main nav */}
        <div className="flex-shrink-0 border-t bg-white px-4 pt-2 pb-24"> 
          {/* Reduced mb-3 to mb-2 */}
          <div className="text-sm text-gray-600 text-center mb-2"> 
            {matchingCoursesCount} course{matchingCoursesCount !== 1 ? 's' : ''} match filters
          </div>
          
          <button
            onClick={handleApply}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

```

**Summary of changes:**

1.  In the scrollable content's inner `div` (`<div className="px-4 pt-2 pb-4 space-y-6">`), changed `pb-4` to `pb-2`.
2.  In the fixed bottom section's `div` (`<div className="flex-shrink-0 border-t bg-white px-4 py-4">`), changed `py-4` to `pt-2 pb-24`.
3.  In the "X courses match filters" `div` (`<div className="text-sm text-gray-600 text-center mb-3">`), changed `mb-3` to `mb-2`.

These adjustments should tighten the spacing above the "Apply Filters" button and ensure the button itself isn't obscured by the main bottom navigation bar.

---

_**User**_

At the moment the mobile version of the map uses a mini header ref image. The rate button is our branding lighter blue colour. However, I think it would look better if we just create a smaller version of the button styling that we have on the main mobile header. (ref the other image) 

Can you help with that?

---

_**Assistant**_



---

_****_

Okay, I can help with that. You want to update the mobile "Rate" button within the map view's header to match the style of the main site header's "RATE" button (white background, dark text, star icons).

First, I need to locate the component responsible for rendering that header. It's likely a shared application header rather than something specific to the map page itself.

I'll search for files likely containing the header definition.

---

_****_

<details>
            <summary>Grep search for "walking\.golfer\.com" • **0** files</summary>
        
No results found
</details>

---

_****_

Okay, that didn't find the text "walking.golfer.com". Let's try searching for the text in the "Rate" button, as that seems specific.

---

_****_

<details>
            <summary>Grep search for "\bRate\b" • **5** files</summary>
        
| File | Line | Match |
|------|------|-------|
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/rate-course/layout.tsx` | L3 | `title: 'Rate a Course | The Walking Golfer',` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/rate-course/layout.tsx` | L4 | `description: 'Share your experience and rate the walkability of golf courses across the USA.',` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/rate-course/page.tsx` | L16 | `<h1 className="text-3xl font-bold text-[#0A3357] mb-2">Rate a Course</h1>` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/rate-course/RatingForm.tsx` | L89 | `router.push('/login?redirect=/rate-course')` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/rate-course/RatingForm.tsx` | L266 | `How would you rate the overall walkability of this course? *` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/MiniHeader.tsx` | L45 | `href="/rate-course"` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/MiniHeader.tsx` | L49 | `<span>Rate</span>` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L63 | `{/* Right side controls: RATE button and hamburger menu */}` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L65 | `{/* Mobile Rate a Course Button */}` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L67 | `href="/rate-course"` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L70 | `<span className="font-medium text-[#0A3357] text-sm">RATE</span>` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L101 | `{/* Top row with Rate a Course - Desktop */}` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L104 | `href="/rate-course"` |
| `vscode-remote://ssh-remote%2Ba33281ec-5c44-4565-8d75-65e2cd2cc533@a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev:22/home/runner/workspace/src/app/components/Navbar.tsx` | L107 | `<span className="font-medium text-[#0A3357]">RATE A COURSE</span>` |

</details>

---

_****_

Okay, the search results point to two relevant files:

1.  `src/app/components/MiniHeader.tsx`: This seems to be the component used in the map view (the one with the light blue "Rate" button).
2.  `src/app/components/Navbar.tsx`: This appears to be the main site header, containing the "RATE" button style we want to replicate.

Let's read both files to understand their structure and how to transfer the styles.

---

_****_

Read file: undefined

---

_****_

Read file: undefined

---

_****_



---

_****_

Okay, I've reviewed both files. The `Navbar.tsx` contains the style we want for the mobile "RATE" button (white background, dark blue text, 5 small gold stars). The `MiniHeader.tsx` has the current light blue button.

We need to copy the styling and structure from the `Link` element inside the mobile section (`md:hidden`) of `Navbar.tsx` and apply it to the corresponding `Link` element in `MiniHeader.tsx`.

Here's the proposed change for `src/app/components/MiniHeader.tsx`:

```typescript:src/app/components/MiniHeader.tsx
// ... existing code ...
import { Star, Menu, User } from 'lucide-react'; // Ensure Star is imported
// ... other imports ...

export default function MiniHeader(): JSX.Element {
  // ... existing hooks ...

  return (
    <>
      <header className="h-12 bg-[#0A3357] text-white fixed top-0 left-0 right-0 z-50 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          {/* ... Left section - Logo ... */}
          {/* ... Center section - Essential Navigation ... */}

          {/* Right section - Actions */}
          <div className="flex items-center space-x-4">
            {/* Updated Rate Button Link */}
            <Link
              href="/rate-course"
              // Applied styles from Navbar's mobile RATE button
              className="bg-white rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-[#00FFFF] transition-colors"
            >
              {/* Added styled text */}
              <span className="font-medium text-[#0A3357] text-sm">RATE</span>
              {/* Added 5 stars */}
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 fill-[#FF9A00] text-[#FF9A00]"
                  />
                ))}
              </div>
            </Link>

            {/* ... Login/Profile for desktop ... */}
            {/* ... Hamburger menu for mobile ... */}
          </div>
        </div>
      </header>

      {/* ... Mobile menu ... */}
    </>
  );
}
```

**Summary of Changes:**

1.  **Import `Star`:** Ensured the `Star` icon from `lucide-react` is imported if it wasn't already.
2.  **`className` Update:** Replaced the existing classes on the `/rate-course` `Link` with `bg-white rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-[#00FFFF] transition-colors`.
3.  **Content Update:** Changed the content inside the `Link` to include a `span` with the text "RATE" styled appropriately (`font-medium text-[#0A3357] text-sm`) and a `div` containing the loop to render 5 `Star` icons with the correct styling (`w-3 h-3 fill-[#FF9A00] text-[#FF9A00]`).

This should make the "Rate" button in the `MiniHeader` visually match the mobile "RATE" button in the main `Navbar`.

---

_**User**_

thanks thats almost there ref image. Can we make it a little smaller though please? it looks oversized compared to the logo now? 

---

_**Assistant**_



---

_****_

You're right, it does look a bit large now compared to the logo in the `MiniHeader`. Let's scale it down.

We can adjust the padding, font size, star size, and gap within the button's `Link` element in `src/app/components/MiniHeader.tsx`.

Here's the refined version:

```typescript:src/app/components/MiniHeader.tsx
// ... existing code ...
import { Star, Menu, User } from 'lucide-react';
// ... other imports ...

export default function MiniHeader(): JSX.Element {
  // ... existing hooks ...

  return (
    <>
      <header className="h-12 bg-[#0A3357] text-white fixed top-0 left-0 right-0 z-50 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          {/* ... Left section - Logo ... */}
          {/* ... Center section - Essential Navigation ... */}

          {/* Right section - Actions */}
          <div className="flex items-center space-x-4">
            {/* Updated Rate Button Link - Scaled Down */}
            <Link
              href="/rate-course"
              // Reduced padding (px-2 py-1), reduced gap (gap-0.5)
              className="bg-white rounded-md px-2 py-1 flex items-center gap-0.5 hover:bg-[#00FFFF] transition-colors" 
            >
              {/* Reduced font size (text-xs) */}
              <span className="font-medium text-[#0A3357] text-xs">RATE</span> 
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    // Reduced star size (w-2.5 h-2.5)
                    className="w-2.5 h-2.5 fill-[#FF9A00] text-[#FF9A00]" 
                  />
                ))}
              </div>
            </Link>

            {/* ... Login/Profile for desktop ... */}
            {/* ... Hamburger menu for mobile ... */}
          </div>
        </div>
      </header>

      {/* ... Mobile menu ... */}
    </>
  );
}
```

**Summary of Changes:**

1.  **Padding & Gap:** Changed `px-3 py-1.5` to `px-2 py-1` and `gap-1` to `gap-0.5` on the `Link`. Also changed `rounded-lg` to `rounded-md` for a slightly smaller radius.
2.  **Font Size:** Changed `text-sm` to `text-xs` on the "RATE" `span`.
3.  **Star Size:** Changed `w-3 h-3` to `w-2.5 h-2.5` on the `Star` icons.

This should result in a more compact button that fits better with the scale of the `MiniHeader`.

---

_**User**_

thanks thats looking good now.

In the footer when it is on the map page so using the smaller version that can be expanded, Can we add the following text that only shows when it is in hidden mode. "Provided in partnership with Stewart Golf"

The text should be centered and the same text colour used in the rest of the footer (a white-ish colour).

It should show on both mobile and desktop please

---

_**Assistant**_



---

_****_

Okay, I understand. You want to add the text "Provided in partnership with Stewart Golf" to the footer area, but only when it's in the minimized state (showing the "More ^" button, typically on the map page). This text should be centered and use the standard footer text color.

First, I need to find the footer component and see how its minimized/expanded state is handled. I'll search for files named "Footer".

---

_****_

<details>
            <summary>Searched codebase "Footer.tsx" • **3** results</summary>
        
| File |
|------|
| `undefined` |
| `undefined` |
| `undefined` |

</details>

---

_****_



---

_****_

Okay, the search results give us a few potential candidates: `Footer.tsx`, `MapFooter.tsx`, and `FooterWrapper.tsx`.

Given that you mentioned this specific minimized/expandable footer appears on the *map page*, `src/app/components/MapFooter.tsx` seems like the most relevant component to investigate.

Let's read `src/app/components/MapFooter.tsx` to understand its structure and how the minimized state is rendered.

---

_****_

Read file: undefined

---

_****_



---

_****_

Okay, I've examined `src/app/components/MapFooter.tsx`. This component wraps the standard `Footer` and controls the expand/collapse behavior.

The "Mini Footer Bar" `div` (containing the More/Less button) is always visible. We can add your text here, making it visible only when `isExpanded` is `false`.

To center the text while keeping the "More" button on the right, I'll make the mini footer bar a relative container and position the partnership text absolutely in the center.

Here are the changes to `src/app/components/MapFooter.tsx`:

```typescript:src/app/components/MapFooter.tsx
// ... existing code ...

export default function MapFooter(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed

  return (
    <>
      {/* ... Spacer div ... */}

      {/* Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A3357] border-t border-[#1B4571] z-40">
        {/* ... Expanded Footer Content ... */}

        {/* Mini Footer Bar - Added 'relative' */}
        <div className="relative h-8 min-h-[32px] flex items-center justify-end px-4 text-xs text-white bg-[#0A3357]">
          
          {/* Centered Partnership Text (only when collapsed) */}
          {!isExpanded && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              Provided in partnership with Stewart Golf
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 hover:text-[#00FFFF] relative z-10" // Added relative z-10 to ensure button is clickable over text
            aria-label={isExpanded ? 'Collapse footer' : 'Expand footer'}
          >
            <span>{isExpanded ? 'Less' : 'More'}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
```

**Summary of Changes:**

1.  **`relative` Positioning:** Added `relative` to the class list of the mini footer bar `div`.
2.  **Conditional Text:** Added a new `div` that renders only when `!isExpanded`.
3.  **Absolute Centering:** Styled the new `div` with `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center` to place it exactly in the middle of the mini bar.
4.  **Button `z-index`:** Added `relative z-10` to the expand/collapse button to ensure it stays above the absolutely positioned text and remains clickable.

This will display the centered partnership text in the minimized footer bar on both mobile and desktop, and it will disappear when the footer is expanded.

---

_**User**_

thanks, I think the most of the footer text (in the main footer) aside from headings is a grey colour? If that is correct could it be the same please?

---

_**Assistant**_



---

_****_

You are absolutely right to check for consistency! The default text color in the mini footer bar is white, inherited from the parent `div`.

To confirm the standard footer text color, I need to check the main `Footer.tsx` component.

---

_****_

Read file: undefined

---

_****_



---

_****_

You are correct. Looking at the `Footer.tsx` component, the standard text color for paragraphs and links is indeed `text-gray-300`.

Let's apply that class to the partnership text in the `MapFooter.tsx` component.

```typescript:src/app/components/MapFooter.tsx
// ... existing code ...

export default function MapFooter(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed

  return (
    <>
      {/* ... Spacer div ... */}

      {/* Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A3357] border-t border-[#1B4571] z-40">
        {/* ... Expanded Footer Content ... */}

        {/* Mini Footer Bar */}
        <div className="relative h-8 min-h-[32px] flex items-center justify-end px-4 text-xs text-white bg-[#0A3357]">
          
          {/* Centered Partnership Text (only when collapsed) - Added text-gray-300 */}
          {!isExpanded && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-300"> 
              Provided in partnership with Stewart Golf
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 hover:text-[#00FFFF] relative z-10" 
            aria-label={isExpanded ? 'Collapse footer' : 'Expand footer'}
          >
            {/* ... button content ... */}
          </button>
        </div>
      </div>
    </>
  );
}
```

**Summary of Changes:**

1.  **Added `text-gray-300`:** Added the `text-gray-300` Tailwind class to the `div` containing the partnership text. This overrides the inherited `text-white`.

Now the text color will match the standard text in the main footer section.

---



---

