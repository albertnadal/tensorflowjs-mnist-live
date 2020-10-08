/* You can disable Tensorflow warnings with the command 'export TF_CPP_MIN_LOG_LEVEL=2' */
const tf = require('@tensorflow/tfjs-node');
const fs = require("fs");
const data = require('./data');
const argparse = require('argparse');

async function serve(modelPath) {

  if (modelPath != null) {

    if (!fs.existsSync(modelPath)) {
      console.log("Model not found. Please, train the model using trainer.js");
      return;
    }

    const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
    console.log(`Model loaded...`);

    await data.loadData();
    let tensor = data.getFirstTensorFromDataset();
    let predictions = await model.predict(tensor, {verbose: true}).data();

    console.log("PREDICTIONS: ", predictions);
  } else {
    console.log("Please, provide the path of the trained model.");
  }
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

serve(args.model_path);
