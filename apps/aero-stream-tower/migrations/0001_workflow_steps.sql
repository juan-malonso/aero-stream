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
'default-workflow-id', 'Default Workflow', 1,
'{
  "StartComponent": {
    "type": "Start",
    "name": "",
    "props": {},
    "transition": {"NEXT": "00000000-0000-0000-0000-000000000000"}
  },
  "00000000-0000-0000-0000-000000000000": {
    "type": "WelcomeComponent",
    "name": "WelcomeStep",
    "props": {"title": "Welcome to Tower-Pilot"},
    "transition": {"NEXT": "11111111-1111-1111-1111-111111111111"}
  },
  "11111111-1111-1111-1111-111111111111": {
    "type": "VideoComponent",
    "name": "VideoStep",
    "props": {"title": "First Live Camera Feed"},
    "transition": {"NEXT": "11111111-1111-1111-1111-222222222222"}
  },
  "11111111-1111-1111-1111-222222222222": {
    "type": "VideoComponent",
    "name": "VideoStep",
    "props": {"title": "Second Live Camera Feed"},
    "transition": {"NEXT": "22222222-2222-2222-2222-222222222222"}
  },
  "22222222-2222-2222-2222-222222222222": {
    "type": "KYCComponent",
    "name": "KYCStep",
    "props": {"title": "Identity Verification"},
    "transition": {"NEXT": "33333333-3333-3333-3333-333333333333"}
  },
  "33333333-3333-3333-3333-333333333333": {
    "type": "DoneComponent",
    "name": "DoneStep",
    "props": {"title": "Completed!"},
    "transition": {}
  }
}'
);
