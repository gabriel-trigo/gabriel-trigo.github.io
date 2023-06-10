import tensorflow as tf
from game import game_instance
from agent import LearningAgent

# Load the SavedModel
loaded_model = tf.keras.models.load_model("main")

agent = LearningAgent(lr=0.01, epsilon=0, gamma=0.5)
agent.main = loaded_model
agent.target = loaded_model

game_instance(agent=agent, render=True)

