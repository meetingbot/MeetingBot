import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Bot } from "./bot";
import fs, { readFileSync } from "fs";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import crypto from "crypto";
import { startHeartbeat, reportEvent } from "./monitoring";
import { EventCode, type BotConfig } from "./types";

dotenv.config();

const main = async () => {
  let hasErrorOccurred = false;
  const requiredEnvVars = [
    "BOT_DATA",
    "AWS_BUCKET_NAME",
    "AWS_REGION",
  ] as const;

  // Check all required environment variables are present
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Parse bot data
  const botData: BotConfig = JSON.parse(process.env.BOT_DATA!);
  console.log("Received bot data:", botData);
  const botId = botData.id;

  // Declare key variable at the top level of the function
  let key: string = "";

  // Initialize S3 client
  let s3Client: S3Client;
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  } else {
    s3Client = new S3Client({
      region: process.env.AWS_REGION!,
    });
  }

  // Create the appropriate bot instance based on platform
  let bot: Bot;
  switch (botData.meetingInfo.platform) {
    case "google":
      const { MeetsBot } = await import("../meet/src/bot");
      bot = new MeetsBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    case "teams":
      const { TeamsBot } = await import("../teams/src/bot");
      bot = new TeamsBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    case "zoom":
      const { ZoomBot } = await import("../zoom/src/bot");
      bot = new ZoomBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    default:
      throw new Error(`Unsupported platform: ${botData.meetingInfo.platform}`);
  }

  // Create AbortController for heartbeat
  const heartbeatController = new AbortController();

  // Start heartbeat in the background
  console.log("Starting heartbeat");
  startHeartbeat(botId, heartbeatController.signal);

  // Report READY_TO_DEPLOY event
  await reportEvent(botId, EventCode.READY_TO_DEPLOY);

  try {
    // Run the bot
    await bot.run().catch(async (error) => {

      console.error("Error running bot:", error);
      await reportEvent(botId, EventCode.FATAL, {
        description: (error as Error).message,
      });

      // Check what's on the screen in case of an error
      bot.screenshot();

      // Is this necessary?
      // **Ensure** the bot cleans up its resources 
      await bot.endLife();
    });

    // Upload recording to S3
    console.log("Start Upload to S3...");
    const recordingPath = bot.getRecordingPath();

    let fileContent: Buffer;
    let i = 10;
    while (true) {
      try {
        fileContent = readFileSync(recordingPath);
        console.log("Successfully read recording file");
        break; // Exit loop if readFileSync is successful
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === "EBUSY") {
          console.log("File is busy, retrying...");
          await setTimeout(1000); // Wait for 1 second before retrying
        } else if (err.code === "ENOENT") {
          console.log("File not found, retrying ", i--, " more times");
          await setTimeout(1000); // Wait for 1 second before retrying

          if (i < 0) {
            throw new Error("File not found after multiple retries");
          }
        } else {
          throw error; // Rethrow if it's a different error
        }
      }
    }

    // Create UUID and initialize key
    const uuid = crypto.randomUUID();
    const contentType = bot.getContentType();
    key = `recordings/${uuid}-${bot.settings.meetingInfo.platform}-recording.${
      contentType.split("/")[1]
    }`;

    try {
      const commandObjects = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      };

      const putCommand = new PutObjectCommand(commandObjects);
      await s3Client.send(putCommand);
      console.log(`Successfully uploaded recording to S3: ${key}`);

      // Clean up local file
      await fs.promises.unlink(recordingPath);
    } catch (error) {
      console.error("Error uploading to S3:", error);
    }
  } catch (error) {
    hasErrorOccurred = true;
    console.error("Error running bot:", error);
    await reportEvent(botId, EventCode.FATAL, {
      description: (error as Error).message,
    });
  }

  // After S3 upload and cleanup, stop the heartbeat
  heartbeatController.abort();
  console.log("Bot execution completed, heartbeat stopped.");

  // Only report DONE if no error occurred
  if (!hasErrorOccurred) {
    // Report final DONE event
    await reportEvent(botId, EventCode.DONE, { recording: key });
  }

  // Exit with appropriate code
  process.exit(hasErrorOccurred ? 1 : 0);
};

main();
