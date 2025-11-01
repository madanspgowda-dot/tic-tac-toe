import React, { useState, useEffect, useRef } from "react";
import { ref, push } from "firebase/database";
import { db } from "./firebase";
import Confetti from "react-confetti";
import "./Game.css";

const Game = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    email: "",
    phone: "",
    feedback: "",
  });

  const winSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/win.mp3"));
  const clickSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/click.mp3"));
  const drawSound = useRef(new Audio(process.env.PUBLIC_URL + "/sounds/draw.mp3"));

  const handleClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    clickSound.current.currentTime = 0;
    clickSound.current.play();
  };

  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
      setShowConfetti(true);
      winSound.current.currentTime = 0;
      winSound.current.play();
      setTimeout(() => setShowConfetti(false), 4000);
    } else if (!board.includes(null)) {
      setIsDraw(true);
      drawSound.current.currentTime = 0;
      drawSound.current.play();
    }
  }, [board]);

  const restartGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setIsDraw(false);
    setShowConfetti(false);
  };

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

  const status = winner
    ? `🎉 Winner: ${winner}! 🎉`
    : isDraw
    ? "😐 It’s a Draw!"
    : `Next Player: ${xIsNext ? "X" : "O"}`;

  return (
    <div className="game-page">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <div className="game-box">
        <h1 className="game-title">Tic Tac Toe</h1>
        <p className={`status ${winner ? "winner-text" : ""}`}>{status}</p>

        <div className="board">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`cell ${cell}`}
              onClick={() => handleClick(i)}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="buttons">
          <button className="restart" onClick={restartGame}>
            🔄 Restart Game
          </button>
          <button className="feedback" onClick={() => setShowFeedback(true)}>
            💬 Give Feedback
          </button>
        </div>
      </div>

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
