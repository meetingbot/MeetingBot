import fs from "fs";
import puppeteer, { Browser, Page } from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import crypto from "crypto";
import { BotConfig, EventCode, WaitingRoomTimeoutError } from "../../src/types";
import { Bot } from "../../src/bot";

const leaveButtonSelector =
  'button[aria-label="Leave (Ctrl+Shift+H)"], button[aria-label="Leave (⌘+Shift+H)"]';


export class TeamsBot extends Bot {
  recordingPath: string;
  contentType: string;
  url: string;
  participants: string[];
  participantsIntervalId: NodeJS.Timeout;
  browser!: Browser;
  page!: Page;
  file!: fs.WriteStream;

  constructor(
    botSettings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    super(botSettings, onEvent);
    this.recordingPath = "./recording.webm";
    this.contentType = "video/webm";
    this.url = `https://teams.microsoft.com/v2/?meetingjoin=true#/l/meetup-join/19:meeting_${this.settings.meetingInfo.meetingId}@thread.v2/0?context=%7b%22Tid%22%3a%22${this.settings.meetingInfo.tenantId}%22%2c%22Oid%22%3a%22${this.settings.meetingInfo.organizerId}%22%7d&anon=true`;
    this.participants = [];
    this.participantsIntervalId = setInterval(() => { }, 0);
  }

  getRecordingPath(): string {
    return this.recordingPath;
  }

  getContentType(): string {
    return this.contentType;
  }

  async screenshot(fName: string = "screenshot.png") {
    if (!this.page) throw new Error("Page not initialized");

    try {
      const screenshot = await this.page.screenshot({
        type: "png",
        encoding: "binary",
      });

      // Save the screenshot to a file
      const screenshotPath = `./${fName}`;
      fs.writeFileSync(screenshotPath, screenshot);
      console.log(`Screenshot saved to ${screenshotPath}`);
    } catch (error) {
      console.log("Error taking screenshot:", error);
    }
  }

  async joinMeeting() {

    // Launch the browser and open a new blank page
    this.browser = await launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      // args: ["--use-fake-ui-for-media-stream"],
      args: ["--no-sandbox"],
      protocolTimeout: 0,
    }) as unknown as Browser;

    // Parse the URL
    console.log("Parsing URL:", this.url);
    const urlObj = new URL(this.url);

    // Override camera and microphone permissions
    const context = this.browser.defaultBrowserContext();
    context.clearPermissionOverrides();
    context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

    // Open a new page
    const page = await this.browser.newPage();
    this.page = page;
    console.log('Opened Page');

    // Navigate the page to a URL
    await page.goto(urlObj.href);

    // Fill in the display name
    await page
      .locator(`[data-tid="prejoin-display-name-input"]`)
      .fill(this.settings.botDisplayName ?? "Meeting Bot");
    console.log('Entered Display Name');
    
    // Mute microphone before joining
    await page.locator(`[data-tid="toggle-mute"]`).click();
    console.log('Muted');
    
    // Join the meeting
    await page.locator(`[data-tid="prejoin-join-button"]`).click();
    console.log('Found the Join Button');

    // Wait until join button is disabled or disappears
    await page.waitForFunction(
      (selector) => {
        const joinButton = document.querySelector(selector);
        return !joinButton || joinButton.hasAttribute("disabled");
      },
      {},
      '[data-tid="prejoin-join-button"]'
    );

    // Check if we're in a waiting room by checking if the join button exists and is disabled
    const joinButton = await page.$('[data-tid="prejoin-join-button"]');
    const isWaitingRoom =
      joinButton &&
      (await joinButton.evaluate((button) => button.hasAttribute("disabled")));

    let timeout = 30000; // if not in the waiting room, wait 30 seconds to join the meeting
    if (isWaitingRoom) {
      console.log(
        `Joined waiting room, will wait for ${this.settings.automaticLeave.waitingRoomTimeout > 60 * 1000
          ? `${this.settings.automaticLeave.waitingRoomTimeout / 60 / 1000
          } minute(s)`
          : `${this.settings.automaticLeave.waitingRoomTimeout / 1000
          } second(s)`
        }`
      );

      // if in the waiting room, wait for the waiting room timeout
      timeout = this.settings.automaticLeave.waitingRoomTimeout; // in milliseconds
    }

    // wait for the leave button to appear (meaning we've joined the meeting)
    console.log('Waiting for the ability to leave the meeting (when I\'m in the meeting...)', timeout, 'ms')
    try {
      await page.waitForSelector(leaveButtonSelector, {
        timeout: timeout,
      });
    } catch (error) {
      // Distinct error from regular timeout
      throw new WaitingRoomTimeoutError();
    }

    // Log Done
    console.log("Successfully joined meeting");
  }

  async run() {

    // Start Join
    await this.joinMeeting();

    //Create a File to record to
    this.file = fs.createWriteStream(this.getRecordingPath());

    // Click the people button
    console.log("Opening the participants list");
    await this.page.locator('[aria-label="People"]').click();

    // Wait for the attendees tree to appear
    console.log("Waiting for the attendees tree to appear");
    const tree = await this.page.waitForSelector('[role="tree"]');
    console.log("Attendees tree found");

    const updateParticipants = async () => {
      try {
        const currentParticipants = await this.page.evaluate(() => {
          const participantsList = document.querySelector('[role="tree"]');
          if (!participantsList) {
            console.log("No participants list found");
            return [];
          }

          const currentElements = Array.from(
            participantsList.querySelectorAll(
              '[data-tid^="participantsInCall-"]'
            )
          );

          return currentElements
            .map((el) => {
              const nameSpan = el.querySelector("span[title]");
              return (
                nameSpan?.getAttribute("title") ||
                nameSpan?.textContent?.trim() ||
                ""
              );
            })
            .filter((name) => name);
        });

        this.participants = currentParticipants;
      } catch (error) {
        console.log("Error getting participants:", error);
      }
    };

    // Get initial participants list
    await updateParticipants();

    // Then check for participants every heartbeatInterval milliseconds
    this.participantsIntervalId = setInterval(
      updateParticipants,
      this.settings.heartbeatInterval
    );

    // Get the stream
    const stream = await getStream(
      this.page as any, //puppeteer type issue
      { audio: true, video: true },
    );

    // Pipe the stream to a file
    console.log("Recording...");
    stream.pipe(this.file);

    // Then wait for meeting to end by watching for the "Leave" button to disappear
    await this.page.waitForFunction(
      (selector) => !document.querySelector(selector),
      { timeout: 0 }, // wait indefinitely
      leaveButtonSelector
    );
    console.log("Meeting ended");

    // Clear the participants checking interval
    clearInterval(this.participantsIntervalId);

    // Stop recording
    await stream.destroy();
    this.endLife();
  }

  /**
   * Clean Resources, close the browser.
   * Ensure the filestream is closed as well.
   */
  async endLife() {

    // Close File if it exists
    if (this.file) {
      this.file.close();
      this.file = null as any;
    }

    // Close Browser
    if (this.browser) {
      await this.browser.close();

      // Close the websocket server
      (await wss).close();
    }

     // Clear any intervals or timeouts to prevent open handles
     if (this.participantsIntervalId) {
        clearInterval(this.participantsIntervalId);
    }
  }
}
