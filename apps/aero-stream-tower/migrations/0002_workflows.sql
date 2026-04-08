DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflows;

CREATE TABLE workflows (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    steps JSON NOT NULL,
    PRIMARY KEY (id, version)
);

INSERT INTO workflows (id, name, version, steps) VALUES (
'default-workflow-id', 
'Default Workflow', 
1,
'{
  "StartComponent": {
    "type": "Start",
    "name": "",
    "props": {},
    "transition": {"NEXT": "WelcomeComponent"}
  },
  "WelcomeComponent": {
    "type": "Step",
    "name": "WelcomeStep",
    "props": {"title": "Welcome to Tower-Pilot"},
    "transition": {"NEXT": "KYCComponent"}
  },
  "KYCComponent": {
    "type": "Step",
    "name": "KYCStep",
    "props": {"title": "Identity Verification"},
    "transition": {"NEXT": "DoneComponent"}
  },
  "DoneComponent": {
    "type": "Step",
    "name": "DoneStep",
    "props": {"title": "Completed!"},
    "transition": {}
  }
}'
);
