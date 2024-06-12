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
  generateChat: async (inputText) => {
    const response = await callGeminiApi(
      `write a couple paragraphs about ${inputText}, should me around about healty, if not about healty just say "i cant help, remmerber only a paragraph about healty is allowed" `
    );
    return response;
  },
};
