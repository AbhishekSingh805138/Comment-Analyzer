# Line 1: Import random for mock predictions
import random

# Line 3: Define possible stance labels
STANCE_LABELS = ["support","oppose","neutral","irrelevant"]

# Lines 5-24: Mock ML pipeline class
class MockPipeline:
    def __init__(self, task_type):
        self.task_type = task_type          # Store pipeline type
    
    def __call__(self, text, labels=None, multi_label=False):
        if self.task_type == "zero-shot":   # Stance classification
            # Mock stance classification
            stance = random.choice(["support", "oppose", "neutral"])  # Random stance
            return {
                "labels": [stance],         # Return predicted label
                "scores": [0.8]            # Mock confidence score
            }
        else:                              # Sentiment analysis
            # Mock sentiment analysis
            sentiment = random.choice(["POSITIVE", "NEGATIVE", "NEUTRAL"])  # Random sentiment
            return [{
                "label": sentiment,        # Return predicted sentiment
                "score": 0.7              # Mock confidence score
            }]

# Lines 26-29: Function to create mock pipelines
def load_pipelines():
    stance = MockPipeline("zero-shot")     # Create stance classifier
    sentiment = MockPipeline("sentiment")  # Create sentiment classifier
    return stance, sentiment               # Return both pipelines
