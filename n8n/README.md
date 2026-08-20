# n8n Voice-Agent Event Workflow

Import `voice-agent-events.workflow.json` in n8n by opening **Workflows**, selecting **Import from File**, and choosing the JSON file. It is deliberately inactive after import.

Once n8n is available at a public HTTPS address, copy the workflow’s production webhook URL into the agent application as its automation event destination. Secure the workflow using n8n webhook authentication or a reverse-proxy signature check before activation. The application should send a signed envelope with an `eventId`, `event`, `contactId`, `collegeProfileId`, and event-specific payload; n8n should return a quick acknowledgement and never hold the live call open.

The file includes four events. `callback_requested` reaches the placeholder counsellor-task node. `dnc_recorded` reaches the suppression node. `call_failed` reaches the alert node. `call_completed` is acknowledged and can be expanded with CRM timeline logic. Replace the marked Code nodes with the correct CRM, messaging, and alert connectors for the user’s environment before activating the workflow.
