import numpy as np
from network import Network

network = Network([2, 2, 2])

def create_simple_net_fixed():
    sizes = [2, 2, 2]
    net = Network(sizes)
    net.biases = [np.random.randn(y, 1) for y in sizes[1:]]
    net.weights = [np.random.randn(y, x) for x, y in zip(sizes[:-1], sizes[1:])]
    return net

def test_feedforward():
    net = create_simple_net_fixed()

    gt_z = np.array([[-1.5586694], [0.80512013]])
    gt_a = np.array([[0.88594343], [0.39667158]])

    input = np.ones((2, 1))
    z, a = net.feedforward(input)

    print(a[1])

    assert np.isclose(gt_a, a[1], atol=1e-05).all()
    assert np.isclose(gt_z, z[1], atol=1e-05).all()

    print("feedforward test passed!")

test_feedforward()
