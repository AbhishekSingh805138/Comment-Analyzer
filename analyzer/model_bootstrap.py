from transformers import pipeline

STANCE_LABELS = ["support","oppose","neutral","irrelevant"]

def load_pipelines():
    stance = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    sentiment = pipeline("sentiment-analysis")
    return stance, sentiment
