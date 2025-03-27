import { type BotConfig, type EventCode } from "./types";

export interface BotInterface {
  readonly settings: BotConfig;
  onEvent: (eventType: EventCode, data?: any) => Promise<void>;
  getRecordingPath(): string;
  getContentType(): string;
  run(): Promise<void>;
  screenshot(fName?: string): Promise<void>;
}

export class Bot implements BotInterface {
  readonly settings: BotConfig;
  onEvent: (eventType: EventCode, data?: any) => Promise<void>;

  constructor(
    settings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    this.settings = settings;
    this.onEvent = onEvent;
  }

  /**
   * Open a browser and navigatges, joins the meeting.
   */  
  async joinMeeting(): Promise<any> {
    throw new Error("Method not implemented.");
  }


  /**
   * Takes a screenshot of the current page and saves it to a file. Useful for debugging..
   * @param fName - The name of the file to save the screenshot as.
   */
  async screenshot(fName?: string): Promise<void> {
      throw new Error("Method not implemented.");
  }

  /**
   *  Clean Resources, close the browser.
   * This is used differently by each bot, but it should be called
   * at the end of the bot's lifecycle at some point.
   * 
   * Helpful in testing, where a bot might not be able to close the browser
   * due to a different lifecycle, or the test ending.
   * @returns {Promise<void>}
   */  
  async endLife(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  /**
   * Run the platform specific bot. Joins meeting, Sets up recording,
   * and waits to leave -- then leaves.
   */
  async run(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /**
   * Function to get the recordingPath
   * @returns {string} recordingPath
   */
  getRecordingPath(): string {
    throw new Error("Method not implemented.");
  }

  /**
   * Function to get the contnet type of the recording
   * @returns {string} contentType
   */
  getContentType(): string {
    throw new Error("Method not implemented.");
  }
}
