/*** FIRMWARE CONFIG ***/

// Layer selector.
$('#config-layer-value').change(function() {
	// Get and clamp the value.
	var value = $(this).val();
	if (isNaN(value)) value = 0;
	value = Math.min(Math.max(value, 0), 7);

	// Set the value to the clamped value.
	$(this).val(value);

	// Set the active layer.
	_activeLayer = value;

	// Redraw the keyboard.
	drawKeys();

	// If a key is selected, reload the config.
	if (_activeId !== undefined) loadFirmwareConfig();
});

// Clear Key button.
$('#config-key-clear').click(function() {
	// Set the active key to TRNS.
	setKeycode('TRNS');
});

// Macro selector.
$('#config-macro-value').change(function() {
	// Get and clamp the value.
	var value = $(this).val();
	if (isNaN(value)) value = 0;
	value = Math.min(Math.max(value, 0), 7);

	// Set the value to the clamped value.
	$(this).val(value);

	// Set the active macro.
	_activeMacro = value;

	// Update the macro list.
	loadMacroConfig();
});

// Cancel macro button.
$('#config-macro-cancel').click(function() {
	// Set all macro action buttons to active.
	$('.config-macro-btn').addClass('active');

	// Hide the selector.
	$('.config-macro-selector').hide();
});

// Downstroke button.
$('#config-macro-d').click(function() {
	// Set the macro mode.
	_macroMode = MACRO_DOWN;

	// Show the selector.
	$('.config-macro-selector').show();
});

// Keystroke button.
$('#config-macro-t').click(function() {
	// Set the macro mode.
	_macroMode = MACRO_TYPE;

	// Show the selector.
	$('.config-macro-selector').show();
});

// Upstroke button.
$('#config-macro-u').click(function() {
	// Set the macro mode.
	_macroMode = MACRO_UP;

	// Show the selector.
	$('.config-macro-selector').show();
});

// Delay button.
$('#config-macro-w').click(function() {
	// Add the action to the macro.
	_keyboard.macros[_activeMacro].push(['W', 100]);

	// Re-enable all buttons.
	$('.config-macro-btn').addClass('active');

	// Redraw the macro list.
	loadMacroConfig();
});

// Clear macro button.
$('#config-macro-clear').click(function() {
	// Clear the current macro.
	_keyboard.macros[_activeMacro] = [];

	// Redraw the macro.
	loadMacroConfig();
});

// Record macro button.
$('#config-macro-record').click(function() {
	// Lose focus.
	$('#config-macro-record').blur();

	// Check if currently recording.
	if (_recording) {
		// Stop recording.
		stopRecording();
	} else {
		// Start recording.
		startRecording();
	}
});

/*
 * Load the firmware config.
 */
function loadFirmwareConfig() {
	if (_activeId !== undefined) {
		// Show the panel.
		$('.config-key').show();

		// Get the current keycode.
		var currentCode = _keyboard.keys[_activeId].codes[_activeLayer];

		// Set the active button.
		$('.config-key .config-key-btn').removeClass('active');
		$('.config-key .config-key-btn').each(function() {
			var value = $(this).text();
			for (var i in SYMBOLS) {
				if (value == i) value = SYMBOLS[i];
			}
			if (currentCode == value) {
				$(this).addClass('active');
			}
		});

		// Set the keycode field.
		$('.config-key .config-key-field').val(currentCode);
	} else {
		// Hide the panel.
		$('.config-key').hide();
	}
}

/*
 * Hide all firmware config items.
 */
function hideFirmwareMode() {
	$('.config-key').hide();
	$('.config-layer').hide();
	$('.config-macro').hide();
	$('.key-inner').text('');
}

/*
 * Draws key values on every key.
 */
function drawKeys() {
	// Iterate through all the keys.
	for (var i in _keys) {
		var keyElement = _keys[i];
		var key = _keyboard.keys[i];

		// Get the value.
		var value = key.codes[_activeLayer];

		// Special values.
		for (var i in SYMBOLS) {
			if (SYMBOLS[i] == value) value = i;
		}

		// Set the key value.
		keyElement.find('.key-inner').text(value);
	}
}

/*
 * Sets the keycode of the active key.
 *
 * @param keycode The keycode to set.
 */
function setKeycode(code) {
	// Set the code.
	_keyboard.keys[_activeId].codes[_activeLayer] = getKeyValue(code);

	// Redraw the keys.
	drawKeys();

	// Reload the config panel.
	loadFirmwareConfig();
}

/*
 * Assigns a keycode based on a keypress.
 *
 * @param e The event keypress event that occurred.
 */
function assignKeyPress(e) {
	// If there is no active key, do nothing.
	if (_activeId == undefined) return;

	// Prevent the keypress from doing anything.
	e.preventDefault();

	// Get the keycode.
	var code = KEYCODES[e.which];
	if (code === undefined) return;
	if (code == 'CTL' || code == 'SFT' || code == 'ALT') {
		// Assign a side to these keys.
		if (_keyboard.keys[_activeId].col < _keyboard.cols / 2) {
			code = 'L' + code;
		} else {
			code = 'R' + code;
		}
	}

	// Assign the keycode.
	setKeycode(code);

	// Deactivate keyboard input.
	_keyboardInput = false;
	$('.active2').removeClass('active2');
}

/*
 * Gets the closest match to a valid key.
 *
 * @param value The raw value.
 *
 * @return The best guess for the keycode value.
 */
function getKeyValue(value) {
	// Capitalize the value.
	value = value.toUpperCase();

	// Special values.
	for (var i in SYMBOLS) {
		if (value == i) return SYMBOLS[i];
	}

	// Other special values.
	if (value == 'SHIFT') value = 'LSFT';
	if (value == 'WIN') value = 'LGUI';

	// Keep track of which key is closest and by how much.
	var closest = '';
	var closestDist = -1;

	// Iterate through all the valid keys.
	var distance;
	for (var i in KEYS) {
		// Set the key to the closest if it is closer.
		if ((distance = value.levenstein(KEYS[i])) < closestDist || closestDist == -1) {
			closest = KEYS[i];
			closestDist = distance;
		}
	}

	// If the closest value is NO, then return TRNS.
	if (closest == 'NO') closest = 'TRNS';

	// Return the closest value.
	return closest;
}

/*
 * Loads the macro config.
 */
function loadMacroConfig() {
	// Clear the macro list.
	$('#config-macro-list').find('.config-macro-entry').remove();

	// Hide the empty message.
	$('.config-macro-list-empty').hide();

	// Get the macro.
	var macro = _keyboard.macros[_activeMacro];

	// Iterate through all the actions.
	for (var i in macro) {
		var action = macro[i];

		// Create the macro action entry.
		var entry = $('<div class="config-macro-entry"></div>');

		// Set the action text.
		if (action[0] == MACRO_DOWN) {
			entry.append('Press ');
		}
		if (action[0] == MACRO_TYPE) {
			entry.append('Type ');
		}
		if (action[0] == MACRO_UP) {
			entry.append('Release ');
		}
		if (action[0] == MACRO_WAIT) {
			entry.append('Wait ');
		}

		// Set the action key.
		var value = action[1];
		for (var j in SYMBOLS) {
			if (SYMBOLS[j] == value) value = j;
		}
		entry.append('<span>' + value + '</span>');
		if (action[0] == MACRO_WAIT) entry.append(' milliseconds');

		// Add the movement buttons.
		var downButton = $('<button class="config-macro-down light"><i class="fa fa-chevron-down"></i></button>');
		var upButton = $('<button class="config-macro-up light"><i class="fa fa-chevron-up"></i></button>');
		downButton.click(function() {
			var macro = _keyboard.macros[_activeMacro];
			// Move the entry down.
			if (this.index < macro.length - 1) {
				macro.splice(this.index + 1, 0, macro.splice(this.index, 1)[0]);

				// Redraw the list.
				loadMacroConfig();
			}
		}.bind({ index: i }));
		upButton.click(function() {
			var macro = _keyboard.macros[_activeMacro];
			// Move the entry up.
			if (this.index > 0) {
				macro.splice(this.index - 1, 0, macro.splice(this.index, 1)[0]);

				// Redraw the list.
				loadMacroConfig();
			}
		}.bind({ index: i }));
		entry.append(downButton);
		entry.append(upButton);

		// Add the remove button.
		var remove = $('<div class="config-macro-remove">&times;</div>');
		remove.click(function() {
			// Remove the action from the macro.
			_keyboard.macros[_activeMacro].splice(this.index, 1);

			// Redraw the list.
			loadMacroConfig();
		}.bind({ index: i }));
		entry.append(remove);

		// Append the entry.
		$('#config-macro-list').append(entry);
	}

	// If there are no entries, show the empty message.
	if (macro.length == 0) $('.config-macro-list-empty').show();
}

/*
 * Adds a macro action.
 *
 * @param keycode The keycode corresponding to this action.
 */
function addMacroAction(keycode) {
	// Add the action to the macro.
	_keyboard.macros[_activeMacro].push([_macroMode, getKeyValue(keycode)]);

	// Redraw the macro list.
	loadMacroConfig();

	// Hide the selector.
	$('#config-macro-cancel').click();
}

/*
 * Start recording a macro.
 */
function startRecording() {
	_recording = true;
	_recordingMacro = [];
	$('#config-macro-record').addClass('recording');
	$('#config-macro-record').text('Stop Recording');
}

/*
 * Stop recording a macro.
 */
function stopRecording() {
	_recording = false;
	$('#config-macro-record').removeClass('recording');
	$('#config-macro-record').text('Record Macro');

	// Set the current macro to be the recorded macro.
	_keyboard.macros[_activeMacro] = JSON.parse(JSON.stringify(_recordingMacro));

	// Redraw the macro.
	loadMacroConfig();
}

/*
 * Record a key down.
 *
 * @param e The key event.
 */
function recordMacroDown(e) {
	// Get the code.
	var code = KEYCODES[e.which];
	if (code === undefined) return;
	if (code == 'CTL' || code == 'SFT' || code == 'ALT') {
		// Assume left, since there is no way of telling.
		code = 'L' + code;
	}

	// Add the action to the recording macro.
	_recordingMacro.push(['D', code]);
}

/*
 * Record a key up.
 *
 * @param e The key event.
 */
function recordMacroUp(e) {
	// Get the code.
	var code = KEYCODES[e.which];
	if (code === undefined) return;
	if (code == 'CTL' || code == 'SFT' || code == 'ALT') {
		// Assume left, since there is no way of telling.
		code = 'L' + code;
	}

	// Check if the previous action was a down on the same key.
	var prevAction = _recordingMacro[_recordingMacro.length - 1];
	if (prevAction[0] == 'D' && prevAction[1] == code) {
		// Replace the previous action with a type action.
		prevAction[0] = 'T';
	} else {
		// Add the action to the recording macro.
		_recordingMacro.push(['U', code]);
	}
}
