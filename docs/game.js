// Constants
import { WIDTH, HEIGHT, BIRD_DIM, FPS, FPS_NORENDER, GRAVITY, JUMP_FORCE, 
  PIPE_GAP, PIPE_SPEED, HOLE_MARGIN, PIPE_WIDTH, SPACEBAR_CODE, BACKGROUND, 
  PIPES_COLOR, BIRD_COLOR, LINE_COLOR, BLACK, OFFBLACK } from "https://gabriel-trigo.github.io/constants.js"
import { load_models, plot_heatmap, update_data, predict } from "https://gabriel-trigo.github.io/heatmap.js"
import { generateNodesLinks, myGraph } from "https://gabriel-trigo.github.io/graph.js"

// Bird class
class Bird {
  constructor() {
    this.x = WIDTH / 5;
    this.y = HEIGHT / 2;
    this.velocity = 0;
  }

  update() {
    this.velocity += GRAVITY;
    this.y += this.velocity;
  }

  jump() {
    this.velocity = -JUMP_FORCE;
  }
}

// Pipe class
class Pipe {
  constructor(y, topOrBot) {
    this.y = y;
    this.topOrBot = topOrBot;
    if (topOrBot === "bot") {
      this.height = y - PIPE_GAP / 2;
    } else {
      this.height = HEIGHT - (y + PIPE_GAP / 2);
    }
    this.x = WIDTH;
  }

  update() {
    this.x -= PIPE_SPEED;
  }
}

class Agennt {
  constructor(model) {

  }
}

// Function to generate pipes at random position
function generatePipes() {
  const y = HOLE_MARGIN * HEIGHT + Math.random() * (HEIGHT * (1 - 2 * HOLE_MARGIN));
  const pipe_bot = new Pipe(y, "bot");
  const pipe_top = new Pipe(y, "top");
  return [pipe_bot, pipe_top]
}

// Function to check for collisions
function checkCollision(pipes, bird) {
  return (
      pipes.some((pipe) => 
        (bird.x < pipe.x + PIPE_WIDTH &&
        bird.x + BIRD_DIM > pipe.x &&
        bird.y < pipe.y - PIPE_GAP / 2 &&
        pipe.topOrBot == "bot") || (
        bird.x < pipe.x + PIPE_WIDTH &&
        bird.x + BIRD_DIM > pipe.x &&
        bird.y + BIRD_DIM > pipe.y + PIPE_GAP / 2 &&
        pipe.topOrBot == "top")) 
      ||
      (bird.y < BIRD_DIM / 2 ||
      bird.y > HEIGHT - BIRD_DIM / 2)
  )
}

// Function to draw
function draw(context, pipes, bird) {
  // Draw, render
  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = BIRD_COLOR;
  context.fillRect(bird.x, bird.y, BIRD_DIM, BIRD_DIM);
  context.fillStyle = PIPES_COLOR;
  pipes.forEach((pipe) => {
    if (pipe.topOrBot === "bot") {
      context.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.height);
    } else {
      context.fillRect(pipe.x, pipe.y + PIPE_GAP / 2, PIPE_WIDTH, pipe.height);
    }
  });

  // Render position lines
  if (pipes.length > 0) {
    context.strokeStyle = LINE_COLOR;
    context.beginPath();
    context.moveTo(bird.x + BIRD_DIM / 2, bird.y + BIRD_DIM / 2);
    context.lineTo(pipes[0].x + PIPE_WIDTH / 2, pipes[0].y);
    context.stroke();
  }
}

// Function to create the canvas
function create_canvas() {
  // Create canvas element
  const canvas_col = document.getElementById("game")
  const canvas = document.createElement("canvas");

  canvas_col.appendChild(canvas);
  const context = canvas.getContext("2d");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  return [canvas, context]
}

function gameInstance(agent=null, 
  render=false, 
  canvas, 
  context, 
  svg, x, y, button, nodesLinks) {

  // Create game objects and control variables
  const data = [];
  const bird = new Bird();
  var pipes = [];
  let running = true;
  let time = 0;
  let passed = false;

  // Add event listener for jumping
  document.addEventListener('keydown', function(event) {
    if (event.keyCode === SPACEBAR_CODE) {
      event.preventDefault();
      bird.jump();
      let action = 1;
    }
  });

  // Create counter element
  const timeCounter = document.getElementById("counter")

  function gameLoop() {
    // Elapse time
    time += 1;
    let action = 0;
    timeCounter.innerText = "Score: " + time;

    // Generate new pipes
    if (pipes.length === 0) {
      passed = false;
      var [pipe_bot, pipe_top] = generatePipes()
      pipes.push(pipe_bot, pipe_top);
    }

    // Record state before action
    const state = [
      pipes[0].y - bird.y,
      bird.velocity,
      pipes[0].x - bird.x,
      pipes[1].y - bird.y,
    ];

    var result = predict(model_promises[4], [state])
    result.then((resData) => {
      const values = resData.arraySync()
      var l = nodesLinks[0].length
      nodesLinks[0][l - 1].name = values[0][0]
      nodesLinks[0][l - 2].name = values[0][1]
    })

    // Process input/events
    if (agent !== null && agent.get_action(state, jump_prob)) {
      bird.jump();
      action = 1;
    }

    // Update
    bird.update();
    pipes.forEach((pipe) => pipe.update());

    // Check for collisions
    if (checkCollision(pipes, bird)) {
      running = false;
    }

    // Record state after action
    var state_post = [
      pipes[0].y - bird.y,
      bird.velocity,
      pipes[0].x - bird.x,
      pipes[1].y - bird.y,
    ];

    // Define reward based on outcome
    let reward = 0.1;
    if (bird.x > pipes[0].x + PIPE_WIDTH && !passed) {
      passed = true;
      reward = 1;
    }
    if (!running) {
      reward = -1;
      state_post = [0, 0, 0, 0];
    }

    // Record action/reward/state/successor
    data.push([action, reward, state, state_post]);
    nodesLinks[0][0].name = state_post[0]
    nodesLinks[0][1].name = state_post[1]
    nodesLinks[0][2].name = state_post[2]
    nodesLinks[0][3].name = state_post[3]


    // Draw, render
    draw(context, pipes, bird);

    // Update heatmap
    if (time % 1  == 0) {
      update_data(model_promises, pipes[0].y, pipes[0].x - bird.x, svg, x, y);
    }

    // Delete pipe if it is off screen.
    if (pipes[0].x + PIPE_WIDTH < 0) {
      pipes = []
    }
    
    // Animation, or end game
    if (running) {
      requestAnimationFrame(gameLoop);
    } else {
      button.style.visibility = 'visible';
      return [time, data];
    }
  }
  gameLoop();
}

function showStartScreen(num, data) {
  // Create canvas and heatmap
  const [canvas, context] = create_canvas(num)
  var [svg, x, y] = plot_heatmap();

  // Create a container div for centering the button
  const container = document.createElement("div");
  const canvasRect = canvas.getBoundingClientRect();

  // Create a container div for centering the button
  container.style.position = "absolute";
  container.style.top = `${canvasRect.top}px`;
  container.style.left = `${canvasRect.left}px`;
  container.style.width = `${canvasRect.width}px`;
  container.style.height = `${canvasRect.height}px`;
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  document.body.appendChild(container);

  // Create the start button
  const startButton = document.createElement("button");
  startButton.innerText = "Start Game";
  startButton.classList.add("bg-gray-100", 
    "hover:bg-gray-400", "text-black", 
    "font-semibold", "py-2", "px-4", "border-b-4", 
    "border-gray-700", "hover:border-gray-500", 
    "rounded", "text-2xl", "font-mono")
  
  startButton.addEventListener("click", () => {
    startButton.style.visibility = 'hidden';
    // Remove start button and start the game
    gameInstance(null, true, canvas, context, svg, x, y, startButton, data);
  });
  container.appendChild(startButton);
}

function extractWeights(model_promises) {
  const netLayers = model_promises[0].then((data) => {
    const layers = data.layers;
    const nodes = layers.map((el) => {
      if (el.id != 0) {
        return {
          id: el.id,
          size: el.units,
          weights: el.getWeights()[0].array(), 
          biases: el.getWeights()[1].array()
        }
      }

      else {
        return {
          id: el.id, 
          size: el.inputSpec[0].shape[1], 
          weights: Promise.resolve([1]), 
          biases: Promise.resolve([1])
        }
      }
    })
    return nodes
  })
  return netLayers
}

const model_promises = load_models();
const layers = extractWeights(model_promises);
var nodesLinks = generateNodesLinks(layers);
nodesLinks.then((data) => {
  myGraph(data[0], data[1])
  setTimeout(() => {
    console.log("After 5 seconds");
  }, 1);

  showStartScreen(1, data);
})