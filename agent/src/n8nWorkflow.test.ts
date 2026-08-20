import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type N8nWorkflow = {
  name: string;
  active: boolean;
  nodes: Array<{ name: string; type: string }>;
  connections: Record<string, unknown>;
};

describe("deferred n8n workflow export", () => {
  it("is valid JSON, inactive by default, and contains the required voice-agent event routes", () => {
    const file = resolve(process.cwd(), "n8n/voice-agent-events.workflow.json");
    const workflow = JSON.parse(readFileSync(file, "utf8")) as N8nWorkflow;
    const names = workflow.nodes.map(node => node.name);
    expect(workflow.name).toContain("Voice Agent");
    expect(workflow.active).toBe(false);
    expect(names).toEqual(expect.arrayContaining([
      "Voice agent event webhook",
      "Create counsellor callback task",
      "Propagate do-not-call",
      "Alert call failure",
    ]));
    expect(workflow.connections["Voice agent event webhook"]).toBeDefined();
  });
});
