import pygame
import random
import numpy as np

# Game Constants
WIDTH = 600
HEIGHT = 600
BIRD_DIM = 50
FPS = 60
FPS_NORENDER = 1000
GRAVITY = 0.5
JUMP_FORCE = 8
PIPE_GAP = 200
PIPE_SPEED = 3
HOLE_MARGIN = 0.25
PIPE_WIDTH = 100
MAX_TIME = 1000
#LIVING_REWARD

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
LINE_COLOR = (255, 255, 0)  # Yellow color for the line

random.seed(10)


class Bird(pygame.sprite.Sprite):
    def __init__(self):
        pygame.sprite.Sprite.__init__(self)
        self.image = pygame.Surface((BIRD_DIM, BIRD_DIM))
        self.image.fill(RED)
        self.rect = self.image.get_rect()
        self.rect.center = (WIDTH // 5, HEIGHT // 2)
        self.velocity = 0

    def update(self):
        self.velocity += GRAVITY
        self.rect.y += self.velocity

    def jump(self):
        self.velocity = -JUMP_FORCE


class Pipe(pygame.sprite.Sprite):
    def __init__(self, y, top_or_bot: str):
        pygame.sprite.Sprite.__init__(self)
        self.y = y
        self.top_or_bot = top_or_bot
        if top_or_bot == "bot":
            self.image = pygame.Surface((PIPE_WIDTH, y - PIPE_GAP / 2))
        else:
            self.image = pygame.Surface((PIPE_WIDTH, HEIGHT - (y + PIPE_GAP / 2)))
        self.rect = self.image.get_rect()
        self.image.fill(GREEN)
        if top_or_bot == "top":
            self.rect.bottomleft = (WIDTH, HEIGHT)
        else:
            self.rect.topleft = (WIDTH, 0)


    def update(self):
        self.rect.x -= PIPE_SPEED
        if self.rect.right < 0: 
            self.kill()
            del self

def game_instance(agent=None, render=False):
    random.seed(10)
    # Initialize pygame and create a window
    pygame.init()
    if render:
        screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Flappy Bird")
    else:
        screen = pygame.Surface((WIDTH, HEIGHT))
        pygame.display.quit()
    clock = pygame.time.Clock()

    # Create game objects
    all_sprites = pygame.sprite.Group()
    pipes = pygame.sprite.Group()
    bird = Bird()
    all_sprites.add(bird)

    # Store action/reward/state/sucessor
    data = []

    # Draw random jumping rate
    jump_prob = random.randint(15, 25)

    # Game loop
    running = True
    time = 0
    passes = False
    while running and time < MAX_TIME:
        time += 1
        # Keep the loop running at the right speed
        if render:
            clock.tick(FPS)
        else:
            clock.tick(FPS_NORENDER)
        
        # Generate new pipes
        if len(pipes) == 0:
            passed = False
            y = random.uniform(HOLE_MARGIN * HEIGHT, (1 - HOLE_MARGIN) * HEIGHT)
            pipe_bot = Pipe(y, top_or_bot="bot")
            pipe_top = Pipe(y, top_or_bot="top")
            pipes.add([pipe_bot, pipe_top])
            all_sprites.add([pipe_bot, pipe_top])

        # record state before action
        state = np.array(((pipe_bot.rect.bottomleft[1] - bird.rect.center[1]), 
            (bird.velocity), 
            (pipe_bot.rect.topleft[0] - bird.rect.center[0]), 
            (pipe_top.rect.topleft[1] - bird.rect.center[1])))
        action = 0

        # Process input/events
        if render:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_SPACE:
                        bird.jump()
                        action = 1
        
        if agent != None and agent.get_action(state, jump_prob):
            bird.jump()
            action = 1

        # Update
        all_sprites.update()

        # Check for collisions
        if pygame.sprite.spritecollide(bird, pipes, False) or \
            bird.rect.center[1] < BIRD_DIM / 2 or \
                bird.rect.center[1] > HEIGHT - BIRD_DIM / 2:
            running = False

        # record state after action
        state_post = np.array(((pipe_bot.rect.bottomleft[1] - bird.rect.center[1]), 
            (bird.velocity), 
            (pipe_bot.rect.topleft[0] - bird.rect.center[0]), 
            (pipe_top.rect.topleft[1] - bird.rect.center[1])))
        reward = 0.1
        if bird.rect.center[0] > pipe_bot.rect.bottomleft[0]\
            and not passed:
            passed = True
            reward = 1
            print("hey")
        if not running:
            reward = -1
            state_post = (0, 0, 0, 0)

        # record action/reward/state/sucessor
        data.append([action, reward, state, state_post])

        # Draw/render

        screen.fill(BLUE)
        all_sprites.draw(screen)
        if render and len(pipes) > 0:
            pygame.draw.line(screen, LINE_COLOR, bird.rect.center, (pipe_bot.rect.center[0], pipe_bot.y))
            pygame.draw.line(screen, LINE_COLOR, bird.rect.center, (pipe_bot.rect.topleft[0], bird.rect.center[1]))
            pygame.draw.line(screen, LINE_COLOR, bird.rect.center, (bird.rect.center[0], pipe_top.rect.topleft[1]))
            pygame.draw.line(screen, LINE_COLOR, bird.rect.center, (bird.rect.center[0], pipe_bot.rect.bottomleft[1]))

            pygame.display.flip()
    del bird
    del screen
    
    all_sprites.empty()
    pipes.empty()

    # Quit the game
    pygame.display.quit()
    pygame.quit()
    
    return time, data