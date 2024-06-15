require("dotenv").config();
const moment = require("moment-timezone");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const gemini = require("./api/predictions");
const { generateRecomendation } = require("./api/recomendation"); // Import fungsi generateRecomendation
const chat = require("./api/chat");
const mysqlConnection = require("./database/mysqlConnection");
const recommendationsData = require("./database/recommendations");
const tf = require("@tensorflow/tfjs-node");
const Joi = require("joi");
const { tokenize } = require("./models/tokenize");
const { loadModel, predict } = require("./models/model");
const { inverseEncodeEmotion } = require("./models/emotion");

let tokenizer = null;

// Fungsi untuk memuat tokenizer dari URL
const loadTokenizer = async () => {
  if (!tokenizer) {
    const response = await axios.get(process.env.TOKENIZER_URL);
    tokenizer = response.data;
  }
  return tokenizer;
};

module.exports = [
  {
    method: "POST",
    path: "/api/v2/predictions",
    options: {
      validate: {
        payload: Joi.object({
          text: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { text } = request.payload;

      // Load the tokenizer
      await loadTokenizer();

      // Tokenize the input text
      const tokens = tokenize(text, tokenizer);

      // Load the model and make predictions
      try {
        const model = await loadModel();
        const prediction = await predict(model, tokens);

        // Mendapatkan indeks dengan probabilitas terbesar
        const predictedEmotionIndex = prediction[0].indexOf(
          Math.max(...prediction[0])
        );
        // Mendapatkan label emosi dari indeks yang diprediksi menggunakan fungsi inverse encoding
        const predictedEmotion = inverseEncodeEmotion(predictedEmotionIndex);

        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        const query =
          "INSERT INTO tbl_prediction (predictions, emotion, datetime) VALUES (?, ?, ?)";
        const values = [text, predictedEmotion, datetime];

        await new Promise((resolve, reject) => {
          mysqlConnection.query(query, values, (err, result) => {
            if (err) {
              console.error("Error saving data to MySQL:", err);
              return reject(err);
            }
            console.log("Data saved to MySQL successfully");
            resolve(result);
          });
        });

        return h
          .response({
            Status: 201,
            Message: "Data saved successfully",
            Data: {
              predict: text,
              emotion: predictedEmotion,
              datetime: datetime,
            },
          })
          .code(201);
      } catch (error) {
        console.error("Error processing request:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to process request",
            Data: {},
          })
          .code(500);
      }
    },
  },

  {
    method: "POST",
    path: "/api/predictions",
    handler: async (request, h) => {
      const { predictions } = request.payload;

      if (!predictions) {
        return h
          .response({
            Status: 400,
            Message: "Input not complete",
            Data: {},
          })
          .code(400);
      }

      try {
        // Memanggil fungsi generatePrediction dari modul gemini
        const emotionResponse = await gemini.generatePrediction(predictions);

        // Menghapus karakter newline dari properti 'emotion'
        const emotion = emotionResponse
          .replace(/ \n/g, "")
          .replace(/\n/g, "")
          .replace(/\n\n/g, "")
          .replace(/\n\n\n/g, "");

        // Waktu sekarang
        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        // Menyimpan data ke tabel tbl_prediction
        const query =
          "INSERT INTO tbl_prediction (predictions, emotion, datetime) VALUES (?, ?, ?)";
        const values = [predictions, emotion, datetime];

        await new Promise((resolve, reject) => {
          mysqlConnection.query(query, values, (err) => {
            if (err) {
              console.error("Error saving data to MySQL:", err);
              return reject(err);
            }
            console.log("Data saved to MySQL successfully");
            resolve();
          });
        });

        // Mengembalikan respons JSON tanpa karakter newline
        return h
          .response({
            Status: 201,
            Message: "Data saved successfully",
            Data: {
              predictions,
              emotion,
              datetime,
            },
          })
          .code(201);
      } catch (error) {
        console.error("Error processing request:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to process request",
            Data: {},
          })
          .code(500);
      }
    },
  },
  // Route GET untuk mendapatkan semua predictions
  {
    method: "GET",
    path: "/predictions",
    handler: async (request, h) => {
      const { emotion } = request.query;

      try {
        // Build the query with optional emotion filtering
        let query = "SELECT * FROM tbl_prediction";
        const queryParams = [];

        if (emotion) {
          query += " WHERE emotion = ?";
          queryParams.push(emotion);
        }

        // Query the database to get predictions
        const results = await new Promise((resolve, reject) => {
          mysqlConnection.query(query, queryParams, (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results);
          });
        });

        // Format datetime before sending the response
        const formattedResults = results.map((result) => ({
          ...result,
          datetime: moment(result.datetime).format("YYYY-MM-DD HH:mm:ss"), // Format datetime here
        }));

        console.log("Data retrieved from MySQL successfully");
        return h
          .response({
            Status: 200,
            Message: "Data retrieved successfully",
            Data: formattedResults,
          })
          .code(200);
      } catch (error) {
        console.error("Error retrieving data from MySQL:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to retrieve data from MySQL",
            Data: {},
          })
          .code(500);
      }
    },
  },

  // Route POST untuk menambahkan rekomendasi
  {
    method: "POST",
    path: "/api/recomendation",
    handler: async (request, h) => {
      const { emotion: emotionResponse } = request.payload;

      if (!emotionResponse) {
        return h
          .response({
            Status: 400,
            Message: "Input not complete",
            Data: {},
          })
          .code(400);
      }

      try {
        const emotion = emotionResponse
          .replace(/\\+/g, "") // Menghapus karakter escape
          .replace(/\n+/g, "") // Menghapus karakter newline
          .replace(/\"+/g, "") // Menghapus karakter kutip ganda
          .replace(/\s+/g, " ") // Menghapus spasi ganda
          .replace(/\s\s+/g, " "); // Menghapus spasi ganda

        let responsePayload = {
          emotion,
          recommendation: "",
          articles: [],
          datetime: "",
        };

        // Dapatkan rekomendasi menggunakan API
        const { recommendation } = await generateRecomendation(emotion);

        responsePayload.recommendation = recommendation;

        // Dapatkan link tambahan dari recommendationsData jika tersedia
        if (recommendationsData.hasOwnProperty(emotion.toLowerCase())) {
          const recData = recommendationsData[emotion.toLowerCase()];
          recData.forEach((item) => {
            responsePayload.articles.push({
              title: item.title,
              link: item.url,
            });
          });
        } else {
          responsePayload.articles.push({
            title: "No specific recommendation",
            link: "No specific link",
          });
        }

        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        responsePayload.datetime = datetime;

        const query =
          "INSERT INTO tbl_recommendations (emotion, recommendation, link, datetime) VALUES (?, ?, ?, ?)";

        // Prepare articles array
        const articlesArray = responsePayload.articles;

        // Convert articles array to JSON string
        const articlesString = JSON.stringify(articlesArray);

        const values = [
          emotion,
          recommendation,
          articlesString, // Save articles array as JSON string
          datetime,
        ];

        await new Promise((resolve, reject) => {
          mysqlConnection.query(query, values, (err, result) => {
            if (err) {
              console.error("Error saving data to MySQL:", err);
              return reject(err);
            }
            console.log("Data saved to MySQL successfully");
            resolve(result);
          });
        });

        return h
          .response({
            Status: 201,
            Message: "Data saved successfully",
            Data: responsePayload,
          })
          .code(201);
      } catch (error) {
        console.error("Error processing request:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to process request",
            Data: {},
          })
          .code(500);
      }
    },
  },

  // Route GET untuk mendapatkan semua rekomendasi
  {
    method: "GET",
    path: "/recomendations",
    handler: async (request, h) => {
      const { emotion } = request.query;

      try {
        // Build the query with optional emotion filtering
        let query = "SELECT * FROM tbl_recommendations";
        const queryParams = [];

        if (emotion) {
          query += " WHERE emotion = ?";
          queryParams.push(emotion);
        }

        // Query the database to get recommendations
        const results = await new Promise((resolve, reject) => {
          mysqlConnection.query(query, queryParams, (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results);
          });
        });

        // Format datetime before sending the response
        const formattedResults = results.map((result) => ({
          ...result,
          datetime: moment(result.datetime).format("YYYY-MM-DD HH:mm:ss"), // Format datetime here
        }));

        console.log("Data retrieved from MySQL successfully");
        return h
          .response({
            Status: 200,
            Message: "Data retrieved successfully",
            Data: formattedResults,
          })
          .code(200);
      } catch (error) {
        console.error("Error retrieving data from MySQL:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to retrieve data from MySQL",
            Data: {},
          })
          .code(500);
      }
    },
  },

  {
    method: "POST",
    path: "/api/chat",
    handler: async (request, h) => {
      const { chat: chatInput } = request.payload;

      if (!chatInput) {
        return h
          .response({
            Status: 400,
            Message: "Input not complete",
            Data: {},
          })
          .code(400);
      }

      try {
        const chatResponse = await chat.generateChat(chatInput);
        let resultChat = chatResponse
          .replace(/\\+/g, "") // Menghapus karakter escape
          .replace(/\n+/g, "") // Menghapus karakter newline
          .replace(/\"+/g, "") // Menghapus karakter kutip ganda
          .replace(/\*\*([^*]*)\*\*/g, "$1") // Menghapus **bold** teks
          .replace(/\s\s+/g, " ") // Menghapus spasi ganda
          .replace(/\*/g, "");

        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        return h
          .response({
            Status: 201,
            Message: "Chat response generated successfully",
            Data: {
              chat: chatInput,
              result_chat: resultChat,
              datetime,
            },
          })
          .code(201);
      } catch (error) {
        console.error("Error generating chat response:", error);
        return h
          .response({
            Status: 500,
            Message: "Failed to generate chat response",
            Data: {},
          })
          .code(500);
      }
    },
  },
];
