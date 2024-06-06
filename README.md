# Capstone Project

## Overview

This project is a recommendation system built using Node.js for the Capstone Project. It utilizes machine learning capabilities, HTTP requests, and interacts with a MySQL database to provide recommendations and predictions based on user input.

## Installation

1. Clone the repository.
2. Install dependencies with `npm install`.

## Usage

### Endpoints

#### POST Requests:

- To create a recommendation:
  - Endpoint: `http://localhost:3000/api/recomendation`
  - Payload: JSON object with `emotion`.
- To create a prediction:
  - Endpoint: `http://localhost:3000/api/predictions`
  - Payload: JSON object with `predictions`.
- To generate chat responses:
  - Endpoint: `http://localhost:3000/api/chat`
  - Payload: JSON object with `chat`.

#### GET Requests:

- To retrieve all recommendations:
  - Endpoint: `http://localhost:3000/recommendations`
- To retrieve all predictions:
  - Endpoint: `http://localhost:3000/predictions`

## Development

- Run the server with `npm run start`.
- Run the development server with `npm run start:dev`.
- The server will run on `http://localhost:3000`.

## Dependencies

- [@hapi/hapi](https://www.npmjs.com/package/@hapi/hapi): For building the server.
- [@tensorflow/tfjs](https://www.npmjs.com/package/@tensorflow/tfjs): For machine learning capabilities.
- [axios](https://www.npmjs.com/package/axios): For making HTTP requests.
- [dotenv](https://www.npmjs.com/package/dotenv): For loading environment variables.
- [moment-timezone](https://www.npmjs.com/package/moment-timezone): For handling timezones.
- [mysql](https://www.npmjs.com/package/mysql): For interacting with MySQL database.
- [nodemon](https://www.npmjs.com/package/nodemon): For automatic server restarts during development.
