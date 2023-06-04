import numpy as np
import random
from tqdm import tqdm
from network import Network
from game import game_instance

class RandomAgent():

    def __init__(self, jump_freq: float):
        self.jump_freq = jump_freq # average number of frames until a jump.

    def get_action(self, input: np.array):
        if random.random() > 1 / self.jump_freq:
            return 0 # don't jump
        return 1 # jump

class LearningAgent():

    def __init__(self, 
            lr: float, 
            epsilon: float, 
            gamma: float):
        self.lr = lr
        self.epsilon = epsilon
        self.gamma = gamma
        self.main = Network([5, 50, 25, 10, 5, 2])
        self.target = Network([5, 50, 25, 10, 5, 2])

    def q_value(self, state):
        if not state[4]:
            return 0
        else:
            #print(np.max(self.main.feedforward(state)[1][-1]))
            return np.max(self.main.feedforward(state)[1][-1])

    def get_action(self, input: np.array):
        if random.random() < self.epsilon:
            return np.random.choice(np.array([0, 1]), 1)
        else:
            activations = self.main.feedforward(input)[1]
            #print("chose", np.argmax(activations[-1]))
            return np.argmax(activations[-1])
    
        
    def train(self, 
        num_games: int, 
        num_episodes: int):
        for i in tqdm(range(num_episodes)):
            X = []
            Y = []
            for k in range(num_games):
                if i % 10 == 0 and k == 0:
                    data = game_instance(agent=self, render=True)
                else:
                    data = game_instance(agent=self, render=False)
                data_nn = []
                for j in range(len(data)):
                    target_q = data[j][1] + \
                        self.gamma * self.q_value(data[j][3])
                    preds = self.main.feedforward(data[j][2])[1][-1]
                    #print(preds)
                    preds[data[j][0]] = target_q
                    #print("training on", preds)
                    print(preds)
                    data_nn.append((data[j][2], np.array([[2], [2]])))
            self.main.SGD(data_nn, epochs=100, alpha=self.lr, decay=1)
            self.target.weights = self.main.weights
            self.target.biases = self.main.biases

agent = LearningAgent(lr=0.01, epsilon=0.5, gamma=0.5)
agent.train(num_episodes=100, num_games=10)