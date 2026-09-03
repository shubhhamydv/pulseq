# Documentation

This directory will contain project documentation, including:

- Architecture overview
- API documentation
- Setup guides
- Contributing guidelines
- Future roadmap

_To be expanded as the project develops._

## Final Phase 8 Artifacts

The final deployment architecture is defined in [`architecture-final.mmd`](./architecture-final.mmd) and rendered in [`architecture-final.png`](./architecture-final.png). The measured benchmark report is [`benchmarks/phase8-2000-jobs.md`](./benchmarks/phase8-2000-jobs.md), and the reproducible benchmark runner is [`../scripts/load-test.mjs`](../scripts/load-test.mjs). Local distributed deployment uses [`../infra/docker-compose.yml`](../infra/docker-compose.yml) with the four application Dockerfiles at the repository root.
