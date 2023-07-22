import random
import numpy as np
import tensorflow as tf
import json
from goated_nn import QNetwork
from experience_replay import ExperienceReplay

class RandomAgent():

    def __init__(self, jump_freq: float):
        self.jump_freq = jump_freq # average number of frames until a jump.

    def get_action(self, input: np.array):
        if random.random() < 1 / self.jump_freq:
            return 1 # jump
        return 0 # don't

class QlearningAgent():

    def __init__(self, eps_start=1.0, 
        eps_stop=0.01, 
        eps_decay=0.9999, 
        gamma=0.5, 
        hidden_size=5, 
        lr=0.01, 
        lr_decay=0.9999, 
        lr_stop=0.001):

        self.eps_start = eps_start
        self.eps_stop = eps_stop
        self.eps_decay = eps_decay
        self.eps = self.eps_start
        self.lr = lr
        self.lr_decay = lr_decay
        self.lr_stop = lr_stop
        self.gamma = gamma
        self.hidden_size = hidden_size
        self.nn = QNetwork(learning_rate=lr, 
            hidden_size=hidden_size)

    def get_action(self, state, jump_prob):
        if random.random() < self.eps:
            if random.random() < 1 / jump_prob: 
                return 1
            return 0
        else:
            Qs = self.nn.predict([state])
        return np.argmax(Qs)
    
    def learn(self, mini_batch):
        inputs = [el[2] for el in mini_batch]
        actions = [el[0] for el in mini_batch]
        rewards = [el[1] for el in mini_batch]
        post = [el[3] for el in mini_batch]

        targetQs = rewards + self.gamma * np.max(self.nn.predict(post), axis=1)
        loss = self.nn.train(inputs, actions, targetQs)
        self.eps = max(self.eps_stop, self.eps_decay * self.eps)
        self.lr = max(self.lr_stop, self.lr * self.lr_decay)
        
        return loss
    
    def save(self, path):
        self.nn.model.save("{}/model".format(path))
        attribute_dict = {
            "eps_start": self.eps_start, 
            "eps_stop": self.eps_stop, 
            "eps_decay": self.eps_decay, 
            "gamma": self.gamma, 
            "hidden_size": self.hidden_size, 
            "lr": self.lr, 
            "lr_decay": self.lr_decay, 
            "lr_stop": self.lr_stop, 
            "eps": self.eps
        }
        with open("{}/params".format(path), 'w') as file:
            json.dump(attribute_dict, file)
        return

    def load(self, path):
        prev_model = tf.keras.models.load_model("{}/model".format(path))
        with open("{}/params".format(path), 'r') as json_file:
            p = json.load(json_file)
        self.nn.model.set_weights(prev_model.get_weights())
        self.eps_start = p["eps_start"]
        self.eps_stop = p["eps_stop"]
        self.eps_decay = p["eps_decay"]
        self.eps = p["eps"]
        self.lr = p["lr"]
        self.lr_decay = p["lr_decay"]
        self.lr_stop = p["lr_stop"]
        self.gamma = p["gamma"]
        self.hidden_size = p["hidden_size"]
        return