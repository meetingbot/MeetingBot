# MeetingBot Backend

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Project Initialization

1. Navigate to the backend folder:

   ```
   cd src/backend
   ```

2. Install dependencies using pnpm:

   ```
   pnpm install
   ```

3. Configure environment variables:
   1. Copy `.env.example` to `.env`
   2. Set-up a GitHub App to generate `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. You can follow Auth.js's guide: [Registering your App](https://authjs.dev/guides/configuring-github?framework=next-js#registering-your-app).
   3. Execute `npx auth` to generate an `AUTH_SECRET`.
   4. Update the rest of the values in `.env` with your configuration

### Running the Server

To start the server, run:

```
pnpm dev
```

The Express app will run at `http://localhost:{env.PORT}`.

### Technology Stack

- **Express**: Web framework for handling HTTP requests and middleware
- **tRPC**: End-to-end typesafe API layer with automatic OpenAPI generation
- **Drizzle ORM**: Typesafe SQL query builder and schema definition
- **PostgreSQL**: Relational database for storing user and bot data
- **Swagger UI**: Interactive API documentation viewer

### API Documentation

After running the server, you can access the API documentation.

### Testing

The project uses Jest for unit testing. To run the tests:

```
pnpm test
```

To run tests in watch mode during development:

```
pnpm test:watch
```

The test suite covers:
- Database utilities and connections
- tRPC router endpoints
- Service functions
- Server utilities

To add new tests, create files with the `.test.ts` extension in the appropriate directory under `src/__tests__/`.

### Docker

Docker support has not been implemented yet. This section will be updated once Docker configuration is set up.
