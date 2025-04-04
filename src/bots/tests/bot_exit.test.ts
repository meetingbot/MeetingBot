import { MeetsBot } from "../meet/src/bot";
import * as dotenv from 'dotenv';
import { BotConfig } from "../src/types";
import { TeamsBot } from "../teams/src/bot";
import { ZoomBot } from "../zoom/src/bot";
import { jest } from '@jest/globals';
import exp from "constants";


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

describe('Meet Bot Exit Tests', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Create a meet and join a predefined meeting (set in MEET_MEETING_INFO, above. When testing, you need to make sure this a valid meeting link).
     * This lets you check if the bot can join a meeting and if it can handle the waiting room -- good to know if the UI changed
    */

    it('Meet : Detect Empty Participation and Exit the meeting', async () => {
        
        // Create Bot
        const bot = new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { });

        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        bot.page = {
            waitForSelector: jest.fn(async () => {return 0;}), // Simulate successful navigation
            click: jest.fn(async () => {return 0;}), // Simulate successful navigation
            exposeFunction: jest.fn(async () => {return 0;}), // Simulate successful function loading
            evaluate: jest.fn(async () => {return 0;}), // Simulate successful evaluation
        } as any; // Mock the page object


        // replace the bot.checkKicked function with a mock implementation
        // i.e we NEVER got kicked
        jest.spyOn(bot, "checkKicked").mockImplementation(async () => {
            return false;
        });

        // Mock Bot Recording -- don't actually want to
        jest.spyOn(bot, "startRecording").mockImplementation(async () => {
            console.log("Mock startRecording called");
        });
        jest.spyOn(bot, "stopRecording").mockImplementation(async () => {
            console.log("Mock stopRecording called");
            return 0;
        });

        // Ensure bot would have ended it's life
        jest.spyOn(bot, "endLife").mockImplementation(async () => {
            console.log("Mock endLife called");
        });

        // Run Meeting info without setting up the browser

        // Break private value setter and set the timeAloneStarted to a value that is a long time ago
        (bot as any).timeAloneStarted = Date.now() - 1000000;
        (bot as any).participantCount = 1; //simulate it being only me in the meeting
        await bot.meetingActions();

        expect(bot.endLife).toHaveBeenCalled();

    }, 60000); // Set max timeout to 60 seconds

    it('Meet : Ensure on Bot Kicked proper events', async () => {
        
        // Create Bot
        const bot = new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { });

        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        bot.page = {
            waitForSelector: jest.fn(async () => {return 0;}), // Simulate successful navigation
            click: jest.fn(async () => {return 0;}), // Simulate successful navigation
            exposeFunction: jest.fn(async () => {return 0;}), // Simulate successful function loading
            evaluate: jest.fn(async () => {return 0;}), // Simulate successful evaluation
        } as any; // Mock the page object


        // replace the bot.checkKicked function with a mock implementation
        // i.e Ensure bot
        jest.spyOn(bot, "checkKicked").mockImplementation(async () => {
            return true;
        });

        // Mock Bot Recording -- don't actually want to
        jest.spyOn(bot, "startRecording").mockImplementation(async () => {
            console.log("Mock startRecording called");
        });
        jest.spyOn(bot, "stopRecording").mockImplementation(async () => {
            console.log("Mock stopRecording called");
            return 0;
        });

        // Ensure bot would have ended it's life
        jest.spyOn(bot, "endLife").mockImplementation(async () => {
            console.log("Mock endLife called");
        });

        // Run Meeting info without setting up the browser

        // Break private value setter and set the timeAloneStarted to a value that is a long time ago
        (bot as any).timeAloneStarted = Date.now() - 1000000;
        (bot as any).participantCount = 5; //simulate there being a lot of people in the meeting
        await bot.meetingActions();

        // Ensure endLife would have been called
        expect(bot.endLife).toHaveBeenCalled();

    }, 60000); // Set max timeout to 60 seconds


    it('Meet : Ensure can leave meeting if UI does not allow for it', async () => {

        // Create Bot
        const bot = new MeetsBot(mockMeetConfig, async (eventType: string, data: any) => { });

        // Mock bot.joinMeeting to simulate the page setup and override waitForSelector
        bot.page = {
            waitForSelector: jest.fn(async () => {return 0;}), // Simulate successful navigation
            click: jest.fn(async () => {return 0;}), // Simulate successful navigation
            exposeFunction: jest.fn(async () => {return 0;}), // Simulate successful function loading
            evaluate: jest.fn(async () => {return 0;}), // Simulate successful evaluation
        } as any; // Mock the page object

        //Test Function
        bot.leaveMeeting();

        // Ensure bot would have ended it's life
        jest.spyOn(bot, "endLife").mockImplementation(async () => {
            console.log("Mock endLife called");
        });

        // Ensure end meeting calls endLife (closes browser) even if an irregular leaveMeeting event.
        expect(bot.endLife).toHaveBeenCalled();

    }, 6000);


});