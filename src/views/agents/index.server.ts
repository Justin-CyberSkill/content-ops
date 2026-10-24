// Server-only entry: the agent API's route handlers.
export {
  deleteProposal,
  getPlan,
  getProposal,
  getProposals,
  patchProposal,
  postProposal,
} from "./api/handlers";
export { handleMcp } from "./api/mcp";
