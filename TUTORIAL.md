# Contributing to SvelteKit-WS

Thank you for your interest in contributing! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
By participating, you are expected to uphold this code.

- Respect contributors and maintain a welcoming environment
- Use inclusive language
- Accept constructive criticism graciously
- Focus on the best possible outcome for the community

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check:

1. Search existing issues to avoid duplicates
2. Update to the latest version and test again
3. Collect information about the bug

A good bug report should include:

- Clear and descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if possible
- Environment details (OS, Node version, etc.)

**Template:**

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. Ubuntu 22.04]
- Node: [e.g. 20.10.0]
- SvelteKit: [e.g. 2.0.0]
- Library Version: [e.g. 1.0.0]
```

### Suggesting Enhancements

Enhancement suggestions welcome! Please provide:

- Clear use case
- Why it's valuable
- Possible implementation approach
- Examples dari library lain (jika ada)

### Pull Requests

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Update documentation
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm atau pnpm
- Git

### Setup Steps

```bash
# Clone repository
git clone https://github.com/ketarketir/sveltekit-ws.git
cd sveltekit-ws

# Install dependencies
npm install

# Build library
npm run build

# Watch mode untuk development
npm run dev
```

### Testing Your Changes

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Test in example project
cd examples
npm install
npm run dev
```

### Project Structure

```
sveltekit-ws/
├── src/              # Source code
│   ├── index.ts      # Main entry
│   ├── types.ts      # Type definitions
│   ├── manager.ts    # Connection manager
│   ├── vite.ts       # Vite plugin
│   └── server.ts     # Server handler
├── tests/            # Test files
├── examples/         # Example implementations
├── dist/             # Build output
└── docs/             # Documentation
```

## Pull Request Process

### Before Submitting

1. **Test thoroughly**

   - Run all existing tests
   - Add tests untuk new features
   - Test di development dan production

2. **Update documentation**

   - Update README jika perlu
   - Add JSDoc comments
   - Update CHANGELOG.md

3. **Code quality**
   - Follow coding standards
   - Run linter
   - Fix all warnings

### PR Title Format

Use the conventional commit format:

- `feat: add new feature`
- `fix: resolve bug in manager`
- `docs: update README`
- `refactor: improve connection handling`
- `test: add tests for broadcast`
- `chore: update dependencies`

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing done

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review done
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Coding Standards

### TypeScript

```typescript
// ✅ Good
interface WSMessage<T = any> {
  type: string;
  data: T;
  timestamp?: number;
}

function send(message: WSMessage): void {
  // Implementation
}

// ❌ Bad
function send(msg: any) {
  // No type safety
}
```

### Naming Conventions

- **Files**: lowercase-with-dashes.ts
- **Classes**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase (prefix dengan WS)

### Code Style

```typescript
// ✅ Good
export function getWebSocketManager(): WebSocketManager {
  if (!globalManager) {
    globalManager = new WebSocketManager();
  }
  return globalManager;
}

// ❌ Bad
export function getWebSocketManager(): WebSocketManager {
  if (!globalManager) {
    globalManager = new WebSocketManager();
  }
  return globalManager;
}
```

### Comments

````typescript
/**
 * Send message to specific connection
 *
 * @param id - Connection identifier
 * @param message - Message to send
 * @returns true if sent successfully, false otherwise
 *
 * @example
 * ```typescript
 * manager.send('connection-id', {
 *   type: 'chat',
 *   data: { text: 'Hello!' }
 * });
 * ```
 */
send(id: string, message: WSMessage): boolean {
  // Implementation
}
````

### Error Handling

```typescript
// ✅ Good
try {
  const parsed = JSON.parse(data);
  return parsed;
} catch (error) {
  console.error("Failed to parse JSON:", error);
  return null;
}

// ❌ Bad
const parsed = JSON.parse(data); // No error handling
```

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { WebSocketManager } from "../src/manager";

describe("WebSocketManager", () => {
  it("should add connection", () => {
    const manager = new WebSocketManager();
    const ws = createMockWebSocket();

    const connection = manager.addConnection(ws);

    expect(connection).toBeDefined();
    expect(connection.id).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe("WebSocket Integration", () => {
  it("should broadcast to all connections", async () => {
    const manager = new WebSocketManager();
    const ws1 = createMockWebSocket();
    const ws2 = createMockWebSocket();

    manager.addConnection(ws1);
    manager.addConnection(ws2);

    manager.broadcast({ type: "test", data: "hello" });

    expect(ws1.send).toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalled();
  });
});
```

### Test Coverage

Aim for minimum 80% test coverage:

```bash
npm run test:coverage
```

## Documentation

### Code Documentation

- Add JSDoc for public APIs
- Include examples in comments
- Document complex logic
- Keep comments up-to-date

### README Updates

When adding new features:

1. Update features list
2. Add usage example
3. Update API reference
4. Add troubleshooting if needed

### Example Code

Provide working examples:

- Simple use case
- Advanced patterns
- Common scenarios
- Edge cases

## Review Process

### What Reviewers Look For

1. **Code Quality**

   - Clean and readable
   - Follows conventions
   - No unnecessary complexity

2. **Functionality**

   - Works as intended
   - Handles edge cases
   - No breaking changes (without major version bump)

3. **Tests**

   - Good coverage
   - Tests pass
   - Meaningful test cases

4. **Documentation**
   - Clear and complete
   - Examples work
   - No typos

### Response Time

- Initial review: 1-3 days
- Follow-up: 1-2 days
- Final approval: After all checks pass

## Release Process

(For maintainers)

1. Update CHANGELOG.md
2. Bump version in package.json
3. Create git tag
4. Build and test
5. Publish to npm
6. Create GitHub release

## Questions?

- Open an issue for questions
- Join discussion in existing issues
- Contact maintainers

## Recognition

Contributors akan di-credit dalam:

- CHANGELOG.md
- GitHub contributors page
- Release notes

Thank you for your contribution! 🙏
