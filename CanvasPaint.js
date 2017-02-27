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
  lineThickness: 	12,
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
  $('#widthSlider').bind('')

  // bind menu options
  $('#menuClear').bind('click', cpaint.clear);
  $('#menuNew').bind('click', cpaint.clear);
  $('#clearButton').bind('click', cpaint.clear);
  $('#menuFade').bind('click', cpaint.fade);
  $('#menuUnfade').bind('click', cpaint.unfade);
  $('#menuOpen').bind('click',cpaint.open);
  $('#menuSave').bind('click',cpaint.save);
  $('#toolBar').show();		// when toolbar is initialized, make it visible
    
  cpaint.x = 0;
  cpaint.y = 0;
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
  var x, y; 				// convert event coords to (0,0) at top left of canvas
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


cpaint.markerStart = function() {
  cpaint.drawing = true;			// go into drawing mode
  cpaint.oldX = cpaint.x;
  cpaint.oldY = cpaint.y;
  cpaint.cx.lineWidth = cpaint.lineThickness;
  cpaint.cx.strokeStyle = cpaint.color;
  cpaint.imgData = cpaint.cx.getImageData(0, 0, cpaint.canvas.width, cpaint.canvas.height);
  						// save drawing window contents
  cpaint.cx.beginPath();			// draw initial point
  cpaint.cx.moveTo(cpaint.x-1,cpaint.y-1);
  cpaint.cx.lineTo(cpaint.x,cpaint.y);
  cpaint.cx.stroke();
}

cpaint.marker = function() {
  if (cpaint.drawing) {
    cpaint.cx.beginPath();			// draw initial stroke
    cpaint.cx.moveTo(cpaint.oldX,cpaint.oldY);
    cpaint.cx.lineTo(cpaint.x,cpaint.y);
    cpaint.cx.lineCap = 'round';
    cpaint.cx.stroke();
  }
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
