let ROWS, COLS, grid = [], start = null, end = null;
let mode, isMouseDown = false;
let isDragging = false;
let MouseDownCell = null;
let MouseDownHadWall = false;
let currentRunId = 0;  // ID của lần chạy thuật toán hiện tại

const maze = document.getElementById("maze");
const table = document.getElementById("resultTable");


document.addEventListener("mouseup", () => {
  if (mode === "wall" && !isDragging && MouseDownCell) {
    MouseDownCell.wall = !MouseDownHadWall;
    MouseDownCell.el.classList.toggle("wall", MouseDownCell.wall);
  }
  isMouseDown = false;
  isDragging = false;
  MouseDownCell = null;
});

/* ===== ACTIVE BUTTON ===== */
function setActive(groupId, btn) {
  document.querySelectorAll(`#${groupId} button`)
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ===== MODE ===== */
function setMode(m, btn) {
  mode = m;
  setActive("drawModes", btn);
}

/* ===== MAZE ===== */
function createMaze() {
  ROWS = +rows.value;
  COLS = +cols.value;
  if (ROWS > 100 || COLS > 100) {
    alert("Kích thước mê cung tối đa là 100 x 100");
    return;
  }
  grid = [];
  start = end = null;
  maze.innerHTML = "";

  maze.style.gridTemplateRows = `repeat(${ROWS}, 25px)`;
  maze.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;

  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const el = document.createElement("div");
      el.className = "cell";

      el.addEventListener("mousedown", () => {
        if (mode !== "wall") {
          clickCell(r, c);
          return;
        }
        const cell = grid[r][c];
        if(cell === start || cell === end ) return;
        isMouseDown = true;
        isDragging = false;
        MouseDownCell = grid[r][c];
        MouseDownHadWall = MouseDownCell.wall;
        drawWall(r, c);
      });

      el.addEventListener("mouseenter", () => {
        if (isMouseDown && mode === "wall") {
          const cell = grid[r][c];
        if(cell === start || cell === end ) return;
          isDragging = true;
          drawWall(r, c);
        }
      });

      maze.appendChild(el);

      row.push({
        r, c,
        wall: false,
        el
      });
    }
    grid.push(row);
  }
}


function clickCell(r, c) {
  let cell = grid[r][c];
  if (mode === "start") {
    
    if (cell.wall) return; // không đặt start lên wall


    if (start) start.el.classList.remove("start");
    start = cell;
    cell.el.classList.add("start");
  }
  if (mode === "end") {
        if (cell.wall) return; // không đặt start lên wall

    if (end) end.el.classList.remove("end");
    end = cell;
    cell.el.classList.add("end");
  }
}

function drawWall(r, c) {
  const cell = grid[r][c];
  if(mode === "wall") {
  if (cell.wall || cell === start || cell === end ) return;
  cell.wall = true;
  cell.el.classList.add("wall");
  }
}

function resetMaze() {
  for (let row of grid) {
    for (let cell of row) {       
      // XÓA SỐ VÀ CLASS
      cell.el.classList.remove("visited", "path");
      cell.el.textContent = "";
      if (cell.wall) cell.el.classList.add("wall");
      else cell.el.classList.remove("wall");
    }
  }
  if (start) start.el.classList.add("start");
  if (end) end.el.classList.add("end");
}


/* ===== ALGORITHMS ===== */
async function run(type, btn) {
  if (!start || !end) {
    alert("Cần cài Start và End");
    return;
  }

  setActive("algoButtons", btn);

  // Dừng thuật toán cũ ngay lập tức bằng cách tăng runId
  currentRunId++;
  const runId = currentRunId;

  resetMaze(); // xóa visited/path cũ

  const res = await fetch("http://localhost:3000/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      algo: type,
      rows: ROWS,
      cols: COLS,
      start: { r: start.r, c: start.c },
      end: { r: end.r, c: end.c },
      grid: grid.map(row => row.map(c => c.wall ? 1 : 0))
    })
  });

  const data = await res.json();

  // Kiểm tra stopFlag
  if (runId !== currentRunId) return;

  const tStart = performance.now();

  for (let cell of data.visitedOrder) {
    if (runId !== currentRunId) return; // dừng nếu đã click thuật toán khác
    if (
      (cell.r === start.r && cell.c === start.c) ||
      (cell.r === end.r && cell.c === end.c)
    ) continue;

    const el = grid[cell.r][cell.c].el;
    el.classList.add("visited");
    el.textContent = cell.order; // số thứ tự
    el.style.fontSize = "10px";
    await nextFrame();
    await sleep(10);
  }

  if (!data.found) {
    alert("Không tìm được đường");
    return;
  }

  // vẽ path
  for (let cell of data.path) {
    if (runId !== currentRunId) return; // dừng nếu đã click thuật toán khác
    if (cell.r === start.r && cell.c === start.c) continue;
    if (cell.r === end.r && cell.c === end.c) continue;
    const el = grid[cell.r][cell.c].el;
    el.classList.add("path");
    await nextFrame();
    await sleep(20);
  }
  const tEnd = performance.now();
const totalTime = +(tEnd - tStart).toFixed(2);
  addResult(type, `${ROWS}x${COLS}`, totalTime, data.visited, data.path.length);
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

function addResult(algo, size, time, visited, len) {
  let tr = document.createElement("tr");
  tr.innerHTML =
    `<td>${algo}</td>
     <td>${size}</td>
     <td>${time}</td>
     <td>${visited}</td>
     <td>${len}</td>`;
  table.appendChild(tr);
}

function resetAll() {
  currentRunId++; // dừng tất cả thuật toán đang chạy
  table.innerHTML = "";
  document.querySelectorAll("button.active")
    .forEach(b => b.classList.remove("active"));
  createMaze();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

createMaze();
