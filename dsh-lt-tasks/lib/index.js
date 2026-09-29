import { tools } from "./tools.js";
import { registerRoutes } from "./routes.js";

const name = "dsh-lt-tasks";
const inject = ["tools", "webServer"];

function apply(ctx) {
  for (const t of tools) {
    ctx.tools.register(t);
  }
  ctx.effect(() => registerRoutes(ctx), "lt-tasks: routes");
}

export { name, inject, apply };
