import random
from tqdm import tqdm
import numpy as np


class Network(object):
    def __init__(self, sizes):
        """
        Args:
            sizes (List[int]): Contains the size of each layer in the network.
        """
        self.num_layers = len(sizes)
        self.sizes = sizes
        self.biases = [np.random.randn(y, 1) for y in sizes[1:]]
        self.weights = [np.random.randn(y, x) for x, y in zip(sizes[:-1], sizes[1:])]

    """
    4.1 Feed forward the input x through the network.
    """

    def feedforward(self, x):
        """
        Args:
            x (npt.array): Input to the network.
        Returns:
            List[npt.array]: List of weighted input values to each node
            List[npt.array]: List of activation output values of each node
        """
        zs, activations = [], [x]

        for i in range(self.num_layers - 1):
            zi = self.weights[i] @ x + self.biases[i]
            act = sigmoid(zi)

            zs.append(zi)
            activations.append(act)
            
            x = act

        return zs, activations


    """
    4.2 Backpropagation to compute gradients.
    """

    def backprop(self, x, y, zs, activations):
        """
        Args:
            x (npt.array): Input vector.
            y (float): Target value.
            zs (List[npt.array]): List of weighted input values to each node.
            activations (List[npt.array]): List of activation output values of each node.
        Returns:
            List[npt.array]: List of gradients of bias parameters.
            List[npt.array]: List of gradients of weight parameters.
        """

        # output layer.
        delta_output = self.loss_derivative(activations[-1], y) \
            * sigmoid_prime(zs[-1])
        
        deltas = [delta_output]
        delta_l = delta_output

        for l in range(len(self.weights) - 1, 0, -1):
            delta_l = self.weights[l].T @ delta_l * sigmoid_prime(zs[l - 1])
            deltas.insert(0, delta_l)

        grad_bias = deltas
        grad_weights = [np.outer(deltas[i], activations[i]) for i in\
            range(len(deltas))]
        
        return grad_bias, grad_weights

    """
    4.3 Update the network's biases and weights after processing a single mini-batch.
    """

    def update_mini_batch(self, mini_batch, alpha):
        """
        Args:
            mini_batch (List[Tuple]): List of (input vector, output value) pairs.
            alpha: Learning rate.
        Returns:
            float: Average loss on the mini-batch.
        """
        grad_b, grad_w = None, None
        loss = 0

        for input, target in mini_batch:
            zs, activations = self.feedforward(input)

            nabla_b, nabla_w = self.backprop(input, target, zs, activations)
            if grad_b is None:
                grad_b = nabla_b
                grad_w = nabla_w
            
            else:
                for i, b in enumerate(nabla_b):
                    grad_b[i] += b
                for i, w in enumerate(nabla_w):
                    grad_w[i] += w

            loss += self.loss_function(activations[-1], target)
        
        for i in range(len(self.biases)):
            self.biases[i] -= (alpha / len(mini_batch)) * grad_b[i]
            self.weights[i] -= (alpha / len(mini_batch)) * grad_w[i]

        return loss


    """
    Train the neural network using mini-batch stochastic gradient descent.
    """

    def SGD(self, data, epochs, alpha, decay, batch_size=32, test=None):
        n = len(data)
        losses = []
        for j in range(epochs):
            #print(f"training epoch {j+1}/{epochs}")
            random.shuffle(data)
            for k in range(n // batch_size):
                mini_batch = data[k * batch_size : (k + 1) * batch_size]
                loss = self.update_mini_batch(mini_batch, alpha)
                losses.append(loss)
            alpha *= decay
            if test:
                pass
                #print(f"Epoch {j+1}: eval accuracy: {self.evaluate(test)}")
            else:
                pass
                #print(f"Epoch {j+1} complete")
        print(np.sum(losses))
        return losses

    """
    Returns classification accuracy of network on test_data.
    """

    def evaluate(self, test_data):
        test_results = [
            (np.argmax(self.feedforward(x)[1][-1]), y) for (x, y) in test_data
        ]
        return sum(int(x == y) for (x, y) in test_results) / len(test_data)

    def loss_function(self, y, y_prime):
        return 0.5 * np.sum((y - y_prime) ** 2)

    """
    Returns the gradient of the squared error loss function.
    """

    def loss_derivative(self, output_activations, y):
        return output_activations - y


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def sigmoid_prime(z):
    return sigmoid(z) * (1 - sigmoid(z))