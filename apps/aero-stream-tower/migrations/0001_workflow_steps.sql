DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflows;

CREATE TABLE workflows (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    start TEXT NOT NULL,
    steps JSON NOT NULL,
    globals JSON NOT NULL DEFAULT '{}',
    PRIMARY KEY (id, version)
);

INSERT INTO workflows (id, name, version, start, steps, globals) VALUES (
  'default-workflow-id', 
  'Default Workflow', 
  1,
  '00000000-0000-0000-0000-000000000000',
  '{
    "00000000-0000-0000-0000-000000000000": {
      "execution": {
        "mode": "FRONT",
        "type": "KYCComponent"
      },
      "name": "KYCComponent",
      "config": {
        "title": "Welcome to Tower-Pilot",
        "description": "Por favor, introduce tu nombre para comenzar."
      },
      "transitions": [
        {
          "condition": true, 
          "next": "11111111-1111-1111-1111-111111111111"
        }
      ]
    },
    "11111111-1111-1111-1111-111111111111": {
      "execution": {
        "mode": "FRONT",
        "type": "WelcomeComponent"
      },
      "name": "WelcomeComponent",
      "config": {
        "title": "Welcome to Tower-Pilot",
        "description": "Hola {{steps.00000000-0000-0000-0000-000000000000.name}}! Por favor, haz clic en el botón para continuar."
      },
      "transitions": [
        {
          "condition": true, 
          "next": "22222222-2222-2222-2222-222222222222"
        }
      ]
    },
    "22222222-2222-2222-2222-222222222222": {
      "execution": {
        "mode": "FRONT",
        "type": "VideoComponent"
      },
      "name": "LiveCameraFeed",
      "config": {
        "title": "¡Hola {{steps.00000000-0000-0000-0000-000000000000.name}}!",
        "subtitle": "Por favor, mira a la cámara."
      },
      "transitions": [
        {
          "condition": true,
          "next": "33333333-3333-3333-3333-333333333333"
        }
      ]
    },
    "33333333-3333-3333-3333-333333333333": {
      "execution": {
        "mode": "FRONT",
        "type": "VideoComponent"
      },
      "name": "SecondVideoComponent",
      "config": {
        "title": "Sonrrie de nuevo a la camara!",
        "subtitle": "Por favor, mira a la cámara."
      },
      "transitions": [
        {
          "condition": true,
          "next": "44444444-4444-4444-4444-444444444444"
        }
      ]
    },
    "44444444-4444-4444-4444-444444444444": {
      "execution": {
        "mode": "FRONT",
        "type": "DoneComponent"
      },
      "name": "DoneComponent",
      "config": {
        "title": "¡Verificación Completada!",
        "message": "Gracias, {{steps.00000000-0000-0000-0000-000000000000.name}}. Tu identidad ha sido validada."
      },
      "transitions": []
    }
  }',
  '{}'
);
