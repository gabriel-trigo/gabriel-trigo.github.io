import tqdm
import jsonlines
import matplotlib.pyplot as plt
import tensorflow as tf
import json
from experience_replay import ExperienceReplay
from qlearning_agent import QlearningAgent
from game import game_instance

def train_sprint(prev_model=None, 
    num_prepopulate=50, 
    num_games=10, 
    batch_size=50, 
    render_every=None, 
    results_folder=None, 
    save_every=None, 
    batches_per_game=10):

    if results_folder == None: 
        print("No results folder.")
        return

    # Create agent and experience memory
    agent = QlearningAgent()
    if  prev_model != None:
        agent.load(prev_model)

    # Pre-populate
    data = []
    for i in range(num_prepopulate):
        data += game_instance(agent=None, render=False)[1]
    memory = ExperienceReplay(max_size=50000)
    memory.add(data)

    scores = []
    losses = []
    model_num = 0
    for i in tqdm.tqdm(range(num_games)):
        if render_every != None and i % render_every == 0:
            score, new_data = game_instance(agent=agent, render=True)
        else:
            score, new_data = game_instance(agent=agent, render=False)
        for j in range(batches_per_game):
            batch = memory.sample_minibatch(batch_size=batch_size)
            loss = agent.learn(mini_batch=batch)
            losses.append(loss)
        memory.add(new_data)
        scores.append(score)
        if save_every != None and i % save_every == 0:
            agent.save("{}/model_{}".format(results_folder, model_num))
            model_num += 1

    scores_dict = {"scores": scores, "losses": losses}
    with open("{}/scores".format(results_folder), 'w') as json_file:
        json.dump(scores_dict, json_file)


train_sprint(results_folder="trial_jun-27-2", 
    num_games=10000, 
    render_every=50, 
    batch_size=32, 
    batches_per_game=10, 
    save_every=1000)
