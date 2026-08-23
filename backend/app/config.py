import os
from pydantic_settings import BaseSettings

class Settings:
    PROJECT_NAME: str = "ContractGuard API - Contract Domain Detection"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    DOMAIN_CONFIG_PATH: str = os.path.join(DATA_DIR, "domain_config.json")
    MODEL_DIR: str = os.path.join(BASE_DIR, "models", "domain_classifier")
    ROBERTA_MODEL_PATH: str = os.path.join(MODEL_DIR, "roberta_model")
    BASELINE_MODEL_PATH: str = os.path.join(MODEL_DIR, "baseline_tfidf.joblib")

settings = Settings()
