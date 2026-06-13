import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger("health_analyzer.database")
logging.basicConfig(level=logging.INFO)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

class DatabaseClient:
    def __init__(self):
        self.mongodb_url = settings.mongodb_url
        self.db_name = settings.database_name
        self.use_fallback = False
        self.client = None
        self.db = None
        
        # Ensure fallback data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        self.predictions_file = os.path.join(DATA_DIR, "predictions.json")
        self.chat_logs_file = os.path.join(DATA_DIR, "chat_logs.json")
        self._init_json_files()
        
        # Initialize MongoDB Client
        try:
            logger.info(f"Attempting to connect to MongoDB at {self.mongodb_url}...")
            # We set serverSelectionTimeoutMS to 2000 so it fails fast if MongoDB is not running
            self.client = AsyncIOMotorClient(self.mongodb_url, serverSelectionTimeoutMS=2000)
            self.db = self.client[self.db_name]
            
            # Simple async check to see if database is reachable
            # Note: We do this lazily or in background, but we can do a quick check here.
        except Exception as e:
            logger.warning(f"Failed to connect to MongoDB: {e}. Falling back to file-based database.")
            self.use_fallback = True

    def _init_json_files(self):
        for file_path in [self.predictions_file, self.chat_logs_file]:
            if not os.path.exists(file_path):
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)

    async def check_connection(self) -> bool:
        if self.use_fallback:
            return False
        try:
            # The client will throw ServerSelectionTimeoutError if MongoDB is offline
            await self.client.admin.command('ping')
            logger.info("Successfully pinged MongoDB server.")
            return True
        except Exception as e:
            logger.warning(f"MongoDB ping failed: {e}. Switching to file-based fallback.")
            self.use_fallback = True
            return False

    # Predictions Methods
    async def save_prediction(self, prediction: Dict[str, Any]) -> Dict[str, Any]:
        prediction = dict(prediction)
        # Ensure timestamp is string for JSON storage if fallback
        if "timestamp" not in prediction:
            prediction["timestamp"] = datetime.utcnow().isoformat()
        elif isinstance(prediction["timestamp"], datetime):
            prediction["timestamp"] = prediction["timestamp"].isoformat()
            
        if not self.use_fallback and await self.check_connection():
            try:
                result = await self.db.predictions.insert_one(prediction)
                prediction["_id"] = str(result.inserted_id)
                logger.info(f"Saved prediction to MongoDB with ID {result.inserted_id}")
                return prediction
            except Exception as e:
                logger.error(f"Error saving to MongoDB: {e}. Writing to fallback file.")
        
        # Fallback path
        try:
            predictions = []
            if os.path.exists(self.predictions_file):
                with open(self.predictions_file, "r", encoding="utf-8") as f:
                    try:
                        predictions = json.load(f)
                    except json.JSONDecodeError:
                        predictions = []
            
            # Generate local ID
            prediction["_id"] = f"local_{len(predictions) + 1}_{int(datetime.utcnow().timestamp())}"
            predictions.append(prediction)
            
            with open(self.predictions_file, "w", encoding="utf-8") as f:
                json.dump(predictions, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Saved prediction to fallback JSON file: {prediction['_id']}")
            return prediction
        except Exception as file_err:
            logger.error(f"Failed to write to local fallback database: {file_err}")
            raise file_err

    async def get_predictions(self, user_id: str = "default_user") -> List[Dict[str, Any]]:
        if not self.use_fallback and await self.check_connection():
            try:
                cursor = self.db.predictions.find({"user_id": user_id}).sort("timestamp", -1)
                predictions = []
                async for document in cursor:
                    document["_id"] = str(document["_id"])
                    predictions.append(document)
                return predictions
            except Exception as e:
                logger.error(f"Error fetching from MongoDB: {e}. Reading from fallback file.")
                
        # Fallback path
        try:
            if os.path.exists(self.predictions_file):
                with open(self.predictions_file, "r", encoding="utf-8") as f:
                    try:
                        predictions = json.load(f)
                    except json.JSONDecodeError:
                        return []
                # Filter by user_id and sort by timestamp descending
                filtered = [p for p in predictions if p.get("user_id") == user_id]
                filtered.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
                return filtered
            return []
        except Exception as file_err:
            logger.error(f"Failed to read from local fallback database: {file_err}")
            return []

    async def delete_prediction(self, prediction_id: str) -> bool:
        if not self.use_fallback and await self.check_connection():
            try:
                from bson.objectid import ObjectId
                # Try to delete by ObjectId or by string if saved locally or as raw string ID
                try:
                    result = await self.db.predictions.delete_one({"_id": ObjectId(prediction_id)})
                    if result.deleted_count > 0:
                        logger.info(f"Deleted prediction {prediction_id} from MongoDB")
                        return True
                except Exception:
                    pass
                    
                result_str = await self.db.predictions.delete_one({"_id": prediction_id})
                if result_str.deleted_count > 0:
                    logger.info(f"Deleted prediction {prediction_id} (string ID) from MongoDB")
                    return True
            except Exception as e:
                logger.error(f"Error deleting from MongoDB: {e}. Trying fallback.")
                
        # Fallback path (JSON file)
        try:
            if os.path.exists(self.predictions_file):
                with open(self.predictions_file, "r", encoding="utf-8") as f:
                    try:
                        predictions = json.load(f)
                    except json.JSONDecodeError:
                        return False
                
                initial_len = len(predictions)
                predictions = [p for p in predictions if p.get("_id") != prediction_id]
                
                if len(predictions) < initial_len:
                    with open(self.predictions_file, "w", encoding="utf-8") as f:
                        json.dump(predictions, f, indent=2, ensure_ascii=False)
                    logger.info(f"Deleted prediction {prediction_id} from fallback JSON file")
                    return True
            return False
        except Exception as file_err:
            logger.error(f"Failed to delete from fallback database: {file_err}")
            return False

    # Chat Logs Methods
    async def save_chat_log(self, chat_log: Dict[str, Any]) -> Dict[str, Any]:
        chat_log = dict(chat_log)
        if "timestamp" not in chat_log:
            chat_log["timestamp"] = datetime.utcnow().isoformat()
        elif isinstance(chat_log["timestamp"], datetime):
            chat_log["timestamp"] = chat_log["timestamp"].isoformat()
            
        if not self.use_fallback and await self.check_connection():
            try:
                result = await self.db.chat_logs.insert_one(chat_log)
                chat_log["_id"] = str(result.inserted_id)
                logger.info(f"Saved chat log to MongoDB with ID {result.inserted_id}")
                return chat_log
            except Exception as e:
                logger.error(f"Error saving chat log to MongoDB: {e}. Writing to fallback file.")
                
        # Fallback path
        try:
            logs = []
            if os.path.exists(self.chat_logs_file):
                with open(self.chat_logs_file, "r", encoding="utf-8") as f:
                    try:
                        logs = json.load(f)
                    except json.JSONDecodeError:
                        logs = []
                        
            chat_log["_id"] = f"chat_{len(logs) + 1}_{int(datetime.utcnow().timestamp())}"
            logs.append(chat_log)
            
            with open(self.chat_logs_file, "w", encoding="utf-8") as f:
                json.dump(logs, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Saved chat log to fallback JSON file: {chat_log['_id']}")
            return chat_log
        except Exception as file_err:
            logger.error(f"Failed to write chat log to fallback database: {file_err}")
            raise file_err

    async def get_chat_logs(self, user_id: str = "default_user") -> List[Dict[str, Any]]:
        if not self.use_fallback and await self.check_connection():
            try:
                cursor = self.db.chat_logs.find({"user_id": user_id}).sort("timestamp", 1)
                logs = []
                async for document in cursor:
                    document["_id"] = str(document["_id"])
                    logs.append(document)
                return logs
            except Exception as e:
                logger.error(f"Error fetching chat logs from MongoDB: {e}. Reading from fallback file.")
                
        # Fallback path
        try:
            if os.path.exists(self.chat_logs_file):
                with open(self.chat_logs_file, "r", encoding="utf-8") as f:
                    try:
                        logs = json.load(f)
                    except json.JSONDecodeError:
                        return []
                # Filter by user_id and sort by timestamp ascending
                filtered = [l for l in logs if l.get("user_id") == user_id]
                filtered.sort(key=lambda x: x.get("timestamp", ""))
                return filtered
            return []
        except Exception as file_err:
            logger.error(f"Failed to read chat logs from local fallback database: {file_err}")
            return []

db = DatabaseClient()
