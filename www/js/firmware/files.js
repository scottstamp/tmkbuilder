/*
 * Generate keymap_common.h.
 *
 * @return The generated keymap_common.h file.
 */
function generateKeymapCommonH() {
	var file = `#ifndef KEYMAP_COMMON_H
#define KEYMAP_COMMON_H

#include <stdint.h>
#include <stdbool.h>
#include <avr/pgmspace.h>
#include "keycode.h"
#include "action.h"
#include "action_macro.h"
#include "report.h"
#include "host.h"
#include "print.h"
#include "debug.h"
#include "keymap.h"


extern const uint8_t keymaps[][MATRIX_ROWS][MATRIX_COLS];
extern const uint16_t fn_actions[];

`;

	file += generateBaseKeymap();

	file += '\n\n#endif';

	return file;
}

/*
 * Generate keymap.c.
 *
 * @return The generate keymap.c file.
 */
function generateKeymapC() {
	var file = "#include \"keymap_common.h\"\n\n";

	file += generateKeymaps();
	file += "\n\n"

	file += generateMacroCode();

	file += `

const uint16_t PROGMEM fn_actions[] = {
    [0]  = ACTION_LAYER_MOMENTARY(1),
    [1]  = ACTION_LAYER_MOMENTARY(2),
    [2]  = ACTION_LAYER_MOMENTARY(3),
    [3]  = ACTION_LAYER_MOMENTARY(4),
    [4]  = ACTION_LAYER_MOMENTARY(5),
    [5]  = ACTION_LAYER_MOMENTARY(6),
    [6]  = ACTION_LAYER_MOMENTARY(7),
    [7]  = ACTION_LAYER_TOGGLE(1),
    [8]  = ACTION_LAYER_TOGGLE(2),
    [9]  = ACTION_LAYER_TOGGLE(3),
    [10] = ACTION_LAYER_TOGGLE(4),
    [11] = ACTION_LAYER_TOGGLE(5),
    [12] = ACTION_LAYER_TOGGLE(6),
    [13] = ACTION_LAYER_TOGGLE(7),
	[14] = ACTION_MACRO(MACRO_0),
	[15] = ACTION_MACRO(MACRO_1),
	[16] = ACTION_MACRO(MACRO_2),
	[17] = ACTION_MACRO(MACRO_3),
	[18] = ACTION_MACRO(MACRO_4),
	[19] = ACTION_MACRO(MACRO_5),
	[20] = ACTION_MACRO(MACRO_6),
	[21] = ACTION_MACRO(MACRO_7),
};`;

	return file;
}

/*
 * Generate matrix.c.
 *
 * @return The generated matrix.c file.
 */
function generateMatrixC() {
	var file = `#include <stdint.h>
#include <stdbool.h>
#include <avr/io.h>
#include <util/delay.h>
#include "print.h"
#include "debug.h"
#include "util.h"
#include "matrix.h"


#ifndef DEBOUNCE
#   define DEBOUNCE	5
#endif
static uint8_t debouncing = DEBOUNCE;

/* matrix state(1:on, 0:off) */
static matrix_row_t matrix[MATRIX_ROWS];
static matrix_row_t matrix_debouncing[MATRIX_ROWS];

static matrix_row_t read_cols(void);
static void init_cols(void);
static void unselect_rows(void);
static void select_row(uint8_t row);


inline
uint8_t matrix_rows(void)
{
    return MATRIX_ROWS;
}

inline
uint8_t matrix_cols(void)
{
    return MATRIX_COLS;
}

void matrix_init(void)
{
    // initialize row and col
    unselect_rows();
    init_cols();

    // initialize matrix state: all keys off
    for (uint8_t i=0; i < MATRIX_ROWS; i++) {
        matrix[i] = 0;
        matrix_debouncing[i] = 0;
    }
}

uint8_t matrix_scan(void)
{
    for (uint8_t i = 0; i < MATRIX_ROWS; i++) {
        select_row(i);
        _delay_us(30);  // without this wait read unstable value.
        matrix_row_t cols = read_cols();
        if (matrix_debouncing[i] != cols) {
            matrix_debouncing[i] = cols;
            if (debouncing) {
                debug("bounce!: "); debug_hex(debouncing); debug("\\n");
            }
            debouncing = DEBOUNCE;
        }
        unselect_rows();
    }

    if (debouncing) {
        if (--debouncing) {
            _delay_ms(1);
        } else {
            for (uint8_t i = 0; i < MATRIX_ROWS; i++) {
                matrix[i] = matrix_debouncing[i];
            }
        }
    }

    return 1;
}

bool matrix_is_modified(void)
{
    if (debouncing) return false;
    return true;
}

inline
bool matrix_is_on(uint8_t row, uint8_t col)
{
    return (matrix[row] & ((matrix_row_t)1<<col));
}

inline
matrix_row_t matrix_get_row(uint8_t row)
{
    return matrix[row];
}

void matrix_print(void)
{
    print("\\nr/c 0123456789ABCDEF\\n");
    for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
        phex(row); print(": ");
        pbin_reverse16(matrix_get_row(row));
        print("\\n");
    }
}

uint8_t matrix_key_count(void)
{
    uint8_t count = 0;
    for (uint8_t i = 0; i < MATRIX_ROWS; i++) {
        count += bitpop16(matrix[i]);
    }
    return count;
}

`;

	file += generateInitCols() + '\n\n';
	file += generateReadCols() + '\n\n';
	file += generateUnselectRows() + '\n\n';
	file += generateSelectRow();

	return file;
}

/*
 * Generate led.c.
 *
 * @return The generated led.c file.
 */
function generateLedC() {
	var file = `#include <avr/io.h>
#include "stdint.h"
#include "led.h"

`;

	file += generateLedSet();

	return file;
}