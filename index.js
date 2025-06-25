
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const bots = [
  { name: "bot1", path: "bots/bot1/main.py", process: null },
  { name: "bot2", path: "bots/bot2/main.py", process: null },
  { name: "bot3", path: "bots/bot3/main.py", process: null }
];

// Painel
app.use(express.static("public"));

app.get("/status", (req, res) => {
  res.json(bots.map(bot => ({
    name: bot.name,
    running: !!bot.process
  })));
});

// Start bots
bots.forEach(bot => {
  const fullPath = path.join(__dirname, bot.path);
  const proc = spawn("python3", [fullPath]);
  bot.process = proc;

  proc.stdout.on("data", data => {
    io.emit("log", `[${bot.name}] ${data.toString()}`);
  });

  proc.stderr.on("data", data => {
    io.emit("log", `[${bot.name} ERROR] ${data.toString()}`);
  });

  proc.on("close", code => {
    io.emit("log", `[${bot.name}] finalizado com código ${code}`);
    bot.process = null;
  });
});

// Anti-idle para Glitch
setInterval(() => {
  require("http").get("https://" + process.env.PROJECT_DOMAIN + ".glitch.me");
}, 300000);

io.on("connection", socket => {
  socket.emit("log", "🟢 Conectado ao painel!");
});

server.listen(3000, () => {
  console.log("✅ Servidor rodando na porta 3000");
});
