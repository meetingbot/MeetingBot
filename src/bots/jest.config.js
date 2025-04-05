module.exports = {
  preset: "ts-jest", // Use ts-jest to handle TypeScript files
  testEnvironment: "node", // Use the Node.js environment for testing
  transform: {
    "^.+\\.tsx?$": "ts-jest", // Transform TypeScript files using ts-jest
  },
  transformIgnorePatterns: [
    "node_modules/(?!(superjson|puppeteer-stream)/)", // Allow Jest to process ES Modules in "superjson"
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy", // Map non-JS imports (e.g., CSS, images) to mock files
    "^puppeteer-stream$": "<rootDir>/zoom/node_modules/puppeteer-stream",
  },
};