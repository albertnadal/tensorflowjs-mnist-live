// Usage: node trainer.js --epochs 5 --model_save_path trained_model

const tf = require('@tensorflow/tfjs-node');
const argparse = require('argparse');
const data = require('./data');
const model = require('./model');

async function run(epochs, batchSize, modelSavePath) {

  // Load MNIST dataset
  await data.loadData();

  const {images: trainImages, labels: trainLabels} = data.getTrainData();
  model.summary();

  const validationSplit = 0.15;

  // Train the model with labeled images
  await model.fit(trainImages, trainLabels, {
    epochs,
    batchSize,
    validationSplit
  });

  // Evaluate the trained model with a labeled test dataset
  const {images: testImages, labels: testLabels} = data.getTestData();
  const evalOutput = model.evaluate(testImages, testLabels);

  console.log(`\nEvaluation result:\n` + `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; `+ `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`);

  // Save the trained  model to disk
  if (modelSavePath != null) {
    await model.save(`file://${modelSavePath}`);
    console.log(`Saved model to path: ${modelSavePath}`);
  }
}

const parser = new argparse.ArgumentParser({
  description: 'TensorFlow.js-Node MNIST Example.',
  addHelp: true
});

parser.addArgument('--epochs', {
  type: 'int',
  defaultValue: 20,
  help: 'Number of epochs to train the model for.'
});

parser.addArgument('--batch_size', {
  type: 'int',
  defaultValue: 128,
  help: 'Batch size to be used during model training.'
})

parser.addArgument('--model_save_path', {
  type: 'string',
  help: 'Path to which the model will be saved after training.'
});
const args = parser.parseArgs();

run(args.epochs, args.batch_size, args.model_save_path);
