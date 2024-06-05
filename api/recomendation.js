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
  generateRecomendation: async (inputText) => {
    // Panggil API pertama untuk mendapatkan rekomendasi
    const recommendationResponse = await callGeminiApi(
      `I Feel ${inputText}, write a suggestion to regulate it emotion in one paragraph`
    );

    // Panggil API kedua untuk mendapatkan link rekomendasi
    const linkResponse = await callGeminiApi(
      `about what i feell  now is ${inputText}, link recomendation, only answer with url link, answer only url, dont use youtube url, find link priority from psychologytoday.com, give link, only link, link url, `
    );

    // Pisahkan respons menjadi rekomendasi dan link rekomendasi
    const recommendation =
      recommendationResponse.split("\n")[0] ||
      "Error: Unable to generate recommendation";
    const link =
      linkResponse.split("\n")[0] || "Error: Unable to generate link";

    return { recommendation, link };
  },
};
