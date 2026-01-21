import { createRouteHandler } from "uploadthing/next";

import { Config } from "@/config";

import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    logLevel: "All",
    token: Config.uploadthingToken,
  },
});
