import * as store from "./store.js";
import * as lock from "./lock.js";

function sendJson(res, code, value) {
  const body = JSON.stringify(value);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function readJsonBody(req, cap = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > cap) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** 注册 /lt-tasks 前缀路由（前端 UI 数据面：list/get/create/doc）。 */
export function registerRoutes(ctx) {
  return ctx.webServer.register({
    kind: "prefix",
    path: "/lt-tasks",
    handler: async (req, res) => {
      const url = new URL(req.url ?? "/", "http://x");
      const p = url.pathname;
      const root = store.resolveTasksRoot();
      try {
        if (p === "/lt-tasks/list" && req.method === "GET") {
          const tasks = await store.listTasks(root);
          for (const t of tasks) {
            const lk = await lock.isLocked(root, t.id);
            t.locked = lk.locked;
            t.lockSessionId = lk.sessionId || "";
            t.lockTs = lk.ts || 0;
          }
          return sendJson(res, 200, { ok: true, tasks });
        }
        if (p === "/lt-tasks/get" && req.method === "GET") {
          const id = url.searchParams.get("id");
          if (!id) return sendJson(res, 400, { ok: false, error: "missing id" });
          const meta = await store.readMeta(root, id).catch(() => null);
          if (!meta) return sendJson(res, 404, { ok: false, error: "task not found" });
          const docs = {};
          for (const d of store.docNames()) {
            docs[d] = await store.readDoc(root, id, d).catch(() => "");
          }
          const frozenCount = (docs.frozen || "").split("\n").filter((l) => /^\s*-\s+/.test(l) && !/^\s*-\s*\[\s*\]/.test(l)).length;
          return sendJson(res, 200, { ok: true, meta, docs, frozenCount });
        }
        if (req.method === "POST") {
          const body = await readJsonBody(req);
          if (p === "/lt-tasks/create") {
            const { id, workspacePath } = await store.createTask(root, body?.name, body?.goal, body?.refPath);
            return sendJson(res, 200, { ok: true, id, workspacePath });
          }
          if (p === "/lt-tasks/doc") {
            if (typeof body?.id !== "string" || typeof body?.doc !== "string" || typeof body?.content !== "string") {
              return sendJson(res, 400, { ok: false, error: "body needs { id, doc, content }" });
            }
            await store.writeDoc(root, body.id, body.doc, body.content);
            return sendJson(res, 200, { ok: true });
          }
          if (p === "/lt-tasks/status") {
            if (typeof body?.id !== "string" || typeof body?.status !== "string") {
              return sendJson(res, 400, { ok: false, error: "body needs { id, status }" });
            }
            await store.setStatus(root, body.id, body.status);
            return sendJson(res, 200, { ok: true });
          }
          if (p === "/lt-tasks/unlock") {
            if (typeof body?.id !== "string") {
              return sendJson(res, 400, { ok: false, error: "body needs { id }" });
            }
            await lock.release(root, body.id);
            return sendJson(res, 200, { ok: true });
          }
          if (p === "/lt-tasks/delete") {
            if (typeof body?.id !== "string") {
              return sendJson(res, 400, { ok: false, error: "body needs { id }" });
            }
            await store.deleteTask(root, body.id);
            return sendJson(res, 200, { ok: true });
          }
        }
        return sendJson(res, 404, { ok: false, error: "unknown lt-tasks endpoint" });
      } catch (error) {
        return sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
  });
}
