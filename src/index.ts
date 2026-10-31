import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { verifySmtp } from "./modules/contact/contact.service";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);

    // Wrong SMTP credentials should show up now, not on the first inquiry.
    if (env.smtpConfigured) {
      void verifySmtp().then((ok) => {
        // eslint-disable-next-line no-console
        console.log(`[server] SMTP ${ok ? "ready" : "not reachable, check the credentials"}`);
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn("[server] SMTP not configured, contact messages will only be stored");
    }
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("[server] unhandled rejection:", reason);
  });
  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("[server] uncaught exception:", error);
    void shutdown("uncaughtException");
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[server] failed to start:", error);
  process.exit(1);
});
