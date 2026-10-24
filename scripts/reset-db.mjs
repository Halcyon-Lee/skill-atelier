import { rmSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
for (const file of ["atelier.db", "atelier.db-wal", "atelier.db-shm"]) {
  rmSync(join(dataDir, file), { force: true });
}
console.log("Database removed. It will be re-seeded on the next request.");
