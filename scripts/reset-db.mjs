import { rmSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
for (const file of ["atelier.db", "atelier.db-wal", "atelier.db-shm"]) {
  rmSync(join(dataDir, file), { force: true });
}
rmSync(join(dataDir, "screenshots"), { recursive: true, force: true });
rmSync(join(dataDir, "video-jobs"), { recursive: true, force: true });
console.log("Database, case screenshots and generated videos removed. Sample videos are preserved. Stop both web and video worker before resetting.");
