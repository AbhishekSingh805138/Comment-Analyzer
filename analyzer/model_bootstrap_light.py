import random

STANCE_LABELS = ["support","oppose","neutral","irrelevant"]

class MockPipeline:
    def __init__(self, task_type):
        self.task_type = task_type
    
    def __call__(self, text, labels=None, multi_label=False):
        if self.task_type == "zero-shot":
            # Mock stance classification
            stance = random.choice(["support", "oppose", "neutral"])
            return {
                "labels": [stance],
                "scores": [0.8]
            }
        else:
            # Mock sentiment analysis
            sentiment = random.choice(["POSITIVE", "NEGATIVE", "NEUTRAL"])
            return [{
                "label": sentiment,
                "score": 0.7
            }]

def load_pipelines():
    stance = MockPipeline("zero-shot")
    sentiment = MockPipeline("sentiment")
    return stance, sentiment