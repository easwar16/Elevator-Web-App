$(function () {
  set_building_configs_and_rebuild(floor_nums, elevator_nums);
});

function set_building_configs_and_rebuild(floor_nums, elevator_nums) {
  $("*").stop();
  create_elevators_objects(elevator_nums);
  set_outdoor_button_states(floor_nums);

  set_building_display(floor_nums, elevator_nums);
  set_panel_body(floor_nums, elevator_nums);

  set_indoor_switch_bind(floor_nums, elevator_nums);
  set_outdoor_switch_bind(floor_nums, elevator_nums);

  for (let eno = 1; eno <= elevator_nums; eno++) {
    elevators[eno].start();
  }
}

/**
 * TO Create Multiple Elevators
 */
function create_elevators_objects(elevator_nums) {
  let numOfEleInFirstFloor = 0;
  for (let i = 1; i <= elevator_nums; i++) {
    elevators[i] = {
      elevator_no: i,
      state: {
        now_floor_no: 1,
        now_direction: DIRECTION_STILL,
        moving: 0,
        door_state: DOOR_CLOSED,
        auto_mode_state: MODE_CLOSED,
        auto_mode_running_outer_event: undefined,
        indoor_switches: Array(floor_nums + 1).fill(OFF),
        indoor_activated_switches_num: 0,
      },
      /**
       * To Start the Elevator
       */
      start: function () {
        this.start_waiting_to_launch_mode();
      },
      /**
       * To Set the NoFloor for the building
       * @param {*} floor_no
       */
      set_now_floor_no: function (floor_no) {
        this.state.now_floor_no = floor_no;
        set_indoor_floor_number_display(floor_no, this.elevator_no);
      },
      /**
       * To set the direction for the ELevator
       * @param {*} direct
       */
      set_now_direction: function (direct) {
        this.state.now_direction = direct;
        set_indoor_direction_display(this.elevator_no, direct);
      },
      /**
       * To check If the mode is activated and a custom callback function
       * @param {*} callBack
       */
      check_mode_and_callBack: function (callBack) {
        let isModeStarting = this.state.auto_mode_state === MODE_STARTING;
        let isModeRunning = this.state.auto_mode_state === MODE_RUNNING;
        if (isModeRunning) {
          this.state.auto_mode_running_outer_event = function () {
            callBack();
          };
          this.set_now_direction(DIRECTION_MODE_WAITING_FOR_CHANGING);
        } else if (isModeStarting) {
          let eno = this.elevator_no;
          controller_stop_waiting_for_timeout_and_callback(eno, function () {
            elevators[eno].state.auto_mode_state = MODE_CLOSED;
            callBack();
          });
        } else {
          callBack();
        }
      },
      /**
       * To give Direction to the Elevator according to the number of request per direction
       * @param {*} direct
       * @param {*} inner_request
       * @returns
       */
      need_direction: function (direct, inner_request = 0) {
        let isPannelRequestsEmpty = inner_request === 0;
        let isPannelRequestsNotEmpty = inner_request === 1;
        let isCurrDirectNotStill = direct !== DIRECTION_STILL;
        let isDirectionStill = this.state.now_direction === DIRECTION_STILL;
        if (isPannelRequestsEmpty && isDirectionStill) {
          let eno = this.elevator_no;
          this.check_mode_and_callBack(function () {
            elevators[eno].set_now_direction(direct);
            if (DIRECTION_STILL === direct) {
              elevators[eno].on_reach_floor(
                elevators[eno].state.now_floor_no,
                1
              );
            } else {
              elevators[eno].on_reach_floor(
                elevators[eno].state.now_floor_no,
                0
              );
            }
          });
          return;
        }
        if (isPannelRequestsNotEmpty) {
          if (isCurrDirectNotStill) {
            let eno = this.elevator_no;
            this.check_mode_and_callBack(function () {
              elevators[eno].set_now_direction(direct);
              elevators[eno].on_reach_floor(elevators[eno].state.now_floor_no);
            });
          } else {
            this.set_now_direction(direct);
            this.start_waiting_to_launch_mode();
          }
        }
      },
      /**
       * To Launch the Elevator
       * @returns
       */
      start_waiting_to_launch_mode: function () {
        let isCurrEleDirectNotStill =
          this.state.now_direction !== DIRECTION_STILL;
        let isCurrEleNotMoving = this.moving !== false;
        let isCurrEleDoorClosed = this.state.door_state !== DOOR_CLOSED;
        if (enable_mode === false) {
          return;
        }
        if (isCurrEleDoorClosed) {
          return;
        }
        if (
          isCurrEleDirectNotStill &&
          isCurrEleNotMoving &&
          isCurrEleDoorClosed
        ) {
          return;
        }
        this.state.auto_mode_state = MODE_STARTING;
        let eno = this.elevator_no;
        controller_wait_for_timeout_and_callBack(
          this.elevator_no,
          mode_start_waiting_time,
          function () {
            elevators[eno].state.auto_mode_state = MODE_RUNNING;
            set_indoor_direction_display(eno, DIRECTION_STILL);
            elevators[eno].running_mode();
          }
        );
      },
      /**
       * To Run the Elevator
       * @returns
       */
      running_mode: function () {
        let isUndefined =
          this.state.auto_mode_running_outer_event !== undefined;
        if (isUndefined) {
          this.stop_mode();
          return;
        }
        let currEleNo = this.elevator_no;
        let CurrFloorNo = this.state.now_floor_no;
        let rand = randomNum(1, 300);
        controller_wait_for_timeout_and_callBack(currEleNo, rand, function () {
          let ReqPerFloor = new Array(floor_nums + 2).fill(0);
          ReqPerFloor[floor_nums + 1] = 1;
          for (let e = 1; e <= elevator_nums; e++) {
            let isNotCurrEle = e !== currEleNo;
            if (isNotCurrEle) {
              ReqPerFloor[elevators[e].state.now_floor_no] += 1;
            }
          }
          let isCurrFloorNotGround = CurrFloorNo !== 1;
          let isReqNull = ReqPerFloor[1] === 0;
          let isEleBackToFirstFloor = numOfEleInFirstFloor === 0;
          if (isCurrFloorNotGround && isReqNull && isEleBackToFirstFloor) {
            numOfEleInFirstFloor += 1;
            elevators[currEleNo].move_down(function () {
              elevators[currEleNo].set_now_floor_no(CurrFloorNo - 1);
              controller_directly_go_to_floor(currEleNo, CurrFloorNo - 1);
              numOfEleInFirstFloor -= 1;

              elevators[currEleNo].running_mode();
            });

            return;
          }
          let isCurrFloorFirst = CurrFloorNo === 1;
          if (isReqNull && isCurrFloorFirst) {
            controller_wait_for_timeout_and_callBack(
              currEleNo,
              2000,
              function () {
                elevators[currEleNo].running_mode();
              }
            );
            return;
          }
          let ReqStateOfEle = [];
          let start = 1;
          let hasReqs = 1;

          for (let fno = 1; fno <= floor_nums + 1; fno++) {
            let isReqNull = ReqPerFloor[fno] === 0;
            if (isReqNull) {
              if (hasReqs === 1) {
                start = fno;
                hasReqs = 0;
              }
            } else {
              if (hasReqs === 0) {
                ReqStateOfEle.push({
                  st: start,
                  ed: fno - 1,
                  len: fno - start,
                });
                hasReqs = 1;
              }
            }
          }
          if (ReqStateOfEle.length === 0) {
            controller_wait_for_timeout_and_callBack(
              currEleNo,
              2000,
              function () {
                elevators[currEleNo].running_mode();
              }
            );
          } else {
            let farthestIndex = -1;
            let LenOfReq = 0;
            let intervalIndex = -1;
            for (let i = 0; i < ReqStateOfEle.length; i++) {
              let isCurrFloorGreaterReqStart =
                CurrFloorNo >= ReqStateOfEle[i].st;
              let isCurrFloorLesserReqEnd = CurrFloorNo <= ReqStateOfEle[i].ed;
              if (ReqStateOfEle[i].len > LenOfReq) {
                farthestIndex = i;
                LenOfReq = ReqStateOfEle[i].len;
              }
              if (isCurrFloorGreaterReqStart && isCurrFloorLesserReqEnd) {
                intervalIndex = i;
              }
            }
            const GO_TO_ERROR = 1;
            const INTERVAL_LEN_ERROR = 1;
            let go_to_interval_index = farthestIndex;
            let isNullIndex = intervalIndex !== -1;
            let isIntervalNotFarthest = farthestIndex !== intervalIndex;
            let checkReqState = Math.abs(
              ReqStateOfEle[intervalIndex].len -
                ReqStateOfEle[farthestIndex].len
            );
            if (
              isNullIndex &&
              isIntervalNotFarthest &&
              checkReqState <= INTERVAL_LEN_ERROR
            ) {
              go_to_interval_index = intervalIndex;
            }
            let midIndex = Math.floor(
              (ReqStateOfEle[go_to_interval_index].st +
                ReqStateOfEle[go_to_interval_index].ed) /
                2
            );
            let CurrMinusMid = Math.abs(CurrFloorNo - midIndex);
            if (!isNullIndex || (isNullIndex && CurrMinusMid > GO_TO_ERROR)) {
              if (midIndex > CurrFloorNo) {
                elevators[currEleNo].move_up(function () {
                  elevators[currEleNo].set_now_floor_no(CurrFloorNo + 1);
                  controller_directly_go_to_floor(currEleNo, CurrFloorNo + 1);
                  elevators[currEleNo].running_mode();
                });
              } else {
                elevators[currEleNo].move_down(function () {
                  elevators[currEleNo].set_now_floor_no(CurrFloorNo - 1);
                  controller_directly_go_to_floor(currEleNo, CurrFloorNo - 1);

                  elevators[currEleNo].running_mode();
                });
              }
            } else {
              controller_wait_for_timeout_and_callBack(
                currEleNo,
                2000,
                function () {
                  elevators[currEleNo].running_mode();
                }
              );
            }
          }
        });
      },
      /**
       * To stop the working of the Elevator
       */
      stop_mode: function () {
        this.state.auto_mode_state = MODE_CLOSED;
        let callBack = this.state.auto_mode_running_outer_event;
        this.state.auto_mode_running_outer_event = undefined;
        this.set_now_direction(DIRECTION_STILL);
        if (callBack) callBack();
      },
      /**
       * To set the floor button which is selected
       * @param {*} floor_no
       * @returns
       */
      choose_floor_switch: function (floor_no) {
        return ext_choose_indoor_foor_switch(floor_no, this.elevator_no);
      },
      /**
       * To Toggle between On/OFF states for the buttons
       * @param {*} floor_no
       */
      toggle_indoor_switch: function (floor_no) {
        let revState = ON;
        if (this.state.indoor_switches[floor_no] === ON) {
          revState = OFF;
        }
        this.set_indoor_switch(floor_no, revState);
      },
      recent_opened_switches: new Queue(),
      /**
       * To check and handle the pannel Requests
       * @returns
       */
      detect_and_remove_anomaly: function () {
        if (this.recent_opened_switches.isEmpty()) {
          return;
        }
        let maxTime = 3000;
        let maxActiveSwitch = 4;
        let CurrTime = this.recent_opened_switches.back()["opened_time"];
        let isCurrActiveSwicthesEmpty = this.recent_opened_switches.isEmpty();
        while (
          !isCurrActiveSwicthesEmpty &&
          CurrTime - this.recent_opened_switches.front()["opened_time"] >
            maxTime
        ) {
          this.recent_opened_switches.pop();
          isCurrActiveSwicthesEmpty = this.recent_opened_switches.isEmpty();
        }
        if (this.recent_opened_switches.size() > maxActiveSwitch) {
          this.recent_opened_switches.print();
          let isCurrActiveSwicthesEmpty1 =
            this.recent_opened_switches.isEmpty();
          while (isCurrActiveSwicthesEmpty1) {
            this.set_indoor_switch(
              this.recent_opened_switches.front()["floor_no"],
              OFF
            );
            this.recent_opened_switches.pop();
            isCurrActiveSwicthesEmpty1 = this.recent_opened_switches.isEmpty();
          }
        }
      },
      /**
       * To set the indoor buttons to OFf once the Elevator reaches the floor
       * @param {*} floor_no
       * @param {*} state
       * @returns
       */
      set_indoor_switch: function (floor_no, state) {
        let maxOnBns = 13;
        let isSwitchStateCurrState =
          this.state.indoor_switches[floor_no] === state;
        let isStateOn = state === ON;
        let isOnSwitchGreater =
          this.state.indoor_activated_switches_num > maxOnBns;
        if (isSwitchStateCurrState) {
          return;
        }
        if (isStateOn && isOnSwitchGreater) {
          for (let fno = 1; fno <= floor_nums; fno++) {
            let isCurrStateOn = this.state.indoor_switches[fno] === ON;
            if (isCurrStateOn) this.set_indoor_switch(fno, OFF);
          }
          return;
        }
        this.state.indoor_switches[floor_no] = state;
        let isCurrFloorStateOn = this.state.indoor_switches[floor_no] === ON;
        if (isCurrFloorStateOn) {
          this.recent_opened_switches.push({
            floor_no: floor_no,
            opened_time: Date.now(),
          });
          let checkFloor = this.state.now_floor_no === floor_no;
          if (checkFloor) {
            this.set_indoor_switch(floor_no, OFF);
            return;
          }
          this.detect_and_remove_anomaly();
          let isCurrFloorStateOn = this.state.indoor_switches[floor_no] === ON;
          if (isCurrFloorStateOn) {
            set_indoor_floor_switch_state(floor_no, this.elevator_no, ON);
            this.state.indoor_activated_switches_num += 1;
            let isCurrStateStill = this.state.now_direction === DIRECTION_STILL;
            if (isCurrStateStill) {
              let checkDirection = floor_no > this.state.now_direction;
              if (checkDirection) {
                this.need_direction(DIRECTION_UP, 1);
              } else {
                this.need_direction(DIRECTION_DOWN, 1);
              }
            }
          }
        } else {
          this.state.indoor_activated_switches_num -= 1;
          set_indoor_floor_switch_state(floor_no, this.elevator_no, OFF);
        }
      },
      /**
       * To Check if the Elevator is Moving or idle and Move accordingly
       * @param {*} callBack
       * @returns
       */
      check_and_move: function (callBack) {
        this.time += 1;
        if (this.state.now_direction === DIRECTION_STILL) {
          this.start_waiting_to_launch_mode();
          if (callBack) callBack();
          return;
        }
        let direct = this.state.now_direction;
        let currDirectInnerReqs = 0;
        let currDirectOutterReqs = 0;

        let request_floors = Array(floor_nums * 2 + 1).fill(0);
        let going_elevators = Array(floor_nums * 2 + 1).fill(0);
        let begPos = this.state.now_floor_no + this.state.now_direction;

        for (
          let k = begPos;
          k >= 1 && k <= floor_nums;
          k += this.state.now_direction
        ) {
          let checkSwitchOn = this.state.indoor_switches[k] === ON;
          if (checkSwitchOn) {
            currDirectInnerReqs = 1;
            break;
          }
          let CheckUpBnOn = outdoor_buttons_state[k][DIRECTION_UP] === ON;
          let CheckDnBnOn = outdoor_buttons_state[k][DIRECTION_DOWN] === ON;
          if (CheckUpBnOn || CheckDnBnOn) {
            request_floors[k] = 1;
          }
        }
        for (let eno = 1; eno <= elevator_nums; eno++) {
          let isNotCurrEle = eno !== this.elevator_no;
          let isCurrDirect = elevators[eno].state.now_direction === direct;
          if (isNotCurrEle && isCurrDirect) {
            going_elevators[elevators[eno].state.now_floor_no] += 1;
          }
        }
        let currEno = 0;
        let currFno = 0;
        let threash = 1.8;
        let currFloor = this.state.now_floor_no;
        for (
          let k = currFloor;
          k >= 1 && k <= floor_nums;
          k += this.state.now_direction
        ) {
          currEno += going_elevators[k];
          currFno += request_floors[k];
          let checkEnum = currEno === 0;
          let checkFnum = currFno !== 0;
          let checkNotEnum = currEno !== 0;
          let checkRatio = currFno / currEno >= threash;
          if ((checkEnum && checkFnum) || (checkNotEnum && checkRatio)) {
            currDirectOutterReqs = 1;
            break;
          }
        }
        if (currDirectInnerReqs || currDirectOutterReqs) {
          let floor = this.state.now_floor_no;
          let elevator = this.elevator_no;
          let checkIfDirectUp = this.state.now_direction === DIRECTION_UP;
          if (checkIfDirectUp) {
            this.move_up(function () {
              if (callBack) callBack();
              elevators[elevator].on_reach_floor(floor + 1);
            });
          } else {
            this.move_down(function () {
              if (callBack) callBack();
              elevators[elevator].on_reach_floor(floor - 1);
            });
          }
        } else {
          let revDirecction = DIRECTION_UP;
          if (this.state.now_direction === DIRECTION_UP) {
            revDirecction = DIRECTION_DOWN;
          }

          let revDirectPannelReqs = 0;
          let revDirectOutterReqs = 0;

          let request_floors = Array(floor_nums * 2 + 1).fill(0);
          let going_elevators = Array(floor_nums * 2 + 1).fill(0);

          for (
            let k = this.state.now_floor_no;
            k >= 1 && k <= floor_nums;
            k += revDirecction
          ) {
            let checkIfSwitchOn = this.state.indoor_switches[k] === ON;
            if (checkIfSwitchOn) {
              revDirectPannelReqs = 1;
              break;
            }
            let CheckIfUpBnOn = outdoor_buttons_state[k][DIRECTION_UP] === ON;
            let CheckIfDnBnOn = outdoor_buttons_state[k][DIRECTION_DOWN] === ON;
            if (CheckIfUpBnOn || CheckIfDnBnOn) {
              request_floors[k] = 1;
            }
          }

          for (let eno = 1; eno <= elevator_nums; eno++) {
            if (
              eno !== this.elevator_no &&
              elevators[eno].state.now_direction === revDirecction
            ) {
              going_elevators[elevators[eno].state.now_floor_no] += 1;
            }
          }
          let now_enum = 0;
          let now_fnum = 0;
          let threash = 1.8;
          for (
            let k = this.state.now_floor_no;
            k >= 1 && k <= floor_nums;
            k += revDirecction
          ) {
            now_enum += going_elevators[k];
            now_fnum += request_floors[k];
            if (
              (now_enum === 0 && now_fnum !== 0) ||
              (now_enum !== 0 && now_fnum / now_enum >= threash)
            ) {
              revDirectOutterReqs = 1;
              break;
            }
          }

          if (revDirectPannelReqs || revDirectOutterReqs) {
            this.need_direction(revDirecction, 1);
          } else {
            this.need_direction(DIRECTION_STILL, 1);
          }
        }
      },
      /**
       * Doesnt let the elevator door close
       * @param {*} callBack
       */
      wait_for_closing: function (callBack) {
        console.assert(this.state.door_state === DOOR_OPENED);
        this.state.door_state = DOOR_OPENED;
        controller_wait_for_timeout_and_callBack(
          this.elevator_no,
          waiting_for_enter_duration,
          callBack()
        );
      },
      /**
       * Closes the Elevator door immediately on press
       * @param {*} callBack
       * @returns
       */
      skip_waiting_for_closing: function (callBack) {
        let isDoorNotOpen = this.state.door_state !== DOOR_OPENED;
        if (isDoorNotOpen) {
          return;
        }
        let eno = this.elevator_no;

        controller_stop_waiting_for_timeout_and_callback(
          this.elevator_no,
          function () {
            elevators[eno].state.door_state = DOOR_CLOSING;
            elevators[eno].close_door(function () {
              elevators[eno].state.door_state = DOOR_CLOSED;
              elevators[eno].check_and_move();
            });
          }
        );
      },
      ignoreOnReachFloorReqs: 0,
      on_reach_floor: function (floor_no, hasOnRequest) {
        this.set_now_floor_no(floor_no);
        controller_directly_go_to_floor(
          this.elevator_no,
          this.state.now_floor_no
        );
        let OnReqs = hasOnRequest === 1;
        let isOutterBnCurrDirectOn =
          outdoor_buttons_state[floor_no][this.state.now_direction] === ON;
        let isCurrDirectOn = this.state.indoor_switches[floor_no] === ON;
        if (OnReqs || isOutterBnCurrDirectOn || isCurrDirectOn) {
          set_outdoor_switch(floor_no, this.state.now_direction, OFF);
          let eno = this.elevator_no;
          this.set_indoor_switch(floor_no, OFF);
          this.open_door(function () {
            elevators[eno].wait_for_closing(function () {
              elevators[eno].close_door(function () {
                elevators[eno].check_and_move(function () {});
              });
            });
          });
        } else {
          let ifDoorCloseAndEleMoving =
            this.state.door_state === DOOR_CLOSED && this.state.moving === 0;
          if (ifDoorCloseAndEleMoving) this.check_and_move(function () {});
        }
      },
      /**
       * Moves Elevator from one floor to another immediately
       * @param {*} floor_no
       */
      change_floor: function (floor_no) {
        controller_directly_go_to_floor(this.elevator_no, floor_no);
        this.set_now_floor_no(floor_no);
      },
      /**
       * To Close Door on press of button
       * @param {*} callBack
       */
      close_door: function (callBack) {
        this.state.door_state = DOOR_CLOSING;
        let eno = this.elevator_no;
        controller_close_door(
          this.state.now_floor_no,
          this.elevator_no,
          function () {
            elevators[eno].state.door_state = DOOR_CLOSED;
            callBack();
          }
        );
      },
      /**
       * Opens closing door on press of button
       * @returns
       */
      stop_closing_door: function () {
        let checkIfDoorOpen = this.state.door_state !== DOOR_CLOSING;
        if (checkIfDoorOpen) {
          return;
        }
        let eno = this.elevator_no;
        controller_stop_closing_door(
          this.state.now_floor_no,
          this.elevator_no,
          function () {
            elevators[eno].open_door(function () {
              elevators[eno].wait_for_closing(function () {
                elevators[eno].close_door(function () {
                  elevators[eno].check_and_move();
                });
              });
            });
          }
        );
      },
      /**
       * Handles Open door button action
       * @returns
       */
      handle_open_door_button_pressed: function () {
        let eno = this.elevator_no;
        let isElevatorMoving = elevators[eno].state.moving === 1;
        let isEleDoorClosing = elevators[eno].state.door_state === DOOR_CLOSING;
        let isEleDoorClosed = elevators[eno].state.door_state === DOOR_CLOSED;
        let isDirectStill =
          elevators[eno].state.now_direction === DIRECTION_STILL;
        if (isElevatorMoving) {
          return;
        } else if (isEleDoorClosing) {
          elevators[eno].stop_closing_door();
        } else if (isEleDoorClosed && isDirectStill) {
          elevators[eno].need_direction(DIRECTION_STILL);
        }
      },
      /**
       * Opens door of the elevator on reaching a floor
       * @param {*} callBack
       * @returns
       */
      open_door: function (callBack) {
        let isDoorNotClosed = this.state.door_state !== DOOR_CLOSED;
        let isDoorNotCLosing = this.state.door_state !== DOOR_CLOSING;
        if (isDoorNotClosed && isDoorNotCLosing) return;
        this.state.door_state = DOOR_OPENING;
        let eno = this.elevator_no;
        controller_open_door(
          this.state.now_floor_no,
          this.elevator_no,
          function () {
            elevators[eno].state.door_state = DOOR_OPENED;
            callBack();
          }
        );
      },
      /**
       * Moves the Elevator in the Upward direction
       * @param {*} callBack
       */
      move_up: function (callBack) {
        this.state.moving = 1;
        let eno = this.elevator_no;
        controller_move_up(this.elevator_no, function () {
          elevators[eno].state.moving = 0;
          callBack();
        });
      },
      /**
       * Moves the Elevator in the Downward direction
       * @param {*} callBack
       */
      move_down: function (callBack) {
        this.state.moving = 1;
        let Eno = this.elevator_no;
        controller_move_down(this.elevator_no, function () {
          elevators[Eno].state.moving = 0;
          callBack();
        });
      },
    };
  }
}

/**
 * Checks if the door is closed and moves the elevator element accordingly
 * @param {*} change_function
 * @returns
 */
function check_and_change_elevators_position(change_function) {
  for (let i = 1; i <= elevator_nums; i++) {
    let isDirectStill = elevators[i].state.now_direction !== DIRECTION_STILL;
    let isNotMoving = elevators[i].state.moving !== 0;
    let isDoorNotClosed = elevators[i].state.door_state !== DOOR_CLOSED;
    if (isDirectStill || isNotMoving || isDoorNotClosed) {
      return;
    }
  }
  change_function();
}
/**
 * Sets the Outdoor button states
 * @param {*} number_of_floors
 */
function set_outdoor_button_states(number_of_floors) {
  for (let i = 1; i <= number_of_floors; i++) {
    outdoor_buttons_state[i] = [];
    outdoor_buttons_state[i][DIRECTION_UP] = outdoor_buttons_state[i][
      DIRECTION_DOWN
    ] = OFF;
  }
}
/**
 * Handles the outdoor Button Requests to the elevator
 * @param {*} floor_no
 * @param {*} direct
 * @returns
 */
function dispatch_request(floor_no, direct) {
  for (let eno = 1; eno <= elevator_nums; eno++) {
    let checkFloorNo = elevators[eno].state.now_floor_no === floor_no;
    let isDirectionStill =
      elevators[eno].state.now_direction === DIRECTION_STILL;
    let checkDirection = elevators[eno].state.now_direction === direct;
    if (checkFloorNo && (isDirectionStill || checkDirection)) {
      let isDirectionStill1 =
        elevators[eno].state.now_direction === DIRECTION_STILL;
      let checkDirection1 = elevators[eno].state.now_direction === direct;
      if (isDirectionStill1) {
        elevators[eno].need_direction(direct);
        return;
      } else if (checkDirection1) {
        let isMoving = elevators[eno].state.moving === 0;
        let isEleDoorClosing = elevators[eno].state.door_state === DOOR_CLOSING;
        if (isMoving) {
          if (isEleDoorClosing) {
            elevators[eno].stop_closing_door();
          } else {
            toggle_outdoor_switch(floor_no, direct);
          }
          return;
        }
      }
    }
  }
  let Flag = 0;
  let isDirectUp = direct === DIRECTION_UP;
  if (isDirectUp) {
    let topEleNo = -1;
    let topFloor = -1;
    const topEle1 = Request1(floor_no, elevator_nums, topFloor, topEleNo);
    let checkIfEleMoved = topEle1 !== -1;
    if (checkIfEleMoved) {
      elevators[topEle1].need_direction(DIRECTION_UP);
      Flag = 1;
    }
  } else {
    let bottomFloor = floor_nums + 2;
    let bottomElevator = -1;
    const bottomEle = Request2(
      floor_no,
      elevator_nums,
      bottomFloor,
      bottomElevator
    );
    let checkIfEleMoved = bottomEle !== -1;
    if (checkIfEleMoved) {
      Flag = 1;
      elevators[bottomEle].need_direction(DIRECTION_DOWN);
    }
  }
  if (Flag == 1) {
    return;
  }
  let checkDirectUp1 = direct === DIRECTION_UP;
  if (checkDirectUp1) {
    let bottomFloor = floor_nums + 2;
    let bottomElevator = -1;
    const bottomEle = Request2(
      floor_no,
      elevator_nums,
      bottomFloor,
      bottomElevator
    );
    let checkIfEleMoved = bottomEle !== -1;
    if (checkIfEleMoved) {
      Flag = 1;
      elevators[bottomEle].need_direction(DIRECTION_DOWN);
    }
  } else {
    let topEleNo = -1;
    let topFloorNo = -1;
    const topEle = Request1(floor_no, elevator_nums, topFloorNo, topEleNo);
    let checkIfEleMoved = topEle !== -1;
    if (checkIfEleMoved) {
      elevators[topEle].need_direction(DIRECTION_UP);
      Flag = 1;
    }
  }
  console.assert(Flag);
}

function Request1(floorNo, elevatorNum, Floor, EleNo) {
  for (let eno = 1; eno <= elevatorNum; eno++) {
    let checkFloor = elevators[eno].state.now_floor_no < floorNo;
    let isDirectionStill =
      elevators[eno].state.now_direction === DIRECTION_STILL;
    let isGreaterThanTopfloor = elevators[eno].state.now_floor_no > Floor;
    if (checkFloor && isDirectionStill) {
      if (isGreaterThanTopfloor) {
        Floor = elevators[eno].state.now_floor_no;
        EleNo = eno;
      }
    }
  }
  return EleNo;
}
function Request2(floorNo, elevatorNum, Floor, EleNo) {
  for (let eno = 1; eno <= elevatorNum; eno++) {
    let checkFloor = elevators[eno].state.now_floor_no > floorNo;
    let isDirectionStill =
      elevators[eno].state.now_direction === DIRECTION_STILL;
    let isGreaterThanfloor = elevators[eno].state.now_floor_no < Floor;
    if (checkFloor && isDirectionStill) {
      if (isGreaterThanfloor) {
        Floor = elevators[eno].state.now_floor_no;
        EleNo = eno;
      }
    }
  }
  return EleNo;
}
