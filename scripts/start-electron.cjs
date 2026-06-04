const { spawn } = require("node:child_process");
const electron = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

if (process.argv.includes("--dev")) {
  env.KAFKA_TOOL_DEV_SERVER_URL = "http://localhost:5173";
} else {
  delete env.KAFKA_TOOL_DEV_SERVER_URL;
}

const child = spawn(electron, ["."], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
