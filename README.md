# tensorflowjs-mnist-live
A real-time handwritten digit recognition using tensorflow.js, node.js and socket.io

First train the model with the following command:
```
node trainer.js --epochs 5 --model_save_path trained_model
```

Once the model is trained then you can serve a webtool to play with the model with the command bellow:

```
node server.js --model_path trained_model
```

Open your the URL http://localhost:1992/ in your browser and start playing.
