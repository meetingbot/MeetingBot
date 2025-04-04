import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { beforeAll, beforeEach, jest } from '@jest/globals';
import exp from "constants";
const fs = require('fs');
const { execSync } = require('child_process');

//
// Each of these are in their seperate files because, for a reason I cannot find,
//  the stream() is unavailable after the first test it is run. This doesn't impact the bot in production,
// since we only ever send one .stream() request per bot.
//


jest.mock('superjson', () => ({
    serialize: jest.fn((data) => ({ json: JSON.stringify(data), meta: null })),
    deserialize: jest.fn((data: any) => JSON.parse(data.json)),
}));

// Create Mock Configs
dotenv.config();
const mockZoomConfig = {
    id: 0,
    meetingInfo: JSON.parse(process.env.ZOOM_TEST_MEETING_INFO || '{}'),
    automaticLeave: {
        // automaticLeave: null, //Not included to see what happens on a bad config
    }
} as BotConfig;

describe('Zoom Bot Recording Test', () => {

    // Cleanup
    afterEach(() => {
        jest.clearAllMocks();
    });


    it('Recording Dimension Test', async function () {

        // Check if ffmpeg is available
        try {
            execSync('ffmpeg -version', { stdio: 'ignore' });
        } catch (error) {
            console.warn('Skipping test: ffmpeg is not available.');
            this.skip();
            return;
        }

        const bot = new ZoomBot(mockZoomConfig, async (eventType: string, data: any) => { });
        let recordingPath: string | null = null;

        // Launch a broser
        await bot.launchBrowser();
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Start Recording
        await bot.startRecording();
        console.log('Started Recording')
        await new Promise((resolve) => setTimeout(resolve, 10000));
        console.log('Done holding.')

        // Stop Recording
        await bot.stopRecording();
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Stop Recording
        recordingPath = bot.getRecordingPath();

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