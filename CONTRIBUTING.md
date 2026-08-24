# Contributing

Thanks for your interest in contributing to Repulsine Visualizer. We welcome bug reports, feature ideas, documentation improvements, and pull requests from the community.

The broader VRIL-LABS ecosystem also includes sister skills and companion projects. Explore the featured skills collection here:

https://github.com/VRIL-LABS/skill-jam/tree/main/featured-skills

## Before you start

- Check the existing issues and pull requests to avoid duplicate work.
- For significant changes or new features, open or comment on an issue first so the direction is aligned before you invest time in implementation.
- Keep your changes focused and scoped to one concern at a time.

## Development setup

```bash
git clone https://github.com/VRIL-LABS/repulsine-visualizer.git
cd repulsine-visualizer
npm install --legacy-peer-deps
npm run dev
```

The app runs locally at http://localhost:3000.

## Code standards

- Maintain the existing Next.js 16 + React + Three.js structure.
- Prefer small, readable changes over broad refactors.
- Keep UI work accessible and performant; avoid introducing unnecessary dependencies.
- If you change behavior, update relevant documentation or comments when needed.

## Validation

Before opening a pull request, run the project checks locally:

```bash
npm run lint
npm run build
```

If a change affects the 3D scene, include a brief description of the visual impact and any relevant screenshots when possible.

## Pull requests

1. Fork the repository or create a feature branch.
2. Make a focused change with a clear commit history.
3. Ensure the project still passes lint/build checks.
4. Open a pull request with a concise summary of the change and motivation.
5. Reference any related issues by number when applicable.

Please keep PR descriptions specific and easy to review.

## Reporting bugs

When filing an issue, include:

- a clear title and summary
- steps to reproduce
- expected behavior and actual behavior
- your environment (OS, browser, Node/npm versions if relevant)
- screenshots or logs when helpful

## Feature requests

Feature proposals are welcome. Please explain the problem you want to solve, the use case, and any alternatives you considered.

## Community expectations

This project is maintained in a respectful, collaborative environment. Please keep feedback constructive and assume good intent when discussing ideas or changes.

## Licensing

By contributing code or documentation, you agree that your contribution will be licensed under the project license described in the repository.
