var matrix;
var $table;
var rowMajor = false;
var msbendian = false;

$(function() {
  	matrix = createArray(34, 9);
  	updateTable();
	initOptions();

	$('#_output').hide();
});

function updateTable() {
	var width = matrix[0].length;
	var height = matrix.length;

	$('#_grid').html('');
	$('#_grid').append(populateTable(null, height, width, ""));

	// events
	$table.on("mousedown", "td", toggle);
    $table.on("mouseenter", "td", toggle);
    $table.on("dragstart", function() { return false; });
}

function initOptions() {
	$('#clearButton').click(function() { matrix = createArray(matrix.length,matrix[0].length); updateTable(); $('#_output').hide(); });
	$('#generateButton').click(updateCode);

	 $('#widthDropDiv li a').click(function () {
	 	var width = parseInt($(this).html());
	 	var height = matrix.length;
        matrix = createArray(height, width);
        updateTable();
        updateSummary();
     });

     $('#heightDropDiv li a').click(function () {
	 	var width = matrix[0].length;
	 	var height = parseInt($(this).html());
        matrix = createArray(height, width);
        updateTable();
        updateSummary();
     });

     $('#byteDropDiv li a').click(function () {
	 	var selection = $(this).html();
        rowMajor = selection.startsWith("Row");  
        updateSummary();      	
     });

     $('#endianDropDiv li a').click(function () {
	 	var selection = $(this).html();
        msbendian = selection.startsWith("Big");  
        updateSummary();      	
     });

     updateSummary();
}

function updateSummary() {
	var width = matrix[0].length;
	var height = matrix.length;
	var summary = width + "px by " + height + "px, ";

	if (rowMajor) summary += "row major, ";
	else summary += "column major, ";

	if (msbendian) summary += "big endian.";
	else summary += "little endian.";

	$('#_summary').html(summary);
}

function updateCode() {
	$('#_output').show();
	var bytes = generateByteArray();
	var output = "let grid: Grid = [\n" + bytes + "\n];"
	$('#_output').html(output);
	$('#_output').removeClass('prettyprinted');
	prettyPrint();
}

function generateByteArray() {
	var width = matrix[0].length;
	var height = matrix.length;
	var buffer = new Array(width * height);

  let formatted = "";

  for (let col = width-1; col >= 0; col--) {
    formatted += `  [ `;
    //console.log(`cols: ${row.length}`)
    for (let row = 0; row < height; row++) {
      const cell = matrix[row][col];
      if (cell == 1) {
        formatted += '0xFF'
      } else {
        formatted += '0x00'
      }
      if (row+1 !=height) {
        formatted +=',';
      }
    }
    formatted += ']'
    if (col!=0) {
      formatted += ',\n';
    }
  }

	return formatted;
}

function toggle(e) {
	var x = $(this).data('i');
	var y = $(this).data('j');

	if (e.buttons == 1 && !e.ctrlKey) {
		matrix[x][y] = 1;
		$(this).addClass('on');		
	}
	else if (e.buttons == 2 || (e.buttons == 1 && e.ctrlKey)) {			
		matrix[x][y] = 0;
		$(this).removeClass('on');	
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
