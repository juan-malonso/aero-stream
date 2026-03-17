# Aero-Stream Project

**Aero-Stream** is a solution designed to establish a secure, encrypted, and bidirectional communication channel between a client (frontend) and a server (backend).

This repository is a monorepo structure containing all the components of the Aero-Stream system.

## Project Structure

The project is organized into workspaces, managed by npm workspaces.

- `apps/`: Contains the individual Cloudflare Worker applications.
  - `aero-stream-tower`: The orchestrator worker. It validates initial connections and manages the lifecycle of the secure channel.
  - `aero-stream-pilot`: The tunnel worker. It acts as a secure WebSocket-to-TCP proxy, piping data between the client and a backend service.
- `.doc/`: Contains all project documentation, including architecture diagrams and use cases.

## Getting Started

Follow these steps to set up your local development environment.

### Prerequisites

- **Node.js**: The required version is specified in the `.nvmrc` file. It's recommended to use a version manager like [nvm](https://github.com/nvm-sh/nvm).
  ```bash
  # This will automatically read the .nvmrc file and use the correct version
  nvm use
  ```
- **npm**: Should be installed with Node.js.

### Installation

1.  **Install Dependencies**: From the root of the project, run the following command to install all dependencies for the entire project, including all workspaces.

    ```bash
    npm install
    ```

## Development

This project is configured with ESLint and Prettier to ensure code quality and a consistent style.

- **Linting**: To check for code quality issues, run:

  ```bash
  npm run lint
  ```

  To automatically fix many issues, run:

  ```bash
  npm run lint:fix
  ```

- **Formatting**: To format the entire codebase, run:
  ```bash
  npm run format
  ```

### Running the Workers

To run any of the workers in a local development environment, navigate to its directory and use the `wrangler` commands. For example, to run the `tower`:

```bash
cd apps/aero-stream-tower
npx wrangler dev
```
