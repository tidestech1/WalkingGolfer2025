## ✮ WalkingGolfer Git Workflow Cheat Sheet

### 🌟 Purpose: Clean, branch-based workflow using Cursor (SSH) + Replit for Git & deployment

---

### 🔧 1. Create a New Branch (in Cursor or Replit shell)
```bash
git checkout -b feature/your-feature-name
```

---

### 💻 2. Write Code in Cursor + Commit Often
```bash
git add .
git commit -m "Short description of what you did"
```

---

### ☁️ 3. Push the Branch to GitHub
```bash
git push --set-upstream origin feature/your-feature-name
```

---

### 👀 4. Merge via Replit (Shell or Git UI)
```bash
# Switch to main
git checkout main
git pull origin main

# Merge your feature branch
git merge feature/your-feature-name

# Push updated main to GitHub
git push origin main
```

---

### 🚀 5. Deploy (if manual)
Trigger your Replit deploy if not set to auto-deploy on push.

---

### 🧹 6. Clean Up (Optional)
```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

---

### ✅ Branch Naming Tips
| Prefix     | Use for                        |
|------------|--------------------------------|
| `feature/` | New features (`feature/map`)   |
| `fix/`     | Bug fixes (`fix/login-error`)  |
| `test/`    | Experiments or throwaways      |
