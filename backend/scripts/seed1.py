import gzip
import json
from pymongo import MongoClient
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB connection using environment variable
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "cs5600")

client = MongoClient(mongo_uri)

# Drop existing database if present
if DB_NAME in client.list_database_names():
    client.drop_database(DB_NAME)
    print(f"Dropped existing '{DB_NAME}' database.")

# Recreate database and collection
db = client[DB_NAME]
collection = db["products"]
print(f"Created '{DB_NAME}' database and 'products' collection.")

# Path to your dataset
DATASET_PATH = "../data/meta_Appliances.json.gz"

def extract_ids_from_html(html_str):
    """
    Extract product IDs from <a href="/dp/XXXX"> links using BeautifulSoup.
    Returns a list of IDs.
    """
    ids = []
    if not html_str:
        return ids
    try:
        soup = BeautifulSoup(html_str, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/dp/" in href:
                parts = href.split("/dp/")
                if len(parts) > 1:
                    asin = parts[1].split("/")[0]  # extract ID before next "/"
                    ids.append(asin.strip())
    except Exception as e:
        print("HTML parsing error:", e)
    return ids

BATCH_SIZE = 1000
buffer = []
count = 0

with gzip.open(DATASET_PATH, "rt", encoding="utf-8") as f:
    for line in f:
        if not line.strip():
            continue

        try:
            obj = json.loads(line)

            # Handle similar_item field
            similar_item_html = obj.get("similar_item", "")
            similar_asins = []
            if isinstance(similar_item_html, str):
                similar_asins = extract_ids_from_html(similar_item_html)

            # Merge also_buy and also_view links into similar_asins
            for key in ["also_buy", "also_view"]:
                links = obj.get(key, [])
                if isinstance(links, list):
                    similar_asins.extend(links)

            # Remove duplicates from similar_asins and Add new attribute to obj
            obj["similar_asins"] = list(set(similar_asins))

            buffer.append(obj)

            if len(buffer) >= BATCH_SIZE:
                collection.insert_many(buffer, ordered=False)
                count += len(buffer)
                print(f"Inserted {count} products...")
                buffer = []

        except Exception as e:
            print("Error processing line:", e)

# Insert remaining
if buffer:
    collection.insert_many(buffer, ordered=False)
    count += len(buffer)

print(f"Finished inserting {count} products")
