// MCP for agents such as Claude Code. Stateless, so there's no GET stream or DELETE session.
export { handleMcp as POST } from "@/views/agents/index.server";
