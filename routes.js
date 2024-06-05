const moment = require("moment-timezone"); // Tambahkan ini untuk menggunakan moment-timezone
const gemini = require("./api/predictions");
const recomendation = require("./api/recomendation"); // Ubah ini menjadi recomendation
const mysqlConnection = require("./database/mysqlConnection");

module.exports = [
  {
    method: "POST",
    path: "/predictions",
    handler: async (request, h) => {
      const { id_user, predictions } = request.payload;

      if (!id_user || !predictions) {
        return h.response({ error: "Input not complete" }).code(400);
      }

      // Memanggil fungsi generatePrediction dari modul gemini
      const emotionResponse = await gemini.generatePrediction(predictions);

      // Menghapus karakter newline dari properti 'emotion'
      const emotion = emotionResponse.replace(/ \n/g, "");
      //   Waktu sekarang
      const datetime = moment()
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      // Menyimpan data ke tabel tbl_prediction
      const query =
        "INSERT INTO tbl_prediction (id_user, predictions, emotion, datetime) VALUES (?, ?, ?, ?)";
      const values = [id_user, predictions, emotion, datetime];

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
      return { id_user, predictions, emotion, datetime };
    },
  },
  {
    method: "GET",
    path: "/predictions/{id_user}",
    handler: (request, h) => {
      const { id_user } = request.params;

      return new Promise((resolve, reject) => {
        // Query to select predictions for a user
        const query = "SELECT * FROM tbl_prediction WHERE id_user = ?";
        mysqlConnection.query(query, [id_user], (err, results) => {
          if (err) {
            console.error("Error retrieving data from MySQL:", err);
            return reject(
              h
                .response({ error: "Failed to retrieve data from MySQL" })
                .code(500)
            );
          }
          console.log("Data retrieved from MySQL successfully");
          return resolve(results);
        });
      });
    },
  },
  // Routes untuk rekomendasi
  {
    method: "POST",
    path: "/recomendation",
    handler: async (request, h) => {
      const { id_user, emotion } = request.payload;

      if (!id_user || !emotion) {
        return h.response({ error: "Input not complete" }).code(400);
      }

      try {
        // Memanggil fungsi generateRecomendation dari modul recomendation
        const { recommendation, link } =
          await recomendation.generateRecomendation(emotion);

        // Waktu sekarang
        const datetime = moment()
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss");

        // Menyimpan data ke tabel recommendations
        const query =
          "INSERT INTO tbl_recommendations (id_user, emotion, recommendation, link, datetime) VALUES (?, ?, ?, ?, ?)";
        const values = [id_user, emotion, recommendation, link, datetime];

        mysqlConnection.query(query, values, (err, result) => {
          if (err) {
            console.error("Error saving data to MySQL:", err);
            return h
              .response({ error: "Failed to save data to MySQL" })
              .code(500);
          }
          console.log("Data saved to MySQL successfully");
        });

        // Mengembalikan respons JSON
        return h
          .response({ id_user, emotion, recommendation, link, datetime })
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

        // Gunakan async/await untuk menjalankan query dan tunggu hasilnya
        const results = await new Promise((resolve, reject) => {
          mysqlConnection.query(query, (err, results) => {
            if (err) {
              console.error("Error retrieving data from MySQL:", err);
              reject(err); // Melempar error jika query gagal
            } else {
              console.log("Data retrieved from MySQL successfully");
              resolve(results); // Mengembalikan hasil query jika berhasil
            }
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
  // Route GET untuk mendapatkan rekomendasi berdasarkan ID pengguna
  {
    method: "GET",
    path: "/recommendations/{id_user}",
    handler: async (request, h) => {
      const { id_user } = request.params;

      try {
        // Query untuk mengambil data rekomendasi berdasarkan ID pengguna
        const query = "SELECT * FROM tbl_recommendations WHERE id_user = ?";

        // Gunakan async/await untuk menjalankan query dan tunggu hasilnya
        const results = await new Promise((resolve, reject) => {
          mysqlConnection.query(query, [id_user], (err, results) => {
            if (err) {
              console.error("Error retrieving data from MySQL:", err);
              reject(err); // Melempar error jika query gagal
            } else {
              console.log("Data retrieved from MySQL successfully");
              resolve(results); // Mengembalikan hasil query jika berhasil
            }
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
];
