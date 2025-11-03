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
  const [mode, setMode] = useState(null); // "friend" | "computer-easy" | "computer-medium" | "computer-hard"
  const [countdown, setCountdown] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    email: "",
    phone: "",
    feedback: "",
  });

  // 🧩 New: Rounds & Scores (for friend mode)
  const [round, setRound] = useState(1);
  const [score, setScore] = useState({ X: 0, O: 0, Draw: 0 });
  const [matchOver, setMatchOver] = useState(false);

  const winSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/win.mp3"));
  const clickSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/click.mp3"));
  const drawSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/draw.mp3"));

  const countdownRef = useRef(null);

  // 🎯 Reset the board for next round
  const restartGame = useCallback(() => {
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

  // 🎯 Restart entire match (for friend mode)
  const restartMatch = () => {
    setRound(1);
    setScore({ X: 0, O: 0, Draw: 0 });
    setMatchOver(false);
    restartGame();
  };

  // 🎯 Countdown auto-reset
  const startAutoReset = useCallback(() => {
    let counter = 3;
    setCountdown(counter);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      if (counter <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        if (mode === "friend" && round < 10) {
          restartGame();
          setRound((r) => r + 1);
        } else if (mode === "friend" && round === 10) {
          setMatchOver(true);
        } else {
          restartGame();
        }
      }
    }, 1000);
  }, [restartGame, mode, round]);

  // 🎯 Handle cell click
  const handleClick = (index) => {
    if (board[index] || winner || isDraw || !mode) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    clickSound.current.currentTime = 0;
    clickSound.current.play();

    if (mode.includes("computer") && xIsNext) {
      setTimeout(() => computerMove(newBoard), 600);
    }
  };

  // 🎯 Computer Move (Easy, Medium, Hard)
  const computerMove = (newBoard) => {
    if (winner || isDraw) return;

    let move;
    const empty = newBoard.map((v, i) => (v ? null : i)).filter((v) => v !== null);

    if (mode === "computer-easy") {
      // Random
      move = empty[Math.floor(Math.random() * empty.length)];
    } else if (mode === "computer-medium") {
      // Medium: if can win, do it; if opponent can win next, block; else random
      move = findBestMediumMove(newBoard, empty);
    } else {
      // Hard: minimax
      move = getBestMove(newBoard);
    }

    if (move != null) {
      newBoard[move] = "O";
      setBoard([...newBoard]);
      setXIsNext(true);
    }
  };

  // 🧠 Medium mode logic
  const findBestMediumMove = (board, empty) => {
    // 1️⃣ Try to win
    for (let i of empty) {
      board[i] = "O";
      if (calculateWinner(board) === "O") {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
    // 2️⃣ Block player win
    for (let i of empty) {
      board[i] = "X";
      if (calculateWinner(board) === "X") {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
    // 3️⃣ Otherwise random
    return empty[Math.floor(Math.random() * empty.length)];
  };

  // 🧠 Hard mode minimax
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

      // Update score in friend mode
      if (mode === "friend") {
        setScore((prev) => ({ ...prev, [win]: prev[win] + 1 }));
      }

      startAutoReset();
    } else if (!board.includes(null)) {
      setIsDraw(true);
      drawSound.current.currentTime = 0;
      drawSound.current.play();

      if (mode === "friend") {
        setScore((prev) => ({ ...prev, Draw: prev.Draw + 1 }));
      }

      startAutoReset();
    }
  }, [board, mode, startAutoReset]);

  // 🎯 Feedback submission
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

  // 🧾 Status text
  const status = matchOver
    ? "🏁 Match Over!"
    : winner
    ? `🎉 Winner: ${winner}!`
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
            <button onClick={() => setMode("friend")}>👬 Play with Friend (10 Rounds)</button>
            <button onClick={() => setMode("computer-easy")}>🤖 Computer (Easy)</button>
            <button onClick={() => setMode("computer-medium")}>⚙️ Computer (Medium)</button>
            <button onClick={() => setMode("computer-hard")}>🧠 Computer (Hard)</button>
          </div>
        </div>
      ) : (
        <div className="game-box">
          <button
            className="back-btn"
            onClick={() => {
              restartGame();
              setMode(null);
              restartMatch();
            }}
          >
            ⬅ Back
          </button>

          <h1 className="game-title">Tic Tac Toe</h1>

          {mode === "friend" && (
            <p className="round-info">
              Round {round}/10 | X Wins: {score.X} | O Wins: {score.O} | Draws: {score.Draw}
            </p>
          )}

          <p className={`status ${winner ? "winner-text" : ""}`}>{status}</p>

          <div className="board">
            {board.map((cell, i) => (
              <button key={i} className={`cell ${cell}`} onClick={() => handleClick(i)}>
                {cell}
              </button>
            ))}
          </div>

          {countdown !== null && (
            <p className="countdown">⏳ Next Round in {countdown}...</p>
          )}

          {matchOver && (
            <div className="match-result">
              <h2>🏆 Final Result</h2>
              <p>
                X Wins: {score.X} | O Wins: {score.O} | Draws: {score.Draw}
              </p>
              <h3>
                {score.X > score.O
                  ? "🎉 Player X Wins the Match!"
                  : score.O > score.X
                  ? "🎉 Player O Wins the Match!"
                  : "🤝 It's a Tie!"}
              </h3>
              <button onClick={restartMatch}>🔄 Restart Match</button>
            </div>
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
                onChange={(e) => setFeedbackData({ ...feedbackData, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={feedbackData.phone}
                onChange={(e) => setFeedbackData({ ...feedbackData, phone: e.target.value })}
              />
              <textarea
                placeholder="Your feedback..."
                required
                value={feedbackData.feedback}
                onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
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
