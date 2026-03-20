import "dotenv/config";
import { syncAllTools } from "@/lib/fetchers/sync";

async function main() {
  console.log("Starting seed...");
  const result = await syncAllTools();
  console.log(`Synced ${result.synced} tools`);
  if (result.errors.length > 0) {
    console.warn("Errors:", result.errors);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
