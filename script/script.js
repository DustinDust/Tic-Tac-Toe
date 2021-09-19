"use strict";

/*------------------------------------------------------------*/
//The module for dom utilities
const domDisplayHelper = (function () {
  const createDomNode = (nodeName, textcontent, ...classes) => {
    let node = document.createElement(nodeName);
    [...classes].forEach((className) => {
      node.classList.add(className);
    });
    node.textContent = textcontent;
    return node;
  };

  const removeAllChild = (node) => {
    while (node.firstChild) {
      node.removeChild(node.lastChild);
    }
  };

  //expose
  return {
    createDomNode,
    removeAllChild,
  };
})();

let playerFactory = (type) => {
  let _playingAs;
  if (type) {
    _playingAs = "X";
  } else _playingAs = "O";

  function play(pos) {
    // console.log(`play ${move} at ${pos}!`);
    return gameBoard.set(pos, _playingAs);
  }

  //expose
  return {
    play,
  };
};

const gameBoard = (function () {
  //NaN for empty slot
  let _state = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];

  //check if the game end
  function _checkState() {
    for (let i = 0; i < 3; i++) {
      if (_state[i] === _state[i + 3] && _state[i] === _state[i + 6])
        return {
          end: true,
          winner: _state[i],
        };
    }
    for (let i = 0; i < 7; i += 3) {
      if (_state[i] === _state[i + 1] && _state[i] === _state[i + 2])
        return {
          end: true,
          winner: _state[i],
        };
    }
    if (_state[0] === _state[4] && _state[0] === _state[8])
      return {
        end: true,
        winner: _state[0],
      };
    if (_state[2] === _state[4] && _state[2] === _state[6])
      return {
        end: true,
        winner: _state[2],
      };
    return { end: false, winner: null };
  }

  //use for DOM displayment
  function getState() {
    return _state;
  }

  //reset the data
  function reset() {
    _state.fill(NaN);
  }

  //play a move, then check if the board is full, and the current game state
  function set(pos, move) {
    _state[pos - 1] = move;
    if (_state.some((pos) => Number.isNaN(pos)))
      return {
        nextMove: true,
        state: _checkState(),
      };
    else
      return {
        nextMove: false,
        state: _checkState(),
      };
  }

  //expose
  return {
    reset,
    set,
    getState,
  };
})();

const gameController = (function () {
  let _players = [];
  let _playing = undefined;

  let playGame = (pos) => {
    let newState = _players[_playing].play(pos);
    if (newState.state.end === true) {
      return {
        message: `The winner is ${newState.state.winner} player!`,
        end: true,
      };
    } else if (newState.nextMove === false) {
      return {
        message: "Draw!",
        end: true,
      };
    } else {
      _playing = _playing === 0 ? 1 : 0;
      return {
        end: false,
      };
    }
  };

  let init = (whoFirst, bot = false) => {
    gameBoard.reset();
    _playing = whoFirst === "X" ? 0 : 1;
    if (bot) {
      _players = [playerFactory(), botFactory()];
    } else _players = [playerFactory(true), playerFactory(false)];
  };
  return {
    init,
    playGame,
  };
})();

const displayController = (function () {
  let _boardDisplay = document.querySelectorAll(".slot");
  let _draw = () => {
    let state = gameBoard.getState();
    for (let i = 0; i < state.length; i++) {
      if (Number.isNaN(state[i])) {
        continue;
      } else if (_boardDisplay[i].firstChild) {
        continue;
      } else {
        [..._boardDisplay][i].appendChild(
          domDisplayHelper.createDomNode("span", state[i], state[i])
        );
      }
    }
  };
  let _erase = () => {
    [..._boardDisplay].forEach((slot) => {
      domDisplayHelper.removeAllChild(slot);
    });
  };
  let init = (whoFirst, bot = false) => {
    _erase();
    gameController.init(whoFirst, bot);
  };
  let play = (pos) => {
    let afterMoveState = gameController.playGame(pos);
    _draw();
    return afterMoveState;
  };
  return {
    play,
    init,
  };
})();

/*--------------------------------------------------------------*/
//start the dom display, event handler assignment
(function () {
  const settingButton = document.querySelector(".setting");
  const modalResult = document.querySelector(".modal.result-menu");
  const modalSetting = document.querySelector(".modal.setting-menu");
  const boardDisplay = document.querySelectorAll(".slot");
  const settingForm = document.querySelector(".setting-form");
  const restartButton = document.querySelector("button.restart");

  window.onload = () => {
    modalSetting.style.display = "block";
  };
  settingButton.addEventListener("click", () => {
    modalSetting.style.display = "block";
  });
  for (let i = 0; i < boardDisplay.length; i++) {
    boardDisplay[i].addEventListener("click", (event) => {
      if (event.target.firstChild) return;
      else {
        let state = displayController.play(i + 1);
        if (state.end === true) {
          document.querySelector(".game-message").textContent = state.message;
          modalResult.style.display = "block";
          console.log(state.message);
        } else return;
      }
    });
  }
  settingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let whoFirst = event.target.elements.whoFirst.value;
    let bot = event.target.elements.bot.checked;
    displayController.init(whoFirst, bot);
    modalSetting.style.display = "none";
  });
  restartButton.addEventListener("click", () => {
    modalResult.style.display = "none";
    modalSetting.style.display = "block";
  });
})();
