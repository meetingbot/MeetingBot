import fs from "fs";
import puppeteer from "puppeteer";
import { launch, getStream, wss } from "puppeteer-stream";

// Url from Zoom meeting
const url =
    "https://us05web.zoom.us/j/87836813561?pwd=OUqT7h05sUvUyoGPFe1TF6yGtabPeb.1";

// Parse the url to get the web meeting url
const parseZoomUrl = (input: string): string => {
  const urlObj = new URL(input);
  const meetingId = urlObj.pathname.split('/')[2];
  const params = new URLSearchParams(urlObj.search);
  const pwd = params.get('pwd');
  return `https://app.zoom.us/wc/${meetingId}/join?fromPWA=1&pwd=${pwd}`;
};

console.log(parseZoomUrl(url));

// Create the file to save the recording
const file = fs.createWriteStream(__dirname + "/test.mp4");

// Launch a browser and open the meeting
(async () => {
  const browser = await launch({
    executablePath: puppeteer.executablePath(),
    headless: false,
    // slowMo: 10,
  });
  const urlObj = new URL(parseZoomUrl(url));

  const context = browser.defaultBrowserContext();
  context.clearPermissionOverrides();
  context.overridePermissions(urlObj.origin, ["camera", "microphone"]);

  // Opens a new page
  const page = await browser.newPage();

  // Navigates to the url
  await page.goto(urlObj.href);

  // Waits for the page's iframe to load
  const iframe = await page.waitForSelector('.pwa-webclient__iframe');
  const frame = await iframe?.contentFrame();

  if (frame) {
    // Waits for the input field and types the name
    await frame.waitForSelector("#input-for-name");
    await frame.type("#input-for-name", "Meeting Bot");

    // Waits for the join button and clicks it
    await frame.waitForSelector("button.zm-btn.preview-join-button");
    await frame.click("button.zm-btn.preview-join-button");
    
    // Waits for the join with audio button and clicks it
    // TODO: force join with audio before joining the meeting
    await frame.waitForSelector("button.join-audio-by-voip__join-btn", {timeout: 60000});
    await new Promise(resolve => setTimeout(resolve, 1000));
    await frame.click("button.join-audio-by-voip__join-btn");
  }

  // Start the recording
  const stream = await getStream(page, { audio: true, video: true });

  console.log("Recording...");

  // Pipe the stream to the file
  stream.pipe(file);

  // Constantly check if the meeting has ended every 5 seconds
  // TODO: see what happens if the bot gets kicked as well
  const checkMeetingEnd = async () => {
    // Wait for the "Ok" button to appear which indicates the meeting is over
    const okButton = await frame?.waitForSelector(
      'button.zm-btn.zm-btn-legacy.zm-btn--primary.zm-btn__outline--blue',
      { timeout: 3600000 }
    );

    if (okButton) {
      console.log("Meeting ended");
      // Click the button to leave the meeting
      await okButton.click();

      // End the recording and close the file
      stream.destroy();
      file.close();
      console.log("Recording saved");

      // Close the browser
      await browser.close();
      (await wss).close();
    } else {
      setTimeout(checkMeetingEnd, 1000);
    }
  };

  // Start the meeting end check
  checkMeetingEnd();
})();