-- Create the workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
    workflow_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    base_props JSON DEFAULT '{}',
    transition_logic JSON DEFAULT '{}',
    trigger_workflow_name TEXT,
    PRIMARY KEY (workflow_id, step_id)
);

-- Insert some dummy initial state for tests
INSERT INTO workflow_steps (workflow_id, step_id, component_name, base_props, transition_logic) VALUES
('default-workflow-id', 'StartComponent', '', '{}', '{"NEXT": "WelcomeComponent"}'),
('default-workflow-id', 'WelcomeComponent', 'WelcomeStep', '{"title": "Welcome to Tower-Pilot"}', '{"NEXT": "KYCComponent"}'),
('default-workflow-id', 'KYCComponent', 'KYCStep', '{"title": "Identity Verification"}', '{"NEXT": "DoneComponent"}'),
('default-workflow-id', 'DoneComponent', 'DoneStep', '{"title": "Completed!"}', '{}');


-- cmd: npx wrangler d1 migrations apply aero-stream-tower-db --local