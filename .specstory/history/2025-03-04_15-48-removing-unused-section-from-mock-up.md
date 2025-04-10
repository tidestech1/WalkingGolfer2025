## SpecStory

## Removing Unused Section from Mock-up (04/03/2025, 15:48:33)

_**User**_

Although this page is just a development mock-up at the moment and not connected to anything, I'd like to make a quick amendment before I show the progress of the project to people. Could we remove the section that I've put in this screen grab as we don't make use of that anymore? in the rest of the code? 

---

_**Assistant**_

I'll help you remove the elevation change section from the form. Based on the screenshot, you want to remove the "Approximate Elevation Change (feet)" input section.

Let me edit the file to remove this section:

---

_****_



---

_****_



I notice the edit wasn't applied correctly. Let me try to reapply it with a smarter model:

---

_****_



---

_****_



Great! The changes have been successfully applied. I've removed:
1. The state variable `elevationChange` and its setter
2. The `elevationChangeFeet` field from the `additionalData` object
3. The entire elevation change input section from the form

The form should now be cleaner and only show the fields that are actively being used. Is there anything else you'd like me to help you with?

---

_**User**_

Could you remove the walking time part too please, thats not used either

---

_**Assistant**_

I'll help you remove the walking time section and its related state/logic.

---

_****_



---

_****_



Let me try to reapply it with a smarter model:

---

_****_



---

_****_



Great! The changes have been successfully applied. I've removed:
1. The state variable `walkingTime` and its setter
2. The `walkingTimeMinutes` field from the `additionalData` object
3. The entire walking time input section from the form

The form should now be cleaner with only the actively used fields. The `additionalData` object now only contains the `allowedCartTypes`. Is there anything else you'd like me to help you with?

---



---

