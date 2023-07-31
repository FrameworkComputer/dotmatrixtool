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

let matrices = {
  'Left': null,
  'Right': null,
};
var $table;
var rowMajor = false;
var msbendian = false;
let ports = {
  'Left': null,
  'Right': null,
};
let port;

$(function() {
  matrices['Left'] = createArray(HEIGHT, WIDTH);
  matrices['Right'] = createArray(HEIGHT, WIDTH);
  updateTable('Left');
  updateTable('Right');
  initOptions();
});

function updateTable(pos) {
  if (pos === 'Left') {
    $('#_grid_left').html('');
    $('#_grid_left').append(populateTable(null, HEIGHT, WIDTH, ""));

    // events
    $table.on("mousedown", "td", toggleLeft);
      $table.on("mouseenter", "td", toggleLeft);
      $table.on("dragstart", function() { return false; });
  } else if (pos === 'Right') {
    $('#_grid_right').html('');
    $('#_grid_right').append(populateTable(null, HEIGHT, WIDTH, ""));

    // events
    $table.on("mousedown", "td", toggleRight);
    $table.on("mouseenter", "td", toggleRight);
    $table.on("dragstart", function() { return false; });
  }
}

function initOptions() {
	$('#clearLeftBtn').click(function() { matrices['Left'] = createArray(HEIGHT, WIDTH); updateTable('Left'); });
	$('#clearRightBtn').click(function() { matrices['Right'] = createArray(HEIGHT, WIDTH); updateTable('Right'); });
	$('#connectLeftBtn').click(connectSerial);
	//$('#sendButton').click(sendToDisplay);
  $(document).on('input change', '#brightnessRange', function() {
  //$('#brightnessRange').change(function() {
    let brightness = $(this).val();
    //console.log("Brightness:", brightness);
    command(port, BRIGHTNESS_CMD, brightness);
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

async function checkFirmwareVersion() {
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
  $('#fw-version').html(fw_str);

  // Allow the serial port to be closed later.
  reader.releaseLock();
}

function prepareValsForDrawing(pos) {
  let vals = new Array(HEIGHT).fill(0);

  for (let col = 0; col < WIDTH; col++) {
    for (let row = 0; row < HEIGHT; row++) {
      const cell = matrices[pos][row][col];
      if (cell == 0) {
        const i = col + row * WIDTH;
        vals[Math.trunc(i/8)] |= 1 << i % 8;
      }
    }
  }
  return vals;
}

async function sendToDisplay(pos) {
  let vals = prepareValsForDrawing(pos);
  console.log("Send bytes:", vals);
  command(port, DRAW_CMD, vals);
}

async function connectSerial() {
  port = await navigator.serial.requestPort();

  const { usbProductId, usbVendorId } = port.getInfo();
  console.log(`Selected`, port);
  console.log(`VID:PID ${usbVendorId}:${usbProductId}`);

  if (port.readable === null || port.writeable === null) {
    console.log("Opening port");
    await port.open({ baudRate: 115200 });
  }

  await checkFirmwareVersion();
}

function toggleLeft(e) {
  return toggle($(this), e, 'Left');
}
function toggleRight(e) {
  return toggle($(this), e, 'Right');
}

function toggle(that, e, pos) {
	var x = that.data('i');
	var y = that.data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrices[pos][x][y] = 0;
		that.addClass('off');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrices[pos][x][y] = 1;
		that.removeClass('off');	
	}

  if (port) {
    sendToDisplay(pos);
  }

	return false;
}

function populateTable(table, rows, cells, content) {
    if (!table) table = document.createElement('table');
    for (var i = 0; i < rows; ++i) {
        var row = document.createElement('tr');
        for (var j = 0; j < cells; ++j) {
            row.appendChild(document.createElement('td'));
            $(row.cells[j]).data('i', i);
            $(row.cells[j]).data('j', j);
        }
        table.appendChild(row);        
    }
    $table = $(table);
    return table;
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
