var canvasWidth           	= 28*10; //280
var canvasHeight 			      = 28*10; //280
var canvasStrokeStyle		    = "white";
var canvasLineJoin			    = "round";
var canvasLineWidth       	= 25;
var canvasBackgroundColor 	= "black";
var canvasId              	= "canvas";

var clickX = new Array();
var clickY = new Array();
var clickD = new Array();
var drawing;

var canvasBox = document.getElementById('canvas_box');
var canvas    = document.createElement("canvas");

canvas.setAttribute("width", canvasWidth);
canvas.setAttribute("height", canvasHeight);
canvas.setAttribute("id", canvasId);
canvas.style.backgroundColor = canvasBackgroundColor;
canvasBox.appendChild(canvas);
if(typeof G_vmlCanvasManager != 'undefined') {
  canvas = G_vmlCanvasManager.initElement(canvas);
}

ctx = canvas.getContext("2d");

$("#canvas").mousedown(function(e) {
	var mouseX = e.pageX - this.offsetLeft;
	var mouseY = e.pageY - this.offsetTop;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
});

canvas.addEventListener("touchstart", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}

	var rect = canvas.getBoundingClientRect();
	var touch = e.touches[0];

	var mouseX = touch.clientX - rect.left;
	var mouseY = touch.clientY - rect.top;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();

}, false);

$("#canvas").mousemove(function(e) {
	if(drawing) {
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
});

canvas.addEventListener("touchmove", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	if(drawing) {
		var rect = canvas.getBoundingClientRect();
		var touch = e.touches[0];

		var mouseX = touch.clientX - rect.left;
		var mouseY = touch.clientY - rect.top;

		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
}, false);

$("#canvas").mouseup(function(e) {
	drawing = false;
  predict();
});

canvas.addEventListener("touchend", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	drawing = false;
}, false);

$("#canvas").mouseleave(function(e) {
	drawing = false;
});

canvas.addEventListener("touchleave", function (e) {
	if (e.target == canvas) {
    	e.preventDefault();
  	}
	drawing = false;
}, false);

function addUserGesture(x, y, dragging) {
	clickX.push(x);
	clickY.push(y);
	clickD.push(dragging);
}

function drawOnCanvas() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.strokeStyle = canvasStrokeStyle;
	ctx.lineJoin    = canvasLineJoin;
	ctx.lineWidth   = canvasLineWidth;

	for (var i = 0; i < clickX.length; i++) {
		ctx.beginPath();
		if(clickD[i] && i) {
			ctx.moveTo(clickX[i-1], clickY[i-1]);
		} else {
			ctx.moveTo(clickX[i]-1, clickY[i]);
		}
		ctx.lineTo(clickX[i], clickY[i]);
		ctx.closePath();
		ctx.stroke();
	}
}

function clearCanvas(id) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	clickX = new Array();
	clickY = new Array();
	clickD = new Array();
}

async function predict() {

  if (!drawing) return;

  let ctxClone = cloneCanvas(canvas).getContext("2d");
  ctxClone.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, 28, 28);  //scale(0.1, 0.1); // Downresample the image 10 times to get a 28x28 image
  var rgbaBuffer = ctxClone.getImageData(0, 0, 28, 28).data;
  var buffer = new Uint8Array(28*28);
  let e = 0;
  for(let i = 0; i < rgbaBuffer.length; i=i+4) {
    buffer[e++] = (rgbaBuffer[i] || rgbaBuffer[i+1] || rgbaBuffer[i+3]) ? 1 : 0;
  }

  /*START DRAW*/
  for(let y=0; y<28; y++) {
    let line = "";
    for(let x=0; x<28; x++) {
      line = line + ","+buffer[y*28 + x];
    }
    console.log(line);
  }
  /*END DRAW*/

  socket.emit("predictionRequest", buffer.buffer)
}

function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
}

const socket = io();

socket.on("connect", () => {
  setInterval(predict, 300);
});

socket.on("predictionResults", results => {
  let resultsJSON = JSON.parse(results);
  console.log("TOP PREDICTIONS: ", resultsJSON);

  let elemIds = ["first_result", "second_result", "third_result"];
  elemIds.forEach(function(elId, index) {
    let e = document.getElementById(elId);
    e.innerText = resultsJSON[index].number;
    e.style.fontSize = (200 * resultsJSON[index].probability).toString()+"px";
  });

});
