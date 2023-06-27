import tensorflow as tf
class QNetwork():
    def __init__(self, learning_rate=0.01, state_size=4, 
        action_size=2, hidden_size=10):
        # state inputs to the Q-network
        self.inputs_ = tf.keras.Input(shape=(state_size,), dtype=tf.float32, name='inputs')
        
        # ReLU hidden layers
        self.fc1 = tf.keras.layers.Dense(hidden_size, activation='relu')(self.inputs_)
        self.fc2 = tf.keras.layers.Dense(hidden_size, activation='relu')(self.fc1)

        # Linear output layer
        self.output = tf.keras.layers.Dense(action_size, activation=None)(self.fc2)

        # Define model
        self.model = tf.keras.Model(inputs=self.inputs_, outputs=self.output)

        # Set trainable parameters as network parameters
        self.trainable_variables = self.model.trainable_variables
        self.action_size = action_size
        
        # Use the default Adam optimizer
        self.opt = tf.keras.optimizers.legacy.Adam()
    
    def predict(self, inputs):
        # Convert inputs to TensorFlow tensor
        inputs_tensor = tf.convert_to_tensor(inputs, dtype=tf.float32)

        # Get the output prediction
        output = self.model(inputs_tensor)

        return output

    def loss_func(self, inputs, actions, targetQs):
        # Convert inputs to tensors
        inputs = tf.convert_to_tensor(inputs, dtype=tf.float32)
        actions = tf.convert_to_tensor(actions, dtype=tf.int8)
        targetQs = tf.convert_to_tensor(targetQs, dtype=tf.float32)

        # Calcualte network output
        output = self.model(inputs)


        # One hot encode the actions to later choose the Q-value for the action
        one_hot_actions = tf.one_hot(actions, self.action_size)

        # Calculate loss
        Q = tf.reduce_sum(tf.multiply(output, one_hot_actions), axis=1)
        loss = tf.reduce_mean(tf.square(targetQs - Q))

        return loss
    
    def train(self, inputs, actions, targetQs):
        # Calculate gradient
        with tf.GradientTape() as tape:
            loss = self.loss_func(inputs, actions, targetQs)
 
        # Compute gradients
        gradients = tape.gradient(loss, self.trainable_variables)

        # Update model weights
        self.opt.apply_gradients(zip(gradients, self.trainable_variables))
        return float(loss)