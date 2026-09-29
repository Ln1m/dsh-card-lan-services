import { join } from "node:path";
import { readFile, writeFile, rm } from "node:fs/promises";

/** 读锁状态；未锁返回 {locked:false}。 */
export async function isLocked(root, id) {
  try {
    const raw = JSON.parse(await readFile(join(root, id, ".lock"), "utf8"));
    return { locked: true, sessionId: raw.sessionId, ts: raw.ts };
  } catch {
    return { locked: false };
  }
}

/** 锁超时：DSH_LT_TASKS_LOCK_TTL 环境变量（小时），默认 24h。 */
function lockTtlMs() {
  const hours = Number(process.env.DSH_LT_TASKS_LOCK_TTL);
  return (hours > 0 ? hours : 24) * 3600000;
}

/** 锁是否已过期（未锁视为过期，可获取）。 */
export async function isExpired(root, id) {
  const s = await isLocked(root, id);
  if (!s.locked) return true;
  return Date.now() - (s.ts || 0) > lockTtlMs();
}

/** 加锁；同一会话重复调用只续期，其他窗口持有且未过期才抛错。 */
export async function acquire(root, id, sessionId) {
  const st = await isLocked(root, id);
  if (st.locked && !(await isExpired(root, id))) {
    if (st.sessionId === sessionId) {
      await writeFile(join(root, id, ".lock"), JSON.stringify({ sessionId, ts: Date.now() }), "utf8");
      return { renewed: true };
    }
    throw new Error("任务正在推进中，已被其他窗口锁定（持有者 " + st.sessionId + "）");
  }
  await writeFile(join(root, id, ".lock"), JSON.stringify({ sessionId, ts: Date.now() }), "utf8");
  return { renewed: false };
}

/** 解锁。 */
export async function release(root, id) {
  await rm(join(root, id, ".lock"), { force: true });
}
