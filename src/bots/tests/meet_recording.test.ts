import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { beforeAll, beforeEach, jest } from '@jest/globals';
import exp from "constants";
const fs = require('fs');
const { execSync } = require('child_process');

jest.mock('superjson', () => ({
    serialize: jest.fn((data) => ({ json: JSON.stringify(data), meta: null })),
    deserialize: jest.fn((data: any) => JSON.parse(data.json)),
}));

// Create Mock Configs
dotenv.config();
const mockMeetConfig = {
    id: 0,
    meetingInfo: JSON.parse(process.env.MEET_TEST_MEETING_INFO || '{}'),
    automaticLeave: {
        // automaticLeave: null, //Not included to see what happens on a bad config
    }
} as BotConfig;

describe('Meet Bot Record Tests', () => {

    let bot: MeetsBot;
    let recordingPath: null | string;

    // Create the bot for each
    beforeEach(() => {
        // Create Bot
        bot = new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { });
        recordingPath = null;
    });

    // Cleanup
    afterEach(() => {
        jest.clearAllMocks();
        if (recordingPath && fs.existsSync(recordingPath)) {
            fs.unlinkSync(recordingPath);
        }
    });

    /**
     * Create a meet and join a predefined meeting (set in MEET_MEETING_INFO, above. When testing, you need to make sure this a valid meeting link).
     * This lets you check if the bot can join a meeting and if it can handle the waiting room -- good to know if the UI changed
    */
    it.skip('Recording file Exists', async function () {

        /**
         *  Skipped because of ffmpeg requirments which aren't availabe locally wihtout tremendous effort. 
         * 
         * This necesatates that we run the tests in the docker container,
         * but the way the test suite is setup and the other bots are structured
         * (at the time of writing) makes it infeasable.
         * 
         * Ideally, you would run a command like
         *      
         *      "docker run --rm meet pnpm run test meet"
         * 
         * Which would run only meet specific test cases.
         *
         */

        
        // Check if ffmpeg is available
        try {
            execSync('ffmpeg -version', { stdio: 'ignore' });
        } catch (error) {
            console.warn('Skipping test: ffmpeg is not available.');
            this.skip();
            return;
        }

        // Launch a broser
        await bot.launchBrowser();

        // Mock page 
        await bot.page.goto('https://www.google.com', { waitUntil: "networkidle" });
        await bot.page.waitForTimeout(100);

        // Start Recording
        await bot.startRecording();
        await bot.page.waitForTimeout(20000);

        // Stop Recording
        await bot.stopRecording();
        await bot.page.waitForTimeout(1000);

        // Stop Recording
        const recordingPath = bot.getRecordingPath();

        //End
        await bot.endLife();

        
        // Assertions
        expect(recordingPath).toBeDefined();
        const fileExists = fs.existsSync(recordingPath);
        expect(fileExists).toBe(true); // Ensure file exists

        // Check dimensions using ffprobe
        const ffprobeOutput = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${recordingPath}"`);
        const dimensions = JSON.parse(ffprobeOutput);
        
        // Delete the temp file once we have read in dimensions
        if (recordingPath && fs.existsSync(recordingPath)) {
            fs.unlinkSync(recordingPath);
        }
        
        // TODO: Use an input to determine the expected dimension, pass that to the bot when recording start.
        // No implementation for that yet.
        expect(dimensions.streams[0].width).toBeGreaterThan(0);
        expect(dimensions.streams[0].height).toBeGreaterThan(0);


    }, 60000); // Set max timeout to 60 seconds

});
