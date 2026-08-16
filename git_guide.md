## 1. Clone the Project

Press **`Win + R`**, type:

```text
cmd
```

Then press **Enter**.

In Command Prompt, clone the repository:

```bash
git clone https://github.com/kyaw-hmue-San/pd_project_events_clubs.git
```

Go into the project folder:

```bash
cd pd_project_events_clubs
```

Open the project in VS Code:

```bash
code .
```

---

## 2. Check the Current Git Branch

In VS Code, open **Terminal** and run:

```bash
git status
```

You should normally see that you are on the:

```text
main
```

branch.

You can also check the branch with:

```bash
git branch
```

---

## 3. Create Your Own Branch

Before changing or adding anything, create your own branch:

```bash
git checkout -b your-branch-name
```

Example:

```bash
git checkout -b event-search-feature
```

Then check:

```bash
git status
```

or:

```bash
git branch
```

The `*` will show which branch you are currently using.

---

## 4. After You Finish Your Work

First, check what files you changed:

```bash
git status
```

Add all changed files:

```bash
git add .
```

Commit your changes with a meaningful message:

```bash
git commit -m "Add event search feature"
```

Then push your branch to GitHub:

```bash
git push origin your-branch-name
```

Example:

```bash
git push origin event-search-feature
```

---

## 5. Check Git Username and Email

Sometimes Git may not allow you to commit or push correctly because your Git/GitHub account is not configured properly.

Check your Git username:

```bash
git config user.name
```

Check your Git email:

```bash
git config user.email
```

To check the global settings:

```bash
git config --global user.name
git config --global user.email
```

If you need to set them:

```bash
git config --global user.name "Your GitHub Username"
git config --global user.email "your-email@example.com"
```

**Note:** `user.name` and `user.email` control the identity recorded in your commits. GitHub **push permission** also depends on which GitHub account you are authenticated with and whether that account has access to the repository.

---

## Quick Workflow

```bash
git clone https://github.com/kyaw-hmue-San/pd_project_events_clubs.git
cd pd_project_events_clubs
code .

git status
git checkout -b your-branch-name

# Do your work...

git status
git add .
git commit -m "Describe what you changed"
git push origin your-branch-name
```
