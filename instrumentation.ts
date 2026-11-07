export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { ensureDatabase } = await import("./lib/ensure-db");
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("Database setup failed; admin pages will retry on request.", error);
  }
}
