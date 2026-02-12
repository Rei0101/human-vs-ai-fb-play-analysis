import { game } from "./index.js";
import Pipes from "./pipes.js";

let activeReplayId = 0;

function parseCSV(csvText, maxFrames = 100000) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",");
  const dataLines = lines.slice(1, maxFrames + 1);

  return dataLines.map((line) => {
    const values = line.split(",");
    let obj = {};
    headers.forEach((header, i) => {
      let value = values[i];
      if (header === "pipes" && value) {
        try {
          obj[header] = JSON.parse(atob(value));
        } catch { obj[header] = []; }
      } else if (!isNaN(value) && value !== "") {
        obj[header] = parseFloat(value);
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
}
function applyMetadataToGame(game, meta) {
  game.AGENT_TYPE = meta.agent_type;

  game.GAME_WIDTH = Number(meta.game_width);
  game.GAME_HEIGHT = Number(meta.game_height);

  game.BIRD_WIDTH = Number(meta.bird_width);
  game.BIRD_HEIGHT = Number(meta.bird_height);
  game.GRAVITY = Number(meta.gravity);

  game.PIPE_GAP = Number(meta.pipe_gap);
  game.PIPE_WIDTH = Number(meta.pipe_width);
  game.PIPE_VELOCITY = Number(meta.pipe_velocity);
  game.PIPES_INTERVAL = Number(meta.pipes_interval);

  game.BIRD_X_RATIO = Number(meta.bird_x_ratio);
  game.bird.x = game.GAME_WIDTH * game.BIRD_X_RATIO;
}
function objectToSingleRowCSV(obj) {
  const headers = Object.keys(obj).join(",");
  const values = Object.values(obj).join(",");
  return headers + "\n" + values;
}
function framesToCSV(frames) {
  const headers = Object.keys(frames[0]).join(",");
  const rows = frames.map((frame) => Object.values(frame).join(","));
  return [headers, ...rows].join("\n");
}

document.getElementById("importGame").addEventListener("click", () => {
  if (!game.gameIsOver) {
    alert("Sorry, can't import game right now.");
    return;
  }

  document.getElementById("fileInput").click();
});
document.getElementById("fileInput").addEventListener("change", function (e) {
  if (!game.gameIsOver) {
    alert("Sorry, can't import game right now.");
    return;
  }

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      activeReplayId++;
      const currentReplayId = activeReplayId;

      game.gameIsImported = false;
      game.gameIsOver = true;

      const zip = await JSZip.loadAsync(event.target.result);

      if (!zip.file("frames.csv") || !zip.file("metadata.csv")) {
        throw new Error("Invalid replay ZIP");
      }

      const metaCSV = await zip.file("metadata.csv").async("string");
      const metadata = parseCSV(metaCSV)[0];

      const framesBuffer = await zip.file("frames.csv").async("uint8array");

      const MAX_BYTES = 20 * 1024 * 1024; 
      const slicedBuffer = framesBuffer.slice(0, MAX_BYTES);

      let framesCSV = new TextDecoder().decode(slicedBuffer);

      if (framesBuffer.length > MAX_BYTES) {
          framesCSV = framesCSV.substring(0, framesCSV.lastIndexOf("\n"));
          console.warn("Replay truncated: File was too large for browser memory.");
      }

      const frames = parseCSV(framesCSV);

      game.reset();
      applyMetadataToGame(game, metadata);

      game.gameIsImported = true;
      game.gameIsOver = false;

      let currentFrame = 0;

      const REPLAY_INTERVAL = 16.67; 
      let lastTime = 0;

      function runReplay(timestamp) {
        if (currentReplayId !== activeReplayId) return;

        if (!lastTime) lastTime = timestamp;

        const deltaTime = timestamp - lastTime;

        if (deltaTime >= REPLAY_INTERVAL) {
            lastTime = timestamp - (deltaTime % REPLAY_INTERVAL);

            if (currentFrame < frames.length) {
              const data = frames[currentFrame];

              game.bird.y = data.bird_y;
              game.bird.velocity = data.bird_velocity;
              game.points = data.score;
              game.frameId = data.frame_id;

              if (data.pipes && data.pipes.length > 0) {
                game.pipes = data.pipes.map(p => {
                  const pipe = new Pipes(game);
                  pipe.x = p.x;
                  pipe.topY = p.top_y;
                  pipe.botY = p.bot_y;
                  pipe.passed = p.passed;
                  pipe.topHeight = p.top_y;
                  pipe.botHeight = game.GAME_HEIGHT - p.bot_y;
                  return pipe;
                });
              } else {
                  game.pipes = [];
              }

              currentFrame++;
            } else {
              console.log("Replay finished.");
              game.episodeId = -1;
              game.gameIsImported = false;
              game.gameIsOver = true;
              document.getElementById("fileInput").value = "";
              return; 
            }
        }

        requestAnimationFrame(runReplay);
      }

      requestAnimationFrame(runReplay);
    } catch (err) {
      console.error(err);
      alert("Failed to import replay: " + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
});

document.getElementById("exportGame").addEventListener("click", async () => {
  if (game.frameStates.length === 0 || !game.gameIsOver) {
    game.gameIsOver = true;
    alert("Sorry, can't export the game state right now.");
    return;
  }

  game.episodeId = -1;

  const zip = new JSZip();

  const framesCSV = framesToCSV(game.frameStates);
  const metadataCSV = objectToSingleRowCSV(game.metadata);

  zip.file("frames.csv", framesCSV);
  zip.file("metadata.csv", metadataCSV);

  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const [currentDate, currentTime] = [
    [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join(""),
    [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(
      ""
    ),
  ];

  a.download = `flappy_bird_game_${currentDate}_${currentTime}.zip`;
  a.click();
});
