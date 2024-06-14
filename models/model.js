require("dotenv").config();
const tf = require("@tensorflow/tfjs-node");

let model = null;

// Load your model from the provided URL
const loadModel = async () => {
  if (!model) {
    model = await tf.loadLayersModel(process.env.MODEL_URL);
  }
  return model;
};

// Predict method
const predict = async (model, tokens) => {
  const inputTensor = tf.tensor2d(tokens, [1, tokens[0].length]); // Adjust the shape as needed
  const predictions = model.predict(inputTensor);
  return predictions.arraySync(); // Use arraySync() to get the predictions as a regular array
};

module.exports = { loadModel, predict };
