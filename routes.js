const moment = require("moment-timezone");
const gemini = require("./api/predictions");
const recomendation = require("./api/recomendation");
const chat = require("./api/chat");
const mysqlConnection = require("./database/mysqlConnection");

module.exports = [
  {
    method: "POST",
    path: "/api/predictions",
    handler: async (request, h) => {
      const { predictions } = request.payload;

      if (!predictions) {
        return h.response({ error: "Input not complete" }).code(400);
      }

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

      mysqlConnection.query(query, values, (err) => {
        if (err) {
          console.error("Error saving data to MySQL:", err);
          return h
            .response({ error: "Failed to save data to MySQL" })
            .code(500);
        }
        console.log("Data saved to MySQL successfully");
      });

      // Mengembalikan respons JSON tanpa karakter newline
      return h.response({ predictions, emotion, datetime }).code(201);
    },
  },
  // Route GET untuk mendapatkan semua predictions
  {
    method: "GET",
    path: "/predictions",
    handler: async (request, h) => {
      try {
        // Membungkus query dalam Promise
        const results = await new Promise((resolve, reject) => {
          const query = "SELECT * FROM tbl_prediction";
          mysqlConnection.query(query, (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results);
          });
        });

        console.log("Data retrieved from MySQL successfully");
        return h.response(results).code(200);
      } catch (error) {
        console.error("Error retrieving data from MySQL:", error);
        return h
          .response({ error: "Failed to retrieve data from MySQL" })
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
        return h.response({ error: "Input not complete" }).code(400);
      }

      try {
        const emotion = emotionResponse
          .replace(/\\+/g, "") // Menghapus karakter escape
          .replace(/\n+/g, "") // Menghapus karakter newline
          .replace(/\"+/g, "") // Menghapus karakter kutip ganda
          .replace(/\s\s+/g, " "); // Menghapus spasi ganda

        const { recommendation, link } =
          await recomendation.generateRecomendation(emotion); // Menggunakan nama fungsi yang benar

        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        const query =
          "INSERT INTO tbl_recommendations (emotion, recommendation, link, datetime) VALUES (?, ?, ?, ?)";
        const values = [emotion, recommendation, link, datetime];

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
          .response({ emotion, recommendation, link, datetime })
          .code(201);
      } catch (error) {
        console.error("Error processing request:", error);
        return h.response({ error: "Failed to process request" }).code(500);
      }
    },
  },
  // Route GET untuk mendapatkan semua rekomendasi
  {
    method: "GET",
    path: "/recommendations",
    handler: async (request, h) => {
      try {
        // Query untuk mengambil semua data rekomendasi
        const query = "SELECT * FROM tbl_recommendations";

        // Membungkus query dalam Promise
        const results = await new Promise((resolve, reject) => {
          mysqlConnection.query(query, (err, results) => {
            if (err) {
              console.error("Error retrieving data from MySQL:", err);
              return reject(err); // Melempar error jika query gagal
            }
            console.log("Data retrieved from MySQL successfully");
            resolve(results); // Mengembalikan hasil query jika berhasil
          });
        });

        // Mengembalikan respons JSON dengan hasil query
        return h.response(results).code(200);
      } catch (error) {
        console.error("Error processing request:", error);
        return h.response({ error: "Failed to process request" }).code(500);
      }
    },
  },

  {
    method: "POST",
    path: "/api/chat",
    handler: async (request, h) => {
      const { chat: chatInput } = request.payload;

      if (!chatInput) {
        return h.response({ error: "Input not complete" }).code(400);
      }

      try {
        const chatResponse = await chat.generateChat(chatInput);
        let resultChat = chatResponse
          .replace(/\\+/g, "") // Menghapus karakter escape
          .replace(/\n+/g, "") // Menghapus karakter newline
          .replace(/\"+/g, "") // Menghapus karakter kutip ganda
          .replace(/\s\s+/g, " "); // Menghapus spasi ganda

        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        return h
          .response({ chat: chatInput, result_chat: resultChat, datetime })
          .code(201);
      } catch (error) {
        console.error("Error generating chat response:", error);
        return h
          .response({ error: "Failed to generate chat response" })
          .code(500);
      }
    },
  },
];
