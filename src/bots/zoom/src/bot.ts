import fs from "fs";
import puppeteer, { Page, Frame } from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";
import { BotConfig, EventCode, WaitingRoomTimeoutError } from "../../src/types";
import { Bot } from "../../src/bot";
import path from "path";

// Constant Selectors
const muteButton = 'button[aria-label="Mute"]';
const stopVideoButton = 'button[aria-label="Stop Video"]';
const joinButton = 'button.zm-btn.preview-join-button';
const leaveButton = 'button[aria-label="Leave"]';
import { Browser } from "puppeteer";

export class ZoomBot extends Bot {
  recordingPath: string;
  contentType: string;
  url: string;
  browser!: Browser;
  page!: Page;
  file!: fs.WriteStream;

  constructor(
    botSettings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    super(botSettings, onEvent);
    this.recordingPath = path.resolve(__dirname, "recording.mp4");
    this.contentType = "video/mp4";
    this.url = `https://app.zoom.us/wc/${this.settings.meetingInfo.meetingId}/join?fromPWA=1&pwd=${this.settings.meetingInfo.meetingPassword}`;
  }


  async screenshot(fName: string = "screenshot.png") {
    if (!this.page) throw new Error("Page not initialized");
    const screenshot = await this.page.screenshot({
      type: "png",
      encoding: "binary",
    });

    // Save the screenshot to a file
    const screenshotPath = `./${fName}`;
    fs.writeFileSync(screenshotPath, screenshot);
    console.log(`Screenshot saved to ${screenshotPath}`);
  }


  /**
   * Opens a browser and navigatges, joins the meeting.
   * @returns {Promise<void>}
   */
  async joinMeeting() {

    // Launch a browser and open the meeting
    this.browser = await launch({
      executablePath: puppeteer.executablePath(),
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-fake-device-for-media-stream",
        // "--use-fake-ui-for-media-stream"
      ],
    }) as unknown as Browser; // It looks like theres a type issue with puppeteer.

    console.log("Browser launched");

    // Create a URL object from the url
    const urlObj = new URL(this.url);

    // Get the default browser context
    const context = this.browser.defaultBrowserContext();

    // Clear permission overrides and set our own to camera and microphone
    // This is to avoid the allow microphone and camera prompts
    context.clearPermissionOverrides();
    context.overridePermissions(urlObj.origin, ["camera", "microphone"]);
    console.log('Turned off camera & mic permissions')

    // Opens a new page
    const page = await this.browser.newPage();
    this.page = page;
    
    // Navigates to the url
    await page.goto(urlObj.href);
    console.log("Page opened");

    // Waits for the page's iframe to load
    console.log('Wating for iFrame to load')
    const iframe = await page.waitForSelector(".pwa-webclient__iframe");
    const frame = await iframe?.contentFrame();
    console.log("Opened iFrame");

    if (frame) {
      // Wait for things to load (can be removed later in place of a check for a button to be clickable)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Waits for mute button to be clickable and clicks it
      await new Promise((resolve) => setTimeout(resolve, 700)); // TODO: remove this line later
      await frame.waitForSelector(muteButton);
      await frame.click(muteButton);
      console.log("Muted");

      // Waits for the stop video button to be clickable and clicks it
      await new Promise((resolve) => setTimeout(resolve, 700)); // TODO: remove this line later
      await frame.waitForSelector(stopVideoButton);
      await frame.click(stopVideoButton);
      console.log("Stopped video");

      // Waits for the input field and types the name from the config
      await frame.waitForSelector("#input-for-name");
      await frame.type("#input-for-name", this.settings.botDisplayName);
      console.log("Typed name");

      // Clicks the join button
      await frame.waitForSelector(joinButton);
      await frame.click(joinButton);
      console.log("Joined the meeting");

      // wait for the leave button to appear (meaning we've joined the meeting)
      await new Promise((resolve) => setTimeout(resolve, 1400)); // Needed to wait for the aria-label to be properly attached
      try {
        await frame.waitForSelector(leaveButton, {
          timeout: this.settings.automaticLeave.waitingRoomTimeout,
        });
      } catch (error) {
        // Distinct error from regular timeout
        throw new WaitingRoomTimeoutError();
      }

      // Wait for the leave button to appear and be properly labeled before proceeding
      console.log("Leave button found and labeled, ready to start recording");
    }
  }

  async run() {

    // Navigate and join the meeting.
    await this.joinMeeting();

    // Ensure browser exists
    if (!this.browser)
      throw new Error("Browser not initialized");

    if (!this.page)
      throw new Error("Page is not initialized");

    // Start the recording -- again, type issue from importing.
    const stream = await getStream(this.page as any, { audio: true, video: true });

    // Create and Write the recording to a file, pipe the stream to a fileWriteStream
    this.file = fs.createWriteStream(this.recordingPath);
    stream.pipe(this.file);

    console.log("Recording...");

    // Get the Frame containing the meeting
    const iframe = await this.page.waitForSelector(".pwa-webclient__iframe");
    const frame = await iframe?.contentFrame();

    // Constantly check if the meeting has ended every second
    const checkMeetingEnd = async () => {

      // TODO: Refactor this -- it won't work as expected.
      // Check for the ok button with a short timeout, and then retry as intentned.
      // Currently the bot will wait for the button to appear within 1 hour  (360k ms). 
      // When it appears, then the bot will end the meeting regardless. (no need to check okButton)
      // If the button does not appear within the hour, it throws TimeoutError, ending the meeting.

      // Wait for the "Ok" button to appear which indicates the meeting is over
      const okButton = await frame?.waitForSelector(
        "button.zm-btn.zm-btn-legacy.zm-btn--primary.zm-btn__outline--blue",
        { timeout: 3600000 },
      );

      if (okButton) {
        console.log("Meeting ended");

        // Click the button to leave the meeting
        await okButton.click();

        // End the recording and close the file
        stream.destroy();

        // End Life -- Close file, browser, and websocket server
        this.endLife();

      } else {
        setTimeout(checkMeetingEnd, 1000); // Check every second
      }
    };

    // Start the meeting end check
    await checkMeetingEnd();
  }

  // Get the path to the recording file
  getRecordingPath(): string {
    return this.recordingPath;
  }

  // Get the content type of the recording file
  getContentType(): string {
    return this.contentType;
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
  }
}
