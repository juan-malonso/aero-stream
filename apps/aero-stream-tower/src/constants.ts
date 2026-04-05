import { type WorkflowContext } from "./domain";

export const TICKET_EXPIRATION_MS = 60000;
export const MAX_CONNECTION_TIME_MS = 60000;
export const INACTIVITY_TIMEOUT_MS = 20000;

export const ORIGINS: Record<string, WorkflowContext> = {
  ["default-workflow-id"]: {
    connection: {
      encription: {
        symetric: "my-super-secret-token"
      },
      origins: ["http://localhost:3000"]
    }
  }
};