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
      `I Feel ${inputText}, write a suggestion to regulate it emotion in one paragraph, if love type While love is a powerful and beautiful emotion, it's important to remember that it's just one part of your life. Cultivate self-awareness to recognize when your feelings are overwhelming, and develop healthy coping mechanisms, such as journaling, exercise, or spending time with supportive friends. Remember that love should enhance your life, not consume it. If you find yourself struggling to regulate your emotions, seeking support from a therapist or counselor can help you develop strategies for managing your love life in a healthy and balanced way.`
    );

    // Panggil API kedua untuk mendapatkan link rekomendasi
    const linkResponse = await callGeminiApi(
      `about what i feell  now is ${inputText}, link url recomendation, only answer with url link, answer only url, dont use youtube url, find link priority from psychologytoday.com, give link, only link, link url, reply only using domain.com dont user / `
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
