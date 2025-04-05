# Contributing to Meeting Bot

Thank you for your interest in contributing to Meeting Bot! This document provides guidelines for contributing to the project.

## Project Structure

The project is divided into four main components, each with its own README:

- `src/frontend/` - The Next.js web application (only used for frontend) providing an interface for users to create an account, manage API keys and monitor bot resources, logs and usage, README [here](src/frontend/README.md)
- `src/backend/` - The Express API server is mainly used for the user's application to interact with, deploy bots, fetch downloads ect. Swagger docs are available at the root endpoint, and Auth.js for Express is used for authentication, README [here](src/backend/README.md)
- `src/bots/` - The bot scripts for Google Meet, Zoom and Microsoft Teams, which are compiled into Docker images and deployed to AWS ECR, README [here](src/bots/README.md)
- `src/terraform/` - The Terraform code for the AWS infrastructure, README [here](terraform/README.md)

Please refer to the specific `README` in each directory for detailed setup and development instructions.

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` in the frontend, backend and bots directories, refer to the specific `README` in each directory for more information
3. Install dependencies in each directory:
   ```bash
   cd src/frontend && npm install
   cd src/backend && npm install
   cd src/bots && npm install
   ```

## Development Workflow

1. Create a new branch for your feature/fix
2. Make your changes
3. ~~Ensure all tests pass~~ _TODO: We don't have tests yet_
4. Submit a pull request

## Getting Help

If you need help or have questions:

1. Check the component-specific README files
2. Review existing issues
3. Create a new issue with detailed information

## Contributor License Agreement (CLA) and Licensing

By contributing to Meeting Bot, you agree to the following terms:

1. **License Grant**: Your contributions will be licensed under the project's current license. 

2. **Re-licensing Rights**: You grant the core founding group or their designated successors the right to re-license the project and your contributions under different terms, subject to the following conditions:
   - Any re-licensing must maintain the project's commitment to remaining open source under OSI-approved licenses
   - The project shall never be licensed in a way that discriminates against any person, group, or field of endeavor
   - Re-licensing decisions must prioritize the project's long-term sustainability and community benefit over short-term commercial interests of any single entity
   - Re-licensing requires approval by a majority vote from participating contributors (defined as those who cast a vote within the designated voting period)

3. **Voting Process**: For re-licensing votes:
   - Voting periods must be announced at least 30 days in advance
   - Voting must remain open for a minimum of 14 days
   - At least 30% of contributors active within the past year must participate for the vote to be valid
   - Results must be publicly announced within 7 days of vote completion

4. **Patent Rights**: Contributors also grant a non-exclusive patent license for any patents they own that are necessarily infringed by their contributions.

5. **Dormancy Provision**: If the project becomes dormant for 12+ consecutive months with no commits or releases from core maintainers, contributors may collectively adopt alternative governance through a majority vote of active contributors.

6. **License Modifications**: The core founding group or their designated successors reserve the right to modify the project's license if deemed necessary for the project's development and sustainability, subject to the conditions listed above.

See [LICENSE](LICENSE) for the current project license details.
