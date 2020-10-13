// Usage: node server.js --model_path trained_model

/* You can disable Tensorflow warnings with the command 'export TF_CPP_MIN_LOG_LEVEL=2' */

const tf = require('@tensorflow/tfjs-node');
const fs = require("fs");
const data = require('./data');
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const argparse = require('argparse');

const SERVER_PORT = 1992;
const IMAGE_HEIGHT = 28;
const IMAGE_WIDTH = 28;

let socketConnections = new Set();
let model;

async function loadTrainedModel(modelPath) {

  if (modelPath != null) {

    if (!fs.existsSync(modelPath)) {
      console.log("Model not found. Please, train the model using 'node trainer.js --epochs 1 --model_save_path trained_model'");
      exit(0);
    }

    return await tf.loadLayersModel(`file://${modelPath}/model.json`);
  } else {
    console.log("Please, provide the path of the trained model using 'node server.js --model_path MODEL_PATH'");
    exit(0);
  }
}

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has connected.`);
    socketConnections.add(socket.id);

    socket.on("disconnect", () => {
        socketConnections.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
    });

    socket.on("predictionRequest", async function(msg) {
      var uint8buffer = new Uint8Array(msg);

      let float32buffer = new Float32Array(IMAGE_HEIGHT*IMAGE_WIDTH);
      for(let i = 0; i<IMAGE_HEIGHT*IMAGE_WIDTH; i++) {
        float32buffer[i] = uint8buffer[i];
      }

      /* Draw input image in the stdout */
      for(let y=0; y<IMAGE_HEIGHT; y++) {
        for(let x=0; x<IMAGE_WIDTH; x++) {
          process.stdout.write(msg[y*IMAGE_WIDTH + x]+" ");
        }
        process.stdout.write("\n");
      }

      let inputTensor = tf.tensor4d(float32buffer, [1, IMAGE_HEIGHT, IMAGE_WIDTH, 1]);
      let predictions = await model.predict(inputTensor, {verbose: true}).data();

      var results = [];
      predictions.forEach(function (probability, number) {
        results.push({number: number, probability: probability});
      });

      results.sort(function(a, b) {
        return b.probability - a.probability;
      });

      console.log("PREDICTION: ", results);
      let topResults = results.slice(0, 3);

      socket.emit("predictionResults", JSON.stringify(topResults));
    });
}

async function startServer(modelPath) {

    // Load Tensorflow model
    model = await loadTrainedModel(modelPath);
    console.log(`Trained model loaded.`);

    // Create a new express server
    const app = express();
    const server = http.createServer(app);
    const io = socketio(server);

    // Serve the public frontend
    app.use(express.static("public"));

    // Handler for every new websocket connection
    io.on("connection", onNewWebsocketConnection);

    server.listen(SERVER_PORT, () => {
      console.info(`Listening on port ${SERVER_PORT}`);
      console.log("Open http://localhost:1992/ in your browser to start playing!\n");
    });
}

const parser = new argparse.ArgumentParser({
  description: 'TensorFlow.js-Node MNIST Server.',
  addHelp: true
});

parser.addArgument('--model_path', {
  type: 'string',
  help: 'Path to which the trained model will be loaded.'
});

const args = parser.parseArgs();

// Start server to receive prediction requests
startServer(args.model_path);
