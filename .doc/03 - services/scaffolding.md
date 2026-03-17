# Scaffolding Documentation

## Project Initialization

This section describes the steps to initialize each of the project's components.

### Aero-Stream Tower (Backend)

The `tower` is a Cloudflare Worker. To initialize a new project, the Cloudflare CLI, `wrangler`, is used.

**Initialization Command:**

```bash
# Navigate to the app's directory
cd apps/aero-stream-tower

# Create a new worker based on a template (e.g., Hono)
npm create cloudflare@latest . -- --framework=hono --ts --no-deploy --no-git
```

- `--framework=hono`: Uses the official Hono template for simple routing.
- `--ts`: Configures the project to use TypeScript.
- `--no-deploy`: Prevents automatic deployment after creation.
- `--no-git`: Does not initialize a new Git repository.

### Aero-Stream Pilot (Frontend)

_(This section will be completed when the `pilot`'s technology stack is defined)._
