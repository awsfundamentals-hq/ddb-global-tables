# DynamoDB Global Tables Demo

This project demonstrates the use of DynamoDB Global Tables using SST (Serverless Stack) v3.

## Getting Started

To run this application, follow these steps:

1. Ensure you have Node.js installed on your system.
2. Clone this repository to your local machine.
3. Install the dependencies by running `pnpm i` in the project root directory.
4. Start the development server by running:

   ```
   npx sst dev
   ```

This command will deploy the application to your AWS account and start the local development environment.

## About the Project

This application is built using SST v3, which provides a powerful framework for building serverless applications.

It showcases DynamoDB Global Tables for multi-region data replication.

The app allows you to add items to DynamoDB tables in different regions and observe the replication in real-time.

When a new item is added to the US East 1 region, it is automatically replicated to the EU West 1 region.
This is also true for the other way around.

As the items are immediately reloaded afterwards, sometime you can see that the item is not immediately available in the other region.


## Project Structure

- `sst.config.ts`: SST configuration file
- `src/pages/index.astro`: Main Astro page for the frontend
- `functions/lambda.ts`: Lambda function handling API requests

## Learn More

To learn more about SST and how to use it for serverless development, check out the [SST documentation](https://docs.sst.dev/).
