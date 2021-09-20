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

function botFactory(type) {
  let _playingAs = type ? "X" : "O";

  function calculate(state, depth, isMax) {
    if (state.result === 1) {
      if (state.winner === _playingAs) {
        return +1;
      } else return -1;
    } else if (state.result === 0) {
      return 0;
    }

    if (isMax) {
      let bestScore = -Infinity;
      for (let i = 0; i < gameBoard.getState().length; i++) {
        if (Number.isNaN(gameBoard.getState()[i])) {
          let newState = gameBoard.set(i + 1, _playingAs);
          let score = calculate(newState, depth + 1, isMax);
          bestScore = Math.max(bestScore, score);
          gameBoard.set(i + 1, NaN);
        }
      }
      return bestScore;
    } else {
      let bestScore = +Infinity;
      for (let i = 0; i < gameBoard.getState().length; i++) {
        if (Number.isNaN(gameBoard.getState()[i])) {
          let newState = gameBoard.set(i + 1, _playingAs === "X" ? "O" : "X");
          let score = calculate(newState, depth + 1, !isMax);
          bestScore = Math.min(bestScore, score);
          gameBoard.set(i + 1, NaN);
        }
      }
      return bestScore;
    }
  }

  function play() {
    let bestMove = { move: -1, score: -Infinity };
    for (let i = 0; i < gameBoard.getState().length; i++) {
      if (Number.isNaN(gameBoard.getState()[i])) {
        let tryState = gameBoard.set(i + 1, _playingAs);
        let newScore = calculate(tryState, 0, false);
        if (newScore > bestMove.score) {
          bestMove.move = i + 1;
          bestMove.score = newScore;
        }
        gameBoard.set(i + 1, NaN);
      }
    }
    console.log(bestMove);
    return gameBoard.set(bestMove.move, _playingAs);
  }
  return {
    play,
  };
}

const gameBoard = (function () {
  //NaN for empty slot
  let _state = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];

  function getResult() {
    let newState = _checkState();
    let full = !_state.some((pos) => Number.isNaN(pos));
    if (newState.end) {
      return {
        result: 1,
        winner: newState.winner,
      };
    } else if (full) {
      return {
        result: 0,
        winner: null,
      };
    } else
      return {
        result: -1,
        winner: null,
      };
  }

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
    return getResult();
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
  let _bot;

  let checkAfterMove = (newState) => {
    if (newState.result === 1) {
      return {
        message: `The winner is ${newState.winner} player!`,
        end: true,
      };
    } else if (newState.result === 0) {
      return {
        message: "Draw!",
        end: true,
      };
    } else {
      return {
        end: false,
      };
    }
  };

  let playGame = (pos) => {
    let newState = _players[_playing].play(pos);
    _playing = _playing === 0 ? 1 : 0;

    if (checkAfterMove(newState).end === false && _bot === true) {
      _playing = _playing === 0 ? 1 : 0;
      return checkAfterMove(_players[1].play());
    } else return checkAfterMove(newState);
  };

  let init = (whoFirst, bot = false) => {
    gameBoard.reset();
    _playing = 0;
    if (bot) {
      _bot = true;
      _players = [
        playerFactory(whoFirst === "X"),
        botFactory(whoFirst === "O"),
      ];
    } else {
      _bot = false;
      _players = [
        playerFactory(whoFirst === "X"),
        playerFactory(whoFirst === "O"),
      ];
    }
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
