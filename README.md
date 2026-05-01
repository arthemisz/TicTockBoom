# Tic Tac Toe – Solo or Duo!

A responsive, animated Tic Tac Toe game built with plain HTML, CSS, and JavaScript.

## Features
- Single Player (vs smart computer) and Two Player modes
- Custom player names
- Smart AI: win → block → center → corners → sides
- Score tracking across rounds
- Animations: pop on place, glow on win, overlay on end
- Fully responsive (mobile-friendly)

## How to run
Just open `index.html` in your browser — no build tools needed.

## File structure
```
tic-tac-toe/
├── index.html   → HTML structure
├── style.css    → All styling and animations
├── script.js    → Game logic and interactivity
└── README.md    → This file
```

## SOLID principles applied
- **S** – each function has one job (`checkWinner`, `render`, `getBestMove`, etc.)
- **O** – easy to add difficulty levels or themes without rewriting core logic
- **L** – game logic functions are pure and replaceable
- **I** – UI helpers are separated from game logic
- **D** – `placeMove` orchestrates without touching DOM or logic directly
