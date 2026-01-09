#!/bin/bash

# Setup Git Hooks for better development workflow

echo "Setting up Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Pre-commit hook - Run linter and type check
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "Running pre-commit checks..."

# Run linter
echo "→ Running linter..."
npm run lint --quiet
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix errors before committing."
    exit 1
fi

# Run type check
echo "→ Running type check..."
npx tsc --noEmit --pretty false
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix type errors before committing."
    exit 1
fi

echo "✓ Pre-commit checks passed!"
exit 0
EOF

# Pre-push hook - Run build check
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "Running pre-push checks..."

# Run build
echo "→ Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before pushing."
    exit 1
fi

echo "✓ Pre-push checks passed!"
exit 0
EOF

# Post-merge hook - Install dependencies if package.json changed
cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash

# Check if package.json or package-lock.json changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -E "package(-lock)?.json"; then
    echo "📦 package.json changed, running npm install..."
    npm install
fi

# Check if prisma schema changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep "prisma/schema.prisma"; then
    echo "🔄 Prisma schema changed, regenerating client..."
    npx prisma generate
fi
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
chmod +x .git/hooks/post-merge

echo "✓ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  • pre-commit: Runs linter and type check"
echo "  • pre-push: Runs build check"
echo "  • post-merge: Auto-installs deps and regenerates Prisma client"
echo ""
echo "To skip hooks temporarily, use: git commit --no-verify"
