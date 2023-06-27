import random
import numpy as np

class ExperienceReplay():

    def __init__(self, max_size=1000):
        self.experiences = []
        self.max_size = max_size

    def add(self, experiences):
        self.experiences += experiences
        if len(self.experiences) > self.max_size:
            self.experiences = random.sample(self.experiences, self.max_size)
        return
    
    def sample_minibatch(self, batch_size):
        exps0 = [exp for exp in self.experiences if exp[1] == -1]
        return random.sample(exps0, min(len(exps0), batch_size // 4)) + \
            random.sample(self.experiences, batch_size // 2)