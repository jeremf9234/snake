# Repository Guidelines

## Project Structure & Module Organization
Keep production code inside `src/`, grouped by domain module (e.g., `src/data/feeds.py`, `src/trading/strategies/`). Shared utilities belong in `src/common/`. Tests mirror the same tree beneath `tests/` so `tests/trading/test_strategies.py` tracks the class it exercises. Configuration files (`pyproject.toml`, `.env.example`, notebooks) stay at the repository root, while large datasets or exports live under `assets/` and are git-ignored when proprietary.

## Build, Test, and Development Commands
Create a virtual environment (`python -m venv .venv && source .venv/bin/activate`) before installing dependencies with `pip install -e .[dev]`. Run the library locally with `python -m journal_trading.cli --config configs/paper.yaml`. Use `pytest` for unit tests, `pytest -m slow` for integration suites, and `ruff check src tests` to lint. Regenerate typed artifacts via `mypy src` and refresh notebooks with `jupyter nbconvert --execute notebooks/*.ipynb`.

## Coding Style & Naming Conventions
Follow Black-compatible formatting (PEP 8, 4-space indents). Classes use `PascalCase`, functions and modules use `snake_case`, and constants live in `UPPER_SNAKE`. Prefer type hints throughout; fail CI if `mypy` reports errors. Organize imports as stdlib, third-party, then local modules. Keep functions under 40 lines and extract strategy logic into pure functions for deterministic testing.

## Testing Guidelines
Every feature needs matching tests in `tests/` using descriptive names like `test_strategy_handles_gap_up`. Cover both happy-path and risk-control branches; aim for 85% line coverage via `pytest --cov=journal_trading --cov-report=term-missing`. Mock network or broker APIs with `pytest-mock` fixtures and seed pseudo-random generators to keep results reproducible.

## Commit & Pull Request Guidelines
Write commits in present tense (`feat: add momentum signal loader`). Each PR should describe motivation, implementation notes, and verification steps; link Jira tickets or GitHub issues, attach screenshots for UI/log output changes, and list any config migrations. Ensure CI (lint, type-check, tests) passes before requesting review and keep PRs under ~400 lines for fast turnaround.

## Security & Configuration Tips
Never commit secrets—store broker keys in `.env.local` and reference them via `os.environ`. Review dependency updates with `pip list --outdated` monthly and lock versions in `pyproject.toml`. If a module interacts with external brokers or exchanges, add replayable fixtures (`tests/data/broker_snapshots/`) so reviewers can validate behavior without live credentials.
