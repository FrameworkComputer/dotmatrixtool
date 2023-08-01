const BRIGHTNESS_CMD = 0x00;
const PATTERN_CMD = 0x01;
const BOOTLOADER_CMD = 0x02;
const SLEEP_CMD = 0x03;
const ANIMATE_CMD = 0x04;
const PANIC_CMD = 0x05;
const DRAW_CMD = 0x06;
const STAGE_GREY_COL_CMD = 0x07;
const DrawGreyColBuffer = 0x08;
const SetText = 0x09;
const StartGame = 0x10;
const GameControl = 0x11;
const GameStatus = 0x12;
const SetColor = 0x13;
const DisplayOn = 0x14;
const InvertScreen = 0x15;
const SetPixelColumn = 0x16;
const FlushFramebuffer = 0x17;
const VERSION_CMD = 0x20;

const WIDTH = 9;
const HEIGHT = 34;

const PATTERNS = [
  'Custom',
  'Blank',
  'Full',
  'Checkerboard',
  'Double Checkerboard',
  'Every 2nd Row',
  'Every 3rd Row',
  'Every 2nd Col',
  'Every 3rd Col',
];

var matrix_left;
var matrix_right;
var $table_left;
var $table_right;
var rowMajor = false;
var msbendian = false;
let portLeft = null;
let portRight = null;
let swap = false;

$(function() {
  matrix_left = createArray(34, 9);
  matrix_right = createArray(34, 9);
  updateTableLeft();
  updateTableRight();
  initOptions();

  for (pattern of PATTERNS) {
    $("#select-left").append(`<option value="${pattern}">${pattern}</option>`);
    $("#select-left").on("change", async function() {
      if (pattern == 'Custom') return;
      drawPattern(matrix_left, $(this).val(), 'left');
      await sendToDisplay(true);
    });

    $("#select-right").append(`<option value="${pattern}">${pattern}</option>`);
    $("#select-right").on("change", async function() {
      if (pattern == 'Custom') return;
      drawPattern(matrix_right, $(this).val(), 'right');
      await sendToDisplay(true);
    });
  }
});

function drawPattern(matrix, pattern, pos) {
  for (let col = 0; col < WIDTH; col++) {
    for (let row = 0; row < HEIGHT; row++) {
      if (pattern == 'Blank') {
        matrix[row][col] = 1;
      } else if (pattern == 'Full') {
        matrix[row][col] = 0;
      } else if (pattern == 'Checkerboard') {
        if (row % 2 == 0)
          matrix[row][col] = col % 2 == 0;
        else
          matrix[row][col] = (col+1) % 2 == 0;
      } else if (pattern == 'Double Checkerboard') {
        if (row % 4 < 2)
          matrix[row][col] = (col+2) % 4 < 2;
        else
          matrix[row][col] = (col) % 4 < 2;
      } else if (pattern == 'Every 2nd Row') {
          matrix[row][col] = row % 2 != 0;
      } else if (pattern == 'Every 3rd Row') {
          matrix[row][col] = row % 3 != 0;
      } else if (pattern == 'Every 2nd Col') {
          matrix[row][col] = col % 2 != 0;
      } else if (pattern == 'Every 3rd Col') {
          matrix[row][col] = col % 3 != 0;
      }
    }
  }
  updateMatrix(matrix, pos);
}

function updateMatrix(matrix, pos) {
  for (let col = 0; col < WIDTH; col++) {
    for (let row = 0; row < HEIGHT; row++) {
      let foo = $(`#${pos}-${row}-${col}`);
      if (matrix[row][col]) {
        foo.removeClass('off');
      } else {
        foo.addClass('off');
      }
    }
  }
}

function updateTableLeft() {
	var width = matrix_left[0].length;
	var height = matrix_left.length;

  $table_left = populateTable(null, height, width, "left");
	$('#_grid_left').html('');
	$('#_grid_left').append($table_left);

	// events
	$table_left.on("mousedown", "td", toggleLeft);
    $table_left.on("mouseenter", "td", toggleLeft);
    $table_left.on("dragstart", function() { return false; });
}

function updateTableRight() {
	var width = matrix_right[0].length;
	var height = matrix_right.length;

  $table_right = populateTable(null, height, width, "right");
	$('#_grid_right').html('');
	$('#_grid_right').append($table_right);

	// events
	$table_right.on("mousedown", "td", toggleRight);
  $table_right.on("mouseenter", "td", toggleRight);
  $table_right.on("dragstart", function() { return false; });
}

function initOptions() {
	$('#clearLeftBtn').click(function() {
    matrix_left = createArray(matrix_left.length, matrix_left[0].length);
    updateTableLeft();
    sendToDisplay(true);
  });
	$('#clearRightBtn').click(function() {
    matrix_right = createArray(matrix_right.length, matrix_right[0].length);
    updateTableRight();
    sendToDisplay(true);
  });
	$('#connectLeftBtn').click(connectSerialLeft);
	$('#connectRightBtn').click(connectSerialRight);
	$('#swapBtn').click(async function() {
    swap = !swap;
    await sendToDisplay(true);
  });
	//$('#sendButton').click(sendToDisplay);
  $(document).on('input change', '#brightnessRange', function() {
  //$('#brightnessRange').change(function() {
    let brightness = $(this).val();
    //console.log("Brightness:", brightness);
    command(portLeft, BRIGHTNESS_CMD, brightness);
    command(portRight, BRIGHTNESS_CMD, brightness);
  });
}

async function command(port, id, params) {
  const writer = port.writable.getWriter();

  let bytes = [0x32, 0xAC];
  bytes = bytes.concat([id]);
  bytes = bytes.concat(params);
  console.log('Params:', bytes);

  const data = new Uint8Array(bytes);
  await writer.write(data);

  // Allow the serial port to be closed later.
  writer.releaseLock();
}

async function checkFirmwareVersion(port, side) {
  const id = 0x20;
  const params = [];

  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();

  let bytes = [0x32, 0xAC];
  bytes = bytes.concat([id]);
  bytes = bytes.concat(params);
  console.log('Params:', bytes);

  const data = new Uint8Array(bytes);
  await writer.write(data);
  // Allow the serial port to be closed later.
  writer.releaseLock();

  const { value, done } = await reader.read();
  // Attention: Seems the variable name `value` cannot be changed!
  const response = value;
  console.log(`Done: ${done} Response:`, response);

  const major = response[0];
  const minor = (response[1] & 0xF0) >> 4;
  const patch = response[1] & 0x0F;
  const pre_release = response[2] == 1;

  const fw_str = `Connected!<br>Device FW Version: ${major}.${minor}.${patch} Pre-release: ${pre_release}`;
  console.log(fw_str);
  $(`#fw-version-${side}`).html(fw_str);

  // Allow the serial port to be closed later.
  reader.releaseLock();
}

function prepareValsForDrawingLeft() {
	const width = matrix_left[0].length;
	const height = matrix_left.length;

  let vals = new Array(39).fill(0);

  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      const cell = matrix_left[row][col];
      if (cell == 0) {
        const i = col + row * width;
        vals[Math.trunc(i/8)] |= 1 << i % 8;
      }
    }
  }
  return vals;
}

function prepareValsForDrawingRight() {
	const width = matrix_right[0].length;
	const height = matrix_right.length;

  let vals = new Array(39).fill(0);

  for (let col = 0; col < width; col++) {
    for (let row = 0; row < height; row++) {
      const cell = matrix_right[row][col];
      if (cell == 0) {
        const i = col + row * width;
        vals[Math.trunc(i/8)] |= 1 << i % 8;
      }
    }
  }
  return vals;
}


async function sendToDisplay(recurse) {
    await sendToDisplayLeft(recurse);
    await sendToDisplayRight(recurse);
}

async function sendToDisplayLeft(recurse) {
  if (portLeft === null) return;

  let vals = prepareValsForDrawingLeft();
  if (swap) {
    console.log('swapped left to right');
    vals = prepareValsForDrawingRight();
  }
  console.log("Send bytes left:", vals);
  await command(portLeft, DRAW_CMD, vals);
}
async function sendToDisplayRight(recurse) {
  if (portRight === null) return;
  let vals = prepareValsForDrawingRight();
  if (swap) {
    console.log('swapped right to left');
    vals = prepareValsForDrawingLeft();
  }
  console.log("Send bytes right:", vals);
  await command(portRight, DRAW_CMD, vals);
}

async function connectSerialLeft() {
  portLeft = await navigator.serial.requestPort();

  const { usbProductId, usbVendorId } = portLeft.getInfo();
  console.log(`Selected`, portLeft);
  console.log(`VID:PID ${usbVendorId}:${usbProductId}`);

  if (portLeft.readable === null || portLeft.writeable === null) {
    console.log("Opening portLeft");
    await portLeft.open({ baudRate: 115200 });
  }

  await checkFirmwareVersion(portLeft, 'left');
}

async function connectSerialRight() {
  portRight = await navigator.serial.requestPort();

  const { usbProductId, usbVendorId } = portRight.getInfo();
  console.log(`Selected`, portRight);
  console.log(`VID:PID ${usbVendorId}:${usbProductId}`);

  if (portRight.readable === null || portRight.writeable === null) {
    console.log("Opening portRight");
    await portRight.open({ baudRate: 115200 });
  }

  await checkFirmwareVersion(portRight, 'right');
}

function toggleLeft(e) {
	var x = $(this).data('i');
	var y = $(this).data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrix_left[x][y] = 0;
		$(this).addClass('off');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrix_left[x][y] = 1;
		$(this).removeClass('off');	
	}

  sendToDisplay(true);

	return false;
}

function toggleRight(e) {
	var x = $(this).data('i');
	var y = $(this).data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrix_right[x][y] = 0;
		$(this).addClass('off');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrix_right[x][y] = 1;
		$(this).removeClass('off');	
	}

  sendToDisplay(true);

	return false;
}

function populateTable(table, rows, cells, pos) {
    if (!table) table = document.createElement('table');
    for (var i = 0; i < rows; ++i) {
        var row = document.createElement('tr');
        for (var j = 0; j < cells; ++j) {
            row.appendChild(document.createElement('td'));
            $(row.cells[j]).data('i', i);
            $(row.cells[j]).data('j', j);
            $(row.cells[j]).attr('id', `${pos}-${i}-${j}`);
        }
        table.appendChild(row);        
    }
    return $(table);
}

// (height, width)
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}
