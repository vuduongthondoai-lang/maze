const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// Serve frontend static files
const frontendPath = __dirname;
app.use(express.static(frontendPath));

// ======================== BFS ========================
function bfs(grid, start, end, rows, cols) {
  const t0 = performance.now();
  let step = 0;

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));

  const queue = [start];
  visited[start.r][start.c] = true;

  let visitCount = 0;
  let visitedOrder = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while(queue.length) {
    const cur = queue.shift();
    visitCount++;
    visitedOrder.push({ r: cur.r, c: cur.c, order: ++step });

    if(cur.r === end.r && cur.c === end.c) break;

    for(const [dr, dc] of dirs) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if(nr >=0 && nr<rows && nc>=0 && nc<cols && !visited[nr][nc] && grid[nr][nc]===0) {
        visited[nr][nc] = true;
        parent[nr][nc] = cur;
        queue.push({ r:nr, c:nc });
      }
    }
  }

  // trace path
  let path = [];
  let cur = end;
  while(cur) {
    path.push(cur);
    cur = parent[cur.r]?.[cur.c];
  }
  path.reverse();

  const t1 = performance.now();

  if(!visited[end.r][end.c]) return { found:false, path:[], visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };

  return { found:true, path, visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
}

// ======================== DFS ========================
function dfs(grid, start, end, rows, cols) {
  const t0 = performance.now();
  let step = 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));

  let visitedOrder = [];
  let visitCount = 0;
  let found = false;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  function dfsVisit(r,c){
    if(found) return;
    visited[r][c] = true;
    visitCount++;
    visitedOrder.push({ r, c, order: ++step });
    if(r === end.r && c === end.c){ found = true; return; }

    for(const [dr,dc] of dirs){
      const nr = r+dr;
      const nc = c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && !visited[nr][nc] && grid[nr][nc]===0){
        parent[nr][nc] = { r,c };
        dfsVisit(nr,nc);
      }
    }
  }

  dfsVisit(start.r,start.c);

  let path = [];
  let cur = end;
  while(cur) {
    path.push(cur);
    cur = parent[cur.r]?.[cur.c];
  }
  path.reverse();

  const t1 = performance.now();

  if(!visited[end.r][end.c]) return { found:false, path:[], visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };

  return { found:true, path, visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
}

// ======================== DIJKSTRA ========================
function dijkstra(grid, start, end, rows, cols){
  const t0 = performance.now();
  let step=0;
  const dist = Array.from({ length: rows }, ()=> Array(cols).fill(Infinity));
  const visited = Array.from({ length: rows }, ()=> Array(cols).fill(false));
  const parent = Array.from({ length: rows }, ()=> Array(cols).fill(null));
  let visitedOrder = [];
  let visitCount = 0;

  dist[start.r][start.c] = 0;
  const pq = [{ ...start, d:0 }];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while(pq.length){
    pq.sort((a,b)=>a.d - b.d);
    const cur = pq.shift();
    if(cur.d !== dist[cur.r][cur.c]) continue;
    if(visited[cur.r][cur.c]) continue;
    visited[cur.r][cur.c] = true;
    visitCount++;
    visitedOrder.push({ r: cur.r, c: cur.c, order: ++step });

    if(cur.r === end.r && cur.c === end.c) break;

    for(const [dr,dc] of dirs){
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]===0){
        const nd = cur.d + 1;
        if(nd < dist[nr][nc]){
          dist[nr][nc] = nd;
          parent[nr][nc] = { r:cur.r, c:cur.c };
          pq.push({ r:nr, c:nc, d:nd });
        }
      }
    }
  }

  let path = [];
  let cur = end;
  while(cur){
    path.push(cur);
    cur = parent[cur.r]?.[cur.c];
  }
  path.reverse();

  const t1 = performance.now();

  if(!visited[end.r][end.c]) return { found:false, path:[], visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
  return { found:true, path, visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
}

// ======================== ASTAR ========================
function astar(grid,start,end,rows,cols){
  const t0 = performance.now();
  let step=0;
  const g = Array.from({ length: rows }, ()=> Array(cols).fill(Infinity));
  const visited = Array.from({ length: rows }, ()=> Array(cols).fill(false));
  const parent = Array.from({ length: rows }, ()=> Array(cols).fill(null));
  let visitedOrder = [];
  let visitCount = 0;

  const h = (r,c)=> Math.abs(r-end.r)+Math.abs(c-end.c);
  g[start.r][start.c]=0;
  const open = [{...start, f:h(start.r,start.c)}];
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];

  while(open.length){
    open.sort((a,b)=>a.f-b.f);
    const cur = open.shift();
    if(visited[cur.r][cur.c]) continue;
    visited[cur.r][cur.c]=true;
    visitCount++;
    visitedOrder.push({ r:cur.r, c:cur.c, order:++step });

    if(cur.r===end.r && cur.c===end.c) break;

    for(const [dr,dc] of dirs){
      const nr = cur.r+dr;
      const nc = cur.c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]===0){
        const ng = g[cur.r][cur.c]+1;
        if(ng<g[nr][nc]){
          g[nr][nc]=ng;
          parent[nr][nc]={r:cur.r,c:cur.c};
          open.push({ r:nr,c:nc,f:ng+h(nr,nc) });
        }
      }
    }
  }

  let path=[];
  let cur=end;
  while(cur){
    path.push(cur);
    cur = parent[cur.r]?.[cur.c];
  }
  path.reverse();
  const t1=performance.now();
  if(!visited[end.r][end.c]) return { found:false, path:[], visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
  return { found:true, path, visited:visitCount, visitedOrder, time: +(t1-t0).toFixed(2) };
}

// ======================== GREEDY ========================
function greedy(grid, start, end, rows, cols) {
  const t0 = performance.now();
  let step = 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
  let visitedOrder = [];
  let visitCount = 0;

  const h = (r, c) => Math.abs(r - end.r) + Math.abs(c - end.c);
  const open = [{ ...start, h: h(start.r, start.c) }];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (open.length) {
    open.sort((a, b) => a.h - b.h);
    const cur = open.shift();

    if (visited[cur.r][cur.c]) continue; // bỏ ô đã duyệt
    visited[cur.r][cur.c] = true;       // đánh dấu tại đây
    visitCount++;
    visitedOrder.push({ r: cur.r, c: cur.c, order: ++step });

    if (cur.r === end.r && cur.c === end.c) break;

    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
        parent[nr][nc] = { r: cur.r, c: cur.c };
        open.push({ r: nr, c: nc, h: h(nr, nc) });
      }
    }
  }

  let path = [];
  let cur = end;
  while (cur) {
    path.push(cur);
    cur = parent[cur.r]?.[cur.c];
  }
  path.reverse();

  const t1 = performance.now();
  if (!visited[end.r][end.c]) {
    return { found: false, path: [], visited: visitCount, visitedOrder, time: +(t1 - t0).toFixed(2) };
  }

  return { found: true, path, visited: visitCount, visitedOrder, time: +(t1 - t0).toFixed(2) };
}


// ======================== API ========================

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


app.post("/api/run",(req,res)=>{
  const { algo, rows, cols, start, end, grid } = req.body;
  if(!start || !end) return res.json({ found:false, message:"Missing start or end" });

  let result;
  switch(algo){
    case "BFS": result=bfs(grid,start,end,rows,cols); break;
    case "DFS": result=dfs(grid,start,end,rows,cols); break;
    case "DIJKSTRA": result=dijkstra(grid,start,end,rows,cols); break;
    case "ASTAR": result=astar(grid,start,end,rows,cols); break;
    case "GREEDY": result=greedy(grid,start,end,rows,cols); break;
    default: return res.json({ found:false, message:"Algorithm not supported" });
  }
  res.json(result); 
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});