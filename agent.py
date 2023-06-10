import numpy as np
import random
import tensorflow as tf
from tqdm import tqdm
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
        self.main = tf.keras.models.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(5,)),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(2, activation='linear')])
        self.main.compile(loss='mse', optimizer='adam', metrics=['mae'])


        self.target = tf.keras.models.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(5,)),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(2, activation='linear')])
        self.target.compile(loss='mse', optimizer='adam', metrics=['mae'])


    def q_value(self, state):
        if not state[4]:
            return 0
        else:
            return np.max(self.main.predict(state.reshape((1, -1)), verbose=0))

    def get_action(self, input: np.array):
        if random.random() < self.epsilon:
            return np.random.choice(np.array([0, 1]), 1)
        else:
            return np.argmax(self.main.predict(input.reshape((1, -1)), verbose=0))
    
        
    def train(self, 
        num_games: int, 
        num_episodes: int, 
        num_cycles):
        for i in tqdm(range(num_episodes)):
            self.epsilon = 0
            game_instance(agent=self, render=True)
            game_instance(agent=self, render=True)
            self.epsilon = 0.2
            experience_replay = []
            for k in range(num_games):
                data = game_instance(agent=self, render=False)
                experience_replay += data
            for l in range(num_cycles):
                X = []
                Y = []
                cycle_data = random.choices(experience_replay, 
                    k=len(experience_replay))
                for j in range(len(cycle_data)):
                    target_q = cycle_data[j][1] + \
                        self.gamma * self.q_value(cycle_data[j][3])
                    preds = self.main.predict(cycle_data[j][2].reshape(1, -1), verbose=0)
                    preds[0, cycle_data[j][0]] = target_q
                    X.append(cycle_data[j][2])
                    Y.append(preds)
                self.main.fit(np.array(X), np.array(Y), batch_size=10, epochs=10, verbose=0)
                self.target.set_weights(self.main.get_weights())

agent = LearningAgent(lr=0.01, epsilon=0.2, gamma=0.5)
agent.train(num_episodes=20, num_games=10, num_cycles=10)
agent.main.save("main")
agent.target.save("target")