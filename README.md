# @orixen/runtimes

Code generation library for Orixen projects — generates TypeScript and Terraform code for deploying serverless applications on AWS.

## Prerequisites

- Node.js >= 20

## Installation

```bash
npm install
```

## Usage

The CLI accepts three positional arguments: `<project-path> <runtime> <command>`.

| Argument | Options | Default |
|---|---|---|
| `project-path` | Path to an Orixen project directory | Current directory |
| `runtime` | `local`, `aws` | `local` |
| `command` | `generate-lib`, `deploy` | `generate-lib` |

The project directory must contain a `project.json` file describing the blocks and connections.

### Generate library code (local development)

```bash
npm run generate:local
# or directly:
npx ts-node main.ts <project-path> local generate-lib
```

### Generate deploy code (AWS)

```bash
npm run generate:aws
# or directly:
npx ts-node main.ts <project-path> aws deploy
```

The AWS region defaults to `us-east-1` and can be overridden with the `AWS_REGION` environment variable:

```bash
AWS_REGION=eu-west-1 npm run generate:aws
```

## Supported block types

- **Function** — Lambda functions (TypeScript, Python, Go, Java)
- **API** — HTTP API triggers (API Gateway v2)
- **WebSocket** — WebSocket API triggers
- **Queue** — SQS queue triggers
- **Schedule** — EventBridge schedule triggers

## Project structure

```
runtimes/
├── main.ts                   # CLI entry point
├── filesystem/               # File system abstraction
├── lib/
│   ├── GeneratorInterface.ts # Core generator interface
│   ├── types/                # Domain models (blocks, connections, projects)
│   ├── terraform/            # Terraform serialization utilities
│   ├── utils/                # Shared utilities
│   └── typescript/
│       ├── common/           # Shared TypeScript generation logic
│       └── aws/              # AWS-specific code generation
│           └── terraform/    # AWS Terraform resource definitions
├── resources/                # Flat resource files (templates, runtime code)
│   │   # Files use underscores instead of path separators
│   │   # (e.g. typescript_aws_lambda_handler.ts) for Tauri bundling compatibility
└── test/                     # Unit, integration, and e2e tests
```

## Build

```bash
npm run build
```

Compiles TypeScript to `dist/`.

## Running tests

```bash
# Run all tests
npm test

# Run TypeScript base tests only
npm run test:typescript:base

# Run AWS-specific tests
npm run test:typescript:aws

# Run end-to-end tests
npm run test:e2e
```

## License

Sustainable Use License — see [LICENSE.md](LICENSE.md) for details.
