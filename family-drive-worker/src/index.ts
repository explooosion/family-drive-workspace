import { handleThumbnailRequest, handleVideoRequest } from "./handlers/video_handler";
import type { Env } from "./worker_types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith("/thumbnail/")) {
      return handleThumbnailRequest(request, env, ctx);
    }

    return handleVideoRequest(request, env, ctx);
  },
};
