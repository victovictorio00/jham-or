import { exportPublication, savePublication } from "../src/lib/publication";
import { db } from "../src/lib/db";
async function main() {
  try {
    const snapshot = await exportPublication();
    await savePublication(snapshot);
    console.log(
      `Publicación preparada: ${snapshot.products.length} muebles, ${snapshot.pages.length} páginas.`,
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
