// Game Constants
const WIDTH = 300;
const HEIGHT = 500;
const BIRD_DIM = 25;
const FPS = 60;
const FPS_NORENDER = 1000;
const GRAVITY = 0.5;
const JUMP_FORCE = 8;
const PIPE_GAP = 100;
const PIPE_SPEED = 3;
const HOLE_MARGIN = 0.25;
const PIPE_WIDTH = 50;
const SPACEBAR_CODE = 32

// Colors
const WHITE = "#ffffff";
const BLACK = "#000000";
const BLUE = "#000000";
const GREEN = "#00ff00";
const RED = "#ff0000";
const LINE_COLOR = "#ffff00";

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

// Function to generate pipes at random position
function generatePipes() {
  const y = HOLE_MARGIN * HEIGHT + Math.random() * (HEIGHT * (1 - 2 * HOLE_MARGIN));
  const pipe_bot = new Pipe(y, "bot");
  const pipe_top = new Pipe(y, "top");
  return [pipe_bot, pipe_top]
}

// Function to create time counter element
function createTimeCounter(document, canvas) {
  // Get the absolute coordinates of the top-left corner
  const canvasRect = canvas.getBoundingClientRect();
  const canvasTop = canvasRect.top + window.pageYOffset;
  const canvasRight = canvasRect.right + window.pageXOffset;

  // Create a counter element
  const timeCounter = document.createElement("div");
  timeCounter.style.position = "absolute";
  timeCounter.style.top = canvasTop + "px";
  timeCounter.style.right = canvasRight + "px";
  timeCounter.style.color = BLACK;
  timeCounter.style.fontSize = "24px";
  document.body.appendChild(timeCounter);
  return timeCounter
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
  context.fillStyle = BLUE;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = RED;
  context.fillRect(bird.x, bird.y, BIRD_DIM, BIRD_DIM);
  context.fillStyle = GREEN;
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

function gameInstance(agent = null, render = false, canvas, context) {

  // Create game objects and control variables
  const bird = new Bird();
  var pipes = [];
  const data = [];
  let running = true;
  let time = 0;
  let passed = false;

  // Add event listener for jumping
  document.addEventListener('keydown', function(event) {
    if (event.keyCode === SPACEBAR_CODE) {
      event.preventDefault();
      bird.jump();
      action = 1;
    }
  });

  // Create counter element
  timeCounter = createTimeCounter(document, canvas)

  function gameLoop() {
    // Elapse time
    time += 1;
    let action = 0;
    timeCounter.innerText = "Time: " + time;

    // Generate new pipes
    if (pipes.length === 0) {
      passed = false;
      [pipe_bot, pipe_top] = generatePipes()
      pipes.push(pipe_bot, pipe_top);
    }

    // Record state before action
    const state = [
      pipes[0].y - bird.y,
      bird.velocity,
      pipes[0].x - bird.x,
      pipes[1].y - bird.y,
    ];

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

    // Delete pipe if it is off screen.
    if (pipes[0].x + PIPE_WIDTH < 0) {
      pipes = []
    }

    // Draw, render
    draw(context, pipes, bird)
    
    // Animation, or end game
    if (running) {
      requestAnimationFrame(gameLoop);
    } else {
      return [time, data];
    }
  }
  gameLoop();
}

function create_canvas() {
  // Create canvas element
  const canvas_container = document.createElement("div");
  canvas_container.style.border = "10px solid yellow";
  const canvas = document.createElement("canvas");
  canvas_container.appendChild(canvas);
  const context = canvas.getContext("2d");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  document.body.appendChild(canvas_container)
  context.fillStyle = BLUE;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  return [canvas, context]
}

function showStartScreen() {
  // Create canvas element
  const [canvas, context] = create_canvas()

  // Create a container div for centering the button
  const container = document.createElement("div");
  const canvasRect = canvas.getBoundingClientRect();

  // Get the absolute coordinates of the top-left corner
  const canvasTop = canvasRect.top + window.pageYOffset;
  const canvasLeft = canvasRect.left + window.pageXOffset;

  container.style.position = "absolute";
  container.style.top = canvasTop + "px"
  container.style.left = canvasLeft + "px"
  container.style.width = canvas.width + "px";
  container.style.height = canvas.height + "px";
  document.body.appendChild(container);

  // Create the start button
  const startButton = document.createElement("button");
  startButton.innerText = "Start Game";
  startButton.addEventListener("click", () => {
    // Remove start button and start the game
    document.body.removeChild(container);
    gameInstance(null, true, canvas, context);
    document.body.appendChild(container);
  });
  container.appendChild(startButton);
}

showStartScreen();
showStartScreen();