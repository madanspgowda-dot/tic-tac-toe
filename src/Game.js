import React, { useState, useEffect, useRef, useCallback } from "react";
import { ref, push } from "firebase/database";
import { db } from "./firebase";
import Confetti from "react-confetti";
import "./Game.css";

const Game = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mode, setMode] = useState(null); // "friend" | "computer-easy" | "computer-hard"
  const [countdown, setCountdown] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    email: "",
    phone: "",
    feedback: "",
  });

  const winSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/win.mp3"));
  const clickSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/click.mp3"));
  const drawSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/draw.mp3"));

  // 🕒 Ref to store countdown interval
  const countdownRef = useRef(null);

  // 🎯 Reset the board
  const restartGame = useCallback(() => {
    // Clear any ongoing countdown timer
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setIsDraw(false);
    setShowConfetti(false);
    setCountdown(null);
  }, []);

  // 🎯 Countdown auto-reset after result
  const startAutoReset = useCallback(() => {
    let counter = 5;
    setCountdown(counter);

    // Clear any existing countdown interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      if (counter <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        restartGame();
      }
    }, 1000);
  }, [restartGame]);

  // 🎯 Handle cell click
  const handleClick = (index) => {
    if (board[index] || winner || isDraw || !mode) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    clickSound.current.currentTime = 0;
    clickSound.current.play();

    // If computer mode and it's computer's turn next
    if (mode.includes("computer") && xIsNext) {
      setTimeout(() => computerMove(newBoard), 600);
    }
  };

  // 🎯 Computer Move (Easy + Hard)
  const computerMove = (newBoard) => {
    if (winner || isDraw) return;

    let move;
    if (mode === "computer-easy") {
      // 🟢 Easy mode: random
      const empty = newBoard.map((v, i) => (v ? null : i)).filter((v) => v !== null);
      move = empty[Math.floor(Math.random() * empty.length)];
    } else {
      // 🔴 Hard mode: Minimax AI
      move = getBestMove(newBoard);
    }

    if (move != null) {
      newBoard[move] = "O";
      setBoard([...newBoard]);
      setXIsNext(true);
    }
  };

  // 🧠 Best move finder (Hard mode)
  function getBestMove(board) {
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  // 🎯 Minimax algorithm
  function minimax(board, depth, isMaximizing) {
    const result = calculateWinner(board);
    if (result === "O") return 10 - depth;
    if (result === "X") return depth - 10;
    if (!board.includes(null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = "O";
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = "X";
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  // 🎯 Check winner or draw
  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
      setShowConfetti(true);
      winSound.current.currentTime = 0;
      winSound.current.play();
      startAutoReset();
    } else if (!board.includes(null)) {
      setIsDraw(true);
      drawSound.current.currentTime = 0;
      drawSound.current.play();
      startAutoReset();
    }
  }, [board, startAutoReset]);

  // 🎯 Handle Feedback Submission
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    const feedbackRef = ref(db, "feedbacks");
    push(feedbackRef, feedbackData)
      .then(() => {
        alert("✅ Feedback submitted successfully!");
        setFeedbackData({ email: "", phone: "", feedback: "" });
        setShowFeedback(false);
      })
      .catch((error) => alert("Error: " + error.message));
  };

  // 🎯 UI Status
  const status = winner
    ? `🎉 Winner: ${winner}! 🎉`
    : isDraw
    ? "😐 It’s a Draw!"
    : mode
    ? `Next Player: ${xIsNext ? "X" : "O"}`
    : "Choose a mode to start!";

  return (
    <div className="game-page">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      {!mode ? (
        <div className="mode-select">
          <h1>Select Game Mode</h1>
          <div className="mode-buttons">
            <button onClick={() => setMode("friend")}>👬 Play with Friend</button>
            <button onClick={() => setMode("computer-easy")}>🤖 Play with Computer (Easy)</button>
            <button onClick={() => setMode("computer-hard")}>🧠 Play with Computer (Hard)</button>
          </div>
        </div>
      ) : (
        <div className="game-box">
          <button
            className="back-btn"
            onClick={() => {
              restartGame();
              setMode(null);
            }}
          >
            ⬅ Back
          </button>

          <h1 className="game-title">Tic Tac Toe</h1>
          <p className={`status ${winner ? "winner-text" : ""}`}>{status}</p>

          <div className="board">
            {board.map((cell, i) => (
              <button key={i} className={`cell ${cell}`} onClick={() => handleClick(i)}>
                {cell}
              </button>
            ))}
          </div>

          {countdown !== null && (
            <p className="countdown">⏳ Restarting in {countdown} seconds...</p>
          )}

          <div className="buttons">
            <button className="restart" onClick={restartGame}>
              🔄 Restart Game
            </button>
            <button className="feedback" onClick={() => setShowFeedback(true)}>
              💬 Give Feedback
            </button>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-form">
            <h2>Share Your Feedback</h2>
            <form onSubmit={handleFeedbackSubmit}>
              <input
                type="email"
                placeholder="Your Email"
                required
                value={feedbackData.email}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, email: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={feedbackData.phone}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, phone: e.target.value })
                }
              />
              <textarea
                placeholder="Your feedback..."
                required
                value={feedbackData.feedback}
                onChange={(e) =>
                  setFeedbackData({ ...feedbackData, feedback: e.target.value })
                }
              ></textarea>
              <div className="form-btns">
                <button type="submit" className="submit-btn">
                  Submit
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowFeedback(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 Winner Calculation
function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export default Game;
