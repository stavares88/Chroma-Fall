import { useEffect, useState } from 'react'
import './App.css'

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

type Piece = {
  type: PieceType
  shape: number[][]
  color: string
}

type LockedCell = {
  filled: boolean
  color: string
}

const PIECES: Record<PieceType, Piece> = {
  I: {
    type: 'I',
    shape: [[1, 1, 1, 1]],
    color: '#00ffff',
  },

  O: {
    type: 'O',
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#ffff00',
  },

  T: {
    type: 'T',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#ff00ff',
  },

  S: {
    type: 'S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#00ff66',
  },

  Z: {
    type: 'Z',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#ff3366',
  },

  J: {
    type: 'J',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#3399ff',
  },

  L: {
    type: 'L',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#ff9900',
  },
}

function getRandomPiece(): Piece {
  const pieceTypes = Object.keys(PIECES) as PieceType[]
  const randomIndex = Math.floor(Math.random() * pieceTypes.length)

  return PIECES[pieceTypes[randomIndex]]
}

function rotateShape(shape: number[][]): number[][] {
  return shape[0].map((_, columnIndex) =>
    shape.map((row) => row[columnIndex]).reverse()
  )
}

function createEmptyBoard(): LockedCell[] {
  return Array.from({ length: 200 }, () => ({
    filled: false,
    color: '',
  }))
}

function App() {
  const [currentPiece, setCurrentPiece] = useState<Piece>(() =>
    getRandomPiece()
  )

  const [nextPiece, setNextPiece] = useState<Piece>(() =>
    getRandomPiece()
  )

  // HOLD piece.
  const [holdPiece, setHoldPiece] = useState<Piece | null>(null)

  // Controls whether the player can hold the current piece.
  const [canHold, setCanHold] = useState(true)

  const [pieceRow, setPieceRow] = useState(0)
  const [pieceColumn, setPieceColumn] = useState(3)

  const [lockedBoard, setLockedBoard] = useState<LockedCell[]>(
    createEmptyBoard
  )

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [lineFlash, setLineFlash] = useState(false)

  const canMoveTo = (
    shape: number[][],
    row: number,
    column: number
  ): boolean => {
    for (let rowIndex = 0; rowIndex < shape.length; rowIndex++) {
      for (
        let columnIndex = 0;
        columnIndex < shape[rowIndex].length;
        columnIndex++
      ) {
        if (shape[rowIndex][columnIndex] === 0) {
          continue
        }

        const boardRow = row + rowIndex
        const boardColumn = column + columnIndex

        if (boardRow < 0 || boardRow >= 20) {
          return false
        }

        if (boardColumn < 0 || boardColumn >= 10) {
          return false
        }

        const boardIndex = boardRow * 10 + boardColumn

        if (lockedBoard[boardIndex].filled) {
          return false
        }
      }
    }

    return true
  }

  const getGhostRow = (): number => {
    let ghostRow = pieceRow

    while (
      canMoveTo(
        currentPiece.shape,
        ghostRow + 1,
        pieceColumn
      )
    ) {
      ghostRow++
    }

    return ghostRow
  }

  const clearCompletedLines = (
    board: LockedCell[]
  ): LockedCell[] => {
    const newBoard: LockedCell[] = []
    let clearedLines = 0

    for (let row = 0; row < 20; row++) {
      const rowStart = row * 10
      const currentRow = board.slice(rowStart, rowStart + 10)

      const isComplete = currentRow.every(
        (cell) => cell.filled
      )

      if (isComplete) {
        clearedLines++
      } else {
        newBoard.push(...currentRow)
      }
    }

    if (clearedLines === 0) {
      return board
    }

    setLines((currentLines) => currentLines + clearedLines)

    const points = clearedLines * clearedLines * 100

    setScore((currentScore) => currentScore + points)

    setLineFlash(true)

    setTimeout(() => {
      setLineFlash(false)
    }, 200)

    const emptyRows = Array.from(
      { length: clearedLines * 10 },
      () => ({
        filled: false,
        color: '',
      })
    )

    return [...emptyRows, ...newBoard]
  }

  const lockCurrentPiece = (
    finalRow: number = pieceRow
  ) => {
    const newBoard = [...lockedBoard]

    currentPiece.shape.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell === 1) {
          const boardRow = finalRow + rowIndex
          const boardColumn = pieceColumn + columnIndex

          if (
            boardRow >= 0 &&
            boardRow < 20 &&
            boardColumn >= 0 &&
            boardColumn < 10
          ) {
            const boardIndex = boardRow * 10 + boardColumn

            newBoard[boardIndex] = {
              filled: true,
              color: currentPiece.color,
            }
          }
        }
      })
    })

    const boardAfterClear = clearCompletedLines(newBoard)

    setLockedBoard(boardAfterClear)

    // NEXT becomes CURRENT.
    setCurrentPiece(nextPiece)

    // Generate a new NEXT piece.
    setNextPiece(getRandomPiece())

    // Reset the new piece to the top.
    setPieceRow(0)
    setPieceColumn(3)

    // The player can HOLD again for the new piece.
    setCanHold(true)
  }

  // HOLD mechanic.
  const holdCurrentPiece = () => {
    // Prevent multiple holds during the same turn.
    if (!canHold) {
      return
    }

    if (holdPiece === null) {
      // First HOLD:
      // Store the current piece and bring in NEXT.
      setHoldPiece(currentPiece)
      setCurrentPiece(nextPiece)
      setNextPiece(getRandomPiece())
    } else {
      // Swap CURRENT and HOLD.
      const swappedPiece = holdPiece

      setHoldPiece(currentPiece)
      setCurrentPiece(swappedPiece)
    }

    // Every held piece starts from the top.
    setPieceRow(0)
    setPieceColumn(3)

    // Prevent another HOLD until this piece locks.
    setCanHold(false)
  }

  const hardDrop = () => {
    const ghostRow = getGhostRow()

    setPieceRow(ghostRow)
    lockCurrentPiece(ghostRow)
  }

  // Automatic falling.
  useEffect(() => {
    const gameTimer = setInterval(() => {
      if (
        canMoveTo(
          currentPiece.shape,
          pieceRow + 1,
          pieceColumn
        )
      ) {
        setPieceRow((currentRow) => currentRow + 1)
      } else {
        lockCurrentPiece()
      }
    }, 1000)

    return () => {
      clearInterval(gameTimer)
    }
  }, [
    currentPiece,
    nextPiece,
    pieceRow,
    pieceColumn,
    lockedBoard,
  ])

  // Keyboard controls.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        if (
          canMoveTo(
            currentPiece.shape,
            pieceRow,
            pieceColumn - 1
          )
        ) {
          setPieceColumn(
            (currentColumn) => currentColumn - 1
          )
        }
      }

      if (event.key === 'ArrowRight') {
        if (
          canMoveTo(
            currentPiece.shape,
            pieceRow,
            pieceColumn + 1
          )
        ) {
          setPieceColumn(
            (currentColumn) => currentColumn + 1
          )
        }
      }

      if (event.key === 'ArrowDown') {
        if (
          canMoveTo(
            currentPiece.shape,
            pieceRow + 1,
            pieceColumn
          )
        ) {
          setPieceRow(
            (currentRow) => currentRow + 1
          )
        } else {
          lockCurrentPiece()
        }
      }

      if (event.key === 'ArrowUp') {
        const rotatedShape = rotateShape(
          currentPiece.shape
        )

        if (
          canMoveTo(
            rotatedShape,
            pieceRow,
            pieceColumn
          )
        ) {
          setCurrentPiece((piece) => ({
            ...piece,
            shape: rotatedShape,
          }))
        }
      }

      if (event.code === 'Space') {
        event.preventDefault()
        hardDrop()
      }

      // C = HOLD.
      if (event.key.toLowerCase() === 'c') {
        holdCurrentPiece()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    currentPiece,
    pieceRow,
    pieceColumn,
    lockedBoard,
    holdPiece,
    canHold,
  ])

  const ghostRow = getGhostRow()

  const board = lockedBoard.map((cell) => ({
    ...cell,
  }))

  // Draw ghost piece first.
  currentPiece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === 1) {
        const boardRow = ghostRow + rowIndex
        const boardColumn = pieceColumn + columnIndex

        if (
          boardRow >= 0 &&
          boardRow < 20 &&
          boardColumn >= 0 &&
          boardColumn < 10
        ) {
          const boardIndex =
            boardRow * 10 + boardColumn

          if (!board[boardIndex].filled) {
            board[boardIndex] = {
              filled: true,
              color: `${currentPiece.color}55`,
            }
          }
        }
      }
    })
  })

  // Draw active piece on top of ghost piece.
  currentPiece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === 1) {
        const boardRow = pieceRow + rowIndex
        const boardColumn =
          pieceColumn + columnIndex

        if (
          boardRow >= 0 &&
          boardRow < 20 &&
          boardColumn >= 0 &&
          boardColumn < 10
        ) {
          const boardIndex =
            boardRow * 10 + boardColumn

          board[boardIndex] = {
            filled: true,
            color: currentPiece.color,
          }
        }
      }
    })
  })

  return (
    <main
      className={`game ${
        lineFlash ? 'line-clear-flash' : ''
      }`}
    >
      <div className="scanlines"></div>

      <header className="game-header">
        <p className="subtitle">
          NEON ARCADE SYSTEM
        </p>

        <h1>CHROMA FALL</h1>

        <div className="header-line"></div>
      </header>

      <section className="game-layout">
        <aside className="side-panel left-panel">
          <div className="info-box">
            <h2>HOLD</h2>

            <div className="preview-box">
              {holdPiece && (
                <div
                  className="mini-piece"
                  style={{
                    gridTemplateColumns: `repeat(
                      ${holdPiece.shape[0].length},
                      1fr
                    )`,
                    gridTemplateRows: `repeat(
                      ${holdPiece.shape.length},
                      1fr
                    )`,
                  }}
                >
                  {holdPiece.shape.flatMap(
                    (row, rowIndex) =>
                      row.map(
                        (cell, columnIndex) => (
                          <div
                            key={`${rowIndex}-${columnIndex}`}
                            className="mini-cell"
                            style={
                              cell === 1
                                ? {
                                    backgroundColor:
                                      holdPiece.color,
                                    boxShadow: `
                                      0 0 4px ${holdPiece.color},
                                      0 0 8px ${holdPiece.color}
                                    `,
                                  }
                                : undefined
                            }
                          ></div>
                        )
                      )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="info-box controls">
            <h2>CONTROLS</h2>

            <p>← → MOVE</p>
            <p>↑ ROTATE</p>
            <p>↓ DROP</p>
            <p>SPACE HARD DROP</p>
            <p>C HOLD</p>
          </div>
        </aside>

        <div className="board-container">
          <div className="board">
            {board.map((cell, index) => (
              <div
                className={`cell ${
                  cell.filled ? 'piece' : ''
                }`}
                key={index}
                style={
                  cell.filled
                    ? {
                        backgroundColor: cell.color,
                        boxShadow: `
                          0 0 5px ${cell.color},
                          0 0 10px ${cell.color},
                          0 0 20px ${cell.color}
                        `,
                      }
                    : undefined
                }
              ></div>
            ))}
          </div>
        </div>

        <aside className="side-panel right-panel">
          <div className="info-box">
            <h2>NEXT</h2>

            <div className="preview-box">
              <div
                className="mini-piece"
                style={{
                  gridTemplateColumns: `repeat(
                    ${nextPiece.shape[0].length},
                    1fr
                  )`,
                  gridTemplateRows: `repeat(
                    ${nextPiece.shape.length},
                    1fr
                  )`,
                }}
              >
                {nextPiece.shape.flatMap(
                  (row, rowIndex) =>
                    row.map(
                      (cell, columnIndex) => (
                        <div
                          key={`${rowIndex}-${columnIndex}`}
                          className="mini-cell"
                          style={
                            cell === 1
                              ? {
                                  backgroundColor:
                                    nextPiece.color,
                                  boxShadow: `
                                    0 0 4px ${nextPiece.color},
                                    0 0 8px ${nextPiece.color}
                                  `,
                                }
                              : undefined
                          }
                        ></div>
                      )
                    )
                )}
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span>SCORE</span>

              <strong>
                {score
                  .toString()
                  .padStart(6, '0')}
              </strong>
            </div>

            <div className="stat">
              <span>LEVEL</span>

              <strong>01</strong>
            </div>

            <div className="stat">
              <span>LINES</span>

              <strong>
                {lines
                  .toString()
                  .padStart(3, '0')}
              </strong>
            </div>
          </div>
        </aside>
      </section>

      <footer className="game-footer">
        <span>◈ SYSTEM ONLINE</span>
        <span>◈ PRESS START</span>
        <span>◈ LEVEL 01</span>
      </footer>
    </main>
  )
}

export default App