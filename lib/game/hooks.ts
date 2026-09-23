// Globals used by automated checks and browser agents. Keep names stable:
// scripts/ and earlier validation logs depend on them.
export type TestHooks = {
  render_game_to_text?: () => string;
  advanceTime?: (ms: number, renderFrame?: boolean) => void;
  eagley_debug?: unknown;
};
export function testHooks() {
  return window as Window & TestHooks;
}

type ModelContext = {
  registerTool?: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => unknown;
};
export function modelContext() {
  return (document as Document & { modelContext?: ModelContext }).modelContext;
}
