const { Firestore } = require("@google-cloud/firestore");
const path = require("path");

// Inisialisasi Firestore
const db = new Firestore({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.resolve(
    __dirname,
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ),
});

module.exports = db;
