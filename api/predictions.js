const axios = require("axios");
require("dotenv").config();

const apiUrl = process.env.API_URL;
const apiKey = process.env.API_KEY;

async function callGeminiApi(inputText) {
  try {
    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [
              {
                text: inputText,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          key: apiKey,
        },
      }
    );

    const { status, data } = response;

    if (status === 200) {
      return (
        data.candidates[0].content.parts[0].text ||
        "Error: Unable to generate text"
      );
    } else {
      return "Error: API request failed with status code " + status;
    }
  } catch (error) {
    console.error("API request failed:", error.message);
    return "Error: API request failed with exception " + error.message;
  }
}

module.exports = {
  generatePrediction: async (inputText) => {
    const response = await callGeminiApi(
      `What I do today is ${inputText}, try to guess my emotions in my one word, which must be in empty, sadness, enthusiasm, neutral, surprise, love, fun, happiness, boredom, relief, anger. remember answer the question only one word.`
    );
    return response;
  },
};
