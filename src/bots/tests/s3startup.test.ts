import { createS3Client } from '../src/s3';
import { S3Client } from '@aws-sdk/client-s3';
import {describe, expect, test} from '@jest/globals';

// Mock the S3Client constructor
jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn(),
    };
});

describe('Bot S3 Startup Tests', () => {

    // Test that the S3 client is created with credentials when provided
    // (Local Development Example)
    it("create an S3 client with credentials when provided", () => {
        const mockRegion = "us-east-1";
        const mockAccessKeyId = "mockAccessKeyId";
        const mockSecretKey = "mockSecretKey";

        createS3Client(mockRegion, mockAccessKeyId, mockSecretKey);

        expect(S3Client).toHaveBeenCalledWith({
            region: mockRegion,
            credentials: {
                accessKeyId: mockAccessKeyId,
                secretAccessKey: mockSecretKey,
            },
        });
    });

    // Test that the S3 client is created without credentials when not provided
    // (Production Example)
    it("create an S3 client without credentials when not provided", () => {
        const mockRegion = "us-east-1";

        createS3Client(mockRegion, undefined, undefined);

        expect(S3Client).toHaveBeenCalledWith({
            region: mockRegion,
        });
    });

    it("Bot exits immediately if s3 config passed in is invalid", () => {
        const result = createS3Client(undefined, undefined, undefined);
        expect(result).toBeNull();
    });

});
