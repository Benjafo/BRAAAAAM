# These guidelines must be strictly adhered to!

## Workflow Overview

1. Create a branch from `master`
2. Make your changes, open a pull request
3. Get it reviewed, then merge

All changes go through pull requests - there are no direct commits to `master`.

## Branch

### Protected Branches

- `master` is protected and requires PR reviews before merging
- Direct pushes are disabled
- **Branches must be up-to-date before merging**
- Testing, linting, and formatting must pass before merging

### Branch Naming

Use descriptive names:

- Features: `feature/user-authentication`, `feature/custom-forms`
- Bug fixes: `fix/login-timeout`, `fix/user-profile-validation`
- Testing changes: `test/scheduling-test`

Acceptable branch categories:

- Creating a new feature: `feature/`
- Submitting a bug fix: `fix/`
- Updating documentation: `docs/`
- Updating testing: `test/`
- Code restructuring without changing functionality: `refactor/`

All branches must be named in [kebab-case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case).

### Creating a Branch

Always start from an updated `master`:

```bash
git checkout master
git pull origin master
git checkout -b <branch-name>
```

### Updating your Branch

To avoid conflicts, update your branch:

```bash
git checkout master
git pull origin master
git checkout <branch-name>
git rebase master
```

Update your branch at these two times:

- Before starting work on your branch each day
- Before opening a PR

## Commit

### Message Format

Write clear, imperative messages:

- ✅ "Implement refresh token for authentication"
- ✅ "Remove inconsistent spacing between appointments in calendar view"
- ❌ "Added authentication"
- ❌ "fixed stuff"

### Commit Rules

- Don't mix refactoring with features, limit commits to one logical change
    <!-- - Examples: -->
- No commented-out code
- Run tests, linting, and formatting on local code before committing

<!-- ## SHOW HOW TO DO TEST LINT FORMAT -->

## Pull Request

### Before Opening

- Code runs locally without errors
- Run tests, linting, and formatting
- Branch is updated with latest `master`
- Self-review your changes (use `git diff`)
- Remove any dead code

### Title Requirements

- Must be a clear, concise description starting with a verb
- Example: "Add password reset functionality"
- Example: "Fix race condition in payment processor"

### Review Requirements

- 2 approvals required (including project manager)
- GitHub Actions checks must pass

### Merging

- Only merge when all requirements are met
- Delete branch after merging

## Code Review

### When reviewing, prioritize:

1. **Correctness**: Does the code do what it's supposed to?
2. **Readability**: Is it clear what the code does? Good variable names?
3. **Security**: Check for:
   - Exposed API keys or secrets
   - Exposed database connection strings
   - Hardcoded URLs or IP addresses
   - .env files (.env.example exempt)
4. **Tests**: Are new features/fixes properly tested?

**Giving Feedback**:

- Be constructive and specific
- Explain why something should change
- Differentiate between "must fix" and "consider"

---

## Quick Commands

```bash
# Update your branch with latest master
git checkout master
git pull origin master
git checkout your-branch
git rebase master

# Safely force push after rebase
git push --force-with-lease

# Undo last commit but keep changes staged
# Use when "I need to redo this commit"
git reset --soft HEAD~1

# Undo last commit and unstage changes
# Use when "I want to reorganize what goes into this commit"
git reset --mixed HEAD~1

# Undo last commit and discard changes (be careful!)
# Use when "I want to completely throw away this commit and its changes"
git reset --hard HEAD~1

# Move commit to a different branch
# Use if you commit to the wrong branch
git reset --soft HEAD~1
git stash
git checkout correct-branch
git stash pop
git commit -m "<commit message>"

# Check what will be committed
git diff --staged

# Remove file from staging
git restore --staged filename

# Clean up local branches
git branch --merged | grep -v "\\*\\|master" | xargs -n 1 git branch -d
```

Questions? Ask in the Discord!
