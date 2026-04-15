import { handleVideoRequest } from "./handlers/video_handler";
import type { Env } from "./worker_types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleVideoRequest(request, env, ctx);
  },
};
