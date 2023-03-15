const version = '5.0.1';

let building_name = ''

const DIRECTION_DOWN = -1;
const DIRECTION_UP = 1;
const DIRECTION_STILL = 0;
const DIRECTION_MODE_WAITING_FOR_CHANGING = 2

const DOOR_CLOSED = 0
const DOOR_CLOSING = 1
const DOOR_OPENED = 2
const DOOR_OPENING = 3

const ON = 1;
const OFF = 0;

let elevator_nums = 6
let floor_nums = 10

let elevators = []
let outdoor_buttons_state = []

let toggle_door_secs = 1500
let moving_speed_millisecond_per_pixel = 5
let waiting_for_enter_duration = 1500

let wall_side_with = '170px'
let wall_main_with = '170px'
let celling_height = '20px'
let ground_height = '25px'
let wall_main_height = '170px'
let top_floor_height = '1px'

let enable_mode_display = false
let enable_DIRECTION_MODE_WAITING_FOR_CHANGING_display = false
let enable_mode = false
const MODE_RUNNING = 0
const MODE_STARTING = 1
const MODE_CLOSED = 2
let mode_start_waiting_time = 2000