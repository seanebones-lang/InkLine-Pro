# Contributing to InkLine Pro

Thank you for your interest in contributing to InkLine Pro! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/InkLine-Pro.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see [ENV_SETUP.md](./ENV_SETUP.md))
5. Start the development server: `npm start`

## Development Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/refactor-description` - Code refactoring
- `test/test-description` - Test additions/updates

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(ai): add retry logic with exponential backoff

Implements automatic retry for failed API calls with
configurable retry attempts and exponential backoff.

Closes #123
```

## Coding Standards

### TypeScript

- Use strict TypeScript mode
- Always type function parameters and return values
- Use interfaces for object shapes
- Prefer `type` for unions and intersections

### Code Style

- Use Prettier for formatting (run `npm run format`)
- Follow ESLint rules (run `npm run lint`)
- Maximum line length: 100 characters
- Use single quotes for strings
- Use trailing commas

### React/React Native

- Use functional components with hooks
- Memoize expensive computations with `useMemo`
- Use `useCallback` for event handlers passed to children
- Extract complex logic into custom hooks
- Use TypeScript for all components

### File Organization

```
src/
├── components/     # Reusable UI components
├── screens/       # Screen components
├── services/      # Business logic and API calls
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── config/        # Configuration files
└── navigation/    # Navigation setup
```

### Naming Conventions

- Components: PascalCase (`GenerateScreen.tsx`)
- Functions: camelCase (`generateTattooDesign`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Files: Match component/function name
- Types/Interfaces: PascalCase (`ImageGenerationOptions`)

## Testing

### Writing Tests

- Write tests for all new features
- Aim for >95% code coverage
- Test edge cases and error scenarios
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('feature', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Documentation

### JSDoc Comments

Add JSDoc comments to all public functions:

```typescript
/**
 * Generates a tattoo design using AI
 * 
 * @param options - Generation options including description and image
 * @param options.description - Text description of the design
 * @param options.imageUri - Optional reference image URI
 * @param options.highRes - Whether to generate high-resolution output
 * @returns Promise resolving to SVG and base64 image data
 * @throws {Error} If generation fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const result = await generateTattooDesignWithLineart({
 *   description: 'Dragon tattoo',
 *   highRes: true
 * });
 * ```
 */
```

### README Updates

- Update README.md for user-facing changes
- Update relevant documentation files
- Add examples for new features

## Pull Request Process

1. **Update your branch**: `git pull origin main`
2. **Run validation**: `npm run validate`
3. **Write/update tests**: Ensure all tests pass
4. **Update documentation**: Add/update docs as needed
5. **Create PR**: Use the PR template
6. **Address feedback**: Respond to review comments

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings
- [ ] TypeScript compiles without errors

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
```

## Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Follow security best practices
- Report security issues privately

## Questions?

- Open an issue for questions
- Check existing documentation
- Review existing code for examples

Thank you for contributing to InkLine Pro! 🎨
