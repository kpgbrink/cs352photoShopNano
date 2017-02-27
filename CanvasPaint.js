/*
 * CanvasPaint 352 -- starter code for a paint program using the 
 * HTML5 canvas element--for CS352, Calvin College Computer Science
 *
 * Harry Plantinga -- January 2011
 */

$(document).ready(function () { cpaint.init(); });

var cpaint = {
  drawing: 		false,
  tool:			'marker',
  color:		'#333399',
}

cpaint.init = function () {  
  cpaint.canvas  = $('#canvas1')[0];
  cpaint.cx = cpaint.canvas.getContext('2d');
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
    
  // change css for buttons to make clicks look good  
  $('#markerButton, #menuMarker').bind('click', {tool:"marker"}, cpaint.selectTool);
  $('#lineButton, #menuLine').bind('click', {tool:"line"}, cpaint.selectTool);
  $('#rectButton, #menuRect').bind('click', {tool:"rect"}, cpaint.selectTool);
  $('#eraserButton, #menuEraser').bind('click', {tool:"eraser"}, cpaint.selectTool);
  //$('#colorPicker').bind('click', {tool:"marker"}, cpaint.selectTool);
  //$('#clearButton').bind('click', {tool:"clear"}, cpaint.selectTool);
    
  // create offscreen copy of canvas in an image

  // bind functions to events, button clicks
  $(cpaint.canvas).bind('mousedown', cpaint.drawStart);
  $(cpaint.canvas).bind('mousemove', cpaint.draw);
  $('*').bind('mouseup', cpaint.drawEnd);
  $('#color1').bind('change', cpaint.colorChange);
  $('#color1').colorPicker();			// initialize color picker
  $('#mainmenu').clickMenu();			// initialize menu
    

  // bind menu options
  $('#menuClear').bind('click', cpaint.clear);
  $('#menuNew').bind('click', cpaint.clear);
  $('#clearButton').bind('click', cpaint.clear);
  $('#menuFade').bind('click', cpaint.fade);
  $('#menuUnfade').bind('click', cpaint.unfade);
  $('#menuOpen').bind('click',cpaint.open);
  $('#menuSave').bind('click',cpaint.save);
  $('#toolBar').show();		// when toolbar is initialized, make it visible
    
    
  // Canvas for size selector
  cpaint.canvas2 = $('#canvas2')[0];
  cpaint.canvas2.width = $(cpaint.canvas2).width();
  cpaint.canvas2.height = $(cpaint.canvas2).height();
  cpaint.cx2 = cpaint.canvas2.getContext('2d');
  $('#widthSlider').bind('change input', cpaint.widthSlider).trigger('change');
    
    
  // Filters
  $('#blur').bind('click', cpaint.blur);
  $('#sharpen').bind('click', cpaint.sharpen);
  $('#edgeDetect').bind('click', cpaint.edgeDetect);
}

cpaint.blur = function () {
    cpaint.convolutionKernel(
    [
        [1,4,7,4,1],
        [4,16,26,16,4],
        [7,26,41,26,7],
        [4,16,26,16,4],
        [1,4,7,4,1],
    ].map((row) => row.map((v) => v/271))
    );
}

cpaint.sharpen = function () {
    cpaint.convolutionKernel(
    [
        [-2, -2, -2],
        [-2, 18, -2],
        [-2, -2, -2],
    ].map(row => row.map(v => v/1))
    );
}

cpaint.edgeDetect = function () {
    cpaint.convolutionKernel(
    [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
    ]
    );
}

cpaint.convolutionKernel = function(convMatrix) { // kernels must be odd
    console.log(convMatrix);
    let imageData = cpaint.cx.getImageData(0,0, cpaint.canvas.width, cpaint.canvas.height);
    let newImageData = cpaint.cx.createImageData(imageData.width, imageData.height);
    
    let getPixelComponentIndex = function(x,y,component) {
        return component+x*4+y*newImageData.width*4;
    }
    
    for (let y=0; y < newImageData.height; y++) {
        for (let x=0; x < newImageData.width; x++) {
            // Set opaque
            newImageData.data[getPixelComponentIndex(x, y, 3)] = 255;
            for (let c=0; c < 3; c++) { // r g b a
                let acc = 0;
                for (let mx=0; mx < convMatrix[0].length; mx++) {
                    for (let my=0; my <convMatrix.length; my++) {
                        let sourceX = -(convMatrix[0].length-1)/2 + x + mx;
                        let sourceY = -(convMatrix.length-1)/2 + y + my;
                        //console.log(sourceX, sourceY);
                        sourceX = Math.min(Math.max(0, sourceX), newImageData.width-1);
                        sourceY = Math.min(Math.max(0, sourceY), newImageData.height-1);
                        let pxIndex = getPixelComponentIndex(sourceX, sourceY, c);
                        //console.log(sourceX, sourceY, pxIndex, imageData.data[pxIndex]);
                        acc += convMatrix[my][mx] * imageData.data[pxIndex];
                    }
                }
                let newPxIndex = getPixelComponentIndex(x, y, c);
                //console.log(c, acc, Math.min(Math.max(acc|0,0), 255));
                newImageData.data[newPxIndex] = Math.min(Math.max(acc|0,0), 255);
            }
        }
    }
    cpaint.imgData = newImageData;
    cpaint.cx.putImageData(cpaint.imgData, 0, 0);
}



cpaint.widthSlider = function(ev) {
    cpaint.lineThickness = this.value;
    let spotPos = cpaint.canvas2.width/2;
    cpaint.cx2.strokeStyle = '#000000';
    cpaint.cx2.clearRect(0, 0, cpaint.canvas.width, cpaint.canvas.height);
    
    cpaint.cx2.lineWidth = cpaint.lineThickness;
    cpaint.drawLine(spotPos,spotPos,spotPos,spotPos, cpaint.cx2);
}


cpaint.selectTool = function(ev) {
  cpaint.tool = ev.data.tool;         // get tool name

  $('.toolbarCell').each(function(index) { // unselect 
    $(this).removeClass('selected');       // others
  });

  var tool = '#' + cpaint.tool + 'Button'; // get ID
  $(tool).addClass('selected');            // select 
}


/*
 * handle mousedown events
 */
cpaint.drawStart = function(ev) {
    
  cpaint.x = ev.pageX - $(cpaint.canvas).offset().left;
  cpaint.y = ev.pageY - $(cpaint.canvas).offset().top;
  ev.preventDefault();
    
  cpaint.drawing = true;
    
  switch(cpaint.tool) {
      case 'marker':
          cpaint.markerStart();
          break;
      case 'line':
          cpaint.lineStart();
          break;
      case 'rect':
          cpaint.rectStart();
          break;
      case 'eraser':
          cpaint.eraserStart();
          break;
  }
}

/*
 * handle mouseup events
 */
cpaint.drawEnd = function(ev) {
  cpaint.drawing = false;
}

/*
 * handle mousemove events
 */
cpaint.draw = function(ev) {
  if (!cpaint.drawing) {
      return;
  }
    
  cpaint.x = ev.pageX - $(cpaint.canvas).offset().left;
  cpaint.y = ev.pageY - $(cpaint.canvas).offset().top;
  ev.preventDefault();
    
  switch(cpaint.tool) {
      case 'marker':
          cpaint.marker();
          break;
      case 'line':
          cpaint.line();
          break;
      case 'rect':
          cpaint.rect();
          break;
      case 'eraser':
          cpaint.eraser();
          break;  
  }
  cpaint.oldX = cpaint.x;
  cpaint.oldY = cpaint.y;
} 

cpaint.drawLine = function (beginX, beginY, endX, endY, cx=cpaint.cx) {
    cx.beginPath();			// draw initial stroke
    cx.moveTo(beginX,beginY);
    cx.lineTo(endX,endY);
    cx.lineCap = 'round';
    cx.stroke();
}


// Marker
cpaint.markerStart = function(color=null) {
  cpaint.oldX = cpaint.x;
  cpaint.oldY = cpaint.y;
  cpaint.cx.lineWidth = cpaint.lineThickness;
  cpaint.cx.strokeStyle = color?color:cpaint.color;
  
  cpaint.marker();
}

cpaint.marker = function() {
    cpaint.drawLine(cpaint.oldX, cpaint.oldY, cpaint.x, cpaint.y);
}


// Eraser uses marker and just changes the color.
cpaint.eraserStart = function () {
    cpaint.markerStart('#ffffff');
}

cpaint.eraser = function() {
    cpaint.marker();
}

// Line
cpaint.lineStart = function() {
   cpaint.createObject();
   cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  						// save drawing window contents
   cpaint.markerStart();
}

cpaint.line = function() {
    cpaint.newObject.endPos = {x: cpaint.x, y: cpaint.y};
    // save the image and draw the line.
    cpaint.cx.putImageData(cpaint.imgData, 0, 0);
    cpaint.drawLine(cpaint.newObject.startPos.x, cpaint.newObject.startPos.y,
                   cpaint.newObject.endPos.x, cpaint.newObject.endPos.y);
}

// Rect
cpaint.rectStart = function() {
    cpaint.createObject();
    cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
    cpaint.cx.strokeStyle = cpaint.color;
    cpaint.cx.fillStyle = cpaint.color;
    cpaint.cx.lineWidth = 1;
    
    cpaint.rect();
}

cpaint.rect = function() {
    cpaint.newObject.endPos = {x: cpaint.x, y: cpaint.y};
    cpaint.cx.putImageData(cpaint.imgData, 0, 0);
    
    //console.log(cpaint.newObject);
    cpaint.cx.beginPath();
    cpaint.cx.rect(cpaint.newObject.startPos.x, cpaint.newObject.startPos.y, 
                   cpaint.newObject.endPos.x - cpaint.newObject.startPos.x ,
                   cpaint.newObject.endPos.y - cpaint.newObject.startPos.y);
    cpaint.cx.fill();
    cpaint.cx.stroke();
}

cpaint.createObject = function () {
    cpaint.newObject = {};
    cpaint.newObject.startPos = {x: cpaint.x, y: cpaint.y};
    cpaint.newObject.endPos = {x: cpaint.x, y: cpaint.y};
}


/*
 * clear the canvas, offscreen buffer, and message box
 */
cpaint.clear = function(ev) {
  cpaint.cx.clearRect(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  $('#messages').html("");
}  

/*
 * color picker widget handler
 */
cpaint.colorChange = function(ev) {
  $('#messages').prepend("Color: " + $('#color1').val() + "<br>");
  cpaint.color = $('#color1').val();
}


/*
 * handle open menu item by making open dialog visible
 */
cpaint.open = function(ev) { 
  $('#fileInput').show();
  $('#file1').bind('change submit',cpaint.loadFile);
  $('#closeBox1').bind('click',cpaint.closeDialog);
  $('#messages').prepend("In open<br>");	
}

/*
 * load the image whose URL has been typed in
 * (this should have some error handling)
 */
cpaint.loadFile = function() {
  $('#fileInput').hide();
  $('#messages').prepend("In loadFile<br>");	
  var img = document.createElement('img');
  var file1 = $("#file1").val();
  $('#messages').prepend("Loading image " + file1 + "<br>");	

  img.src=file1;
  img.onload = function() {
    cpaint.cx.clearRect(0, 0, cpaint.canvas.width, cpaint.canvas.height);
    cpaint.cx.drawImage(img,0, 0, cpaint.canvas.width, cpaint.canvas.height);
  }
}

cpaint.closeDialog = function() {
  $('#fileInput').hide();
}

/*
 * to save a drawing, copy it into an image element
 * which can be right-clicked and save-ased
 */
cpaint.save = function(ev) {
  $('#messages').prepend("Saving...<br>");	
  var dataURL = cpaint.canvas.toDataURL();
  if (dataURL) {
    $('#saveWindow').show();
    $('#saveImg').attr('src',dataURL);
    $('#closeBox2').bind('click',cpaint.closeSaveWindow);
  } else {
    alert("Your browser doesn't implement the toDataURL() method needed to save images.");
  }
}

cpaint.closeSaveWindow = function() {
  $('#saveWindow').hide();
}

/*
 * Fade/unfade an image by altering Alpha of each pixel
 */
cpaint.fade = function(ev) {
  $('#messages').prepend("Fade<br>");	
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  var pix = cpaint.imgData.data;
  for (var i=0; i<pix.length; i += 4) {
    pix[i+3] /= 2;		// reduce alpha of each pixel
  }
  cpaint.cx.putImageData(cpaint.imgData, 0, 0);
}

cpaint.unfade = function(ev) {
  $('#messages').prepend("Unfade<br>");	
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  var pix = cpaint.imgData.data;
  for (var i=0; i<pix.length; i += 4) {
    pix[i+3] *= 2;		// increase alpha of each pixel
  }
  cpaint.cx.putImageData(cpaint.imgData, 0, 0);
}
