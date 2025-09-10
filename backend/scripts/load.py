import gzip
import json
import pymongo
from bs4 import BeautifulSoup
import re
from tqdm import tqdm
import os

# -------------------------------
# MongoDB setup
# -------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client["cs5600"]
products_col = db["products"]

# Ensure ASIN uniqueness if needed
products_col.create_index("asin", unique=True)

# -------------------------------
# Dataset path
# -------------------------------
DATASET_PATH = "../data/meta_Appliances.json.gz"

# -------------------------------
# Function to extract ASINs from HTML
# -------------------------------
def extract_asins(html):
    """Extract ASINs from Amazon-like HTML using BeautifulSoup"""
    asins = set()
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    # Look for hrefs containing '/dp/<ASIN>'
    for a in soup.find_all("a", href=True):
        match = re.search(r"/dp/([A-Z0-9]{10})", a["href"])
        if match:
            asins.add(match.group(1))
    return list(asins)

# -------------------------------
# Load dataset
# -------------------------------
def load_dataset():
    count = 0
    skipped = 0

    with gzip.open(DATASET_PATH, "rt", encoding="utf-8") as f:
        for line in tqdm(f, desc="Loading products"):
            if not line.strip():
                continue
            try:
                obj = json.loads(line)

                # Parse similar_item HTML for ASINs
                if "similar_item" in obj and obj["similar_item"]:
                    obj["similar_asins"] = extract_asins(obj["similar_item"])
                else:
                    obj["similar_asins"] = []

                # Insert into MongoDB (skip duplicates)
                try:
                    products_col.insert_one(obj)
                    count += 1
                except pymongo.errors.DuplicateKeyError:
                    skipped += 1

            except Exception as e:
                print(f"Error parsing line: {e}")
                continue

    print(f"\n✅ Finished inserting {count} products (Skipped duplicates: {skipped})")
    client.close()

# -------------------------------
# Main
# -------------------------------
if __name__ == "__main__":
    load_dataset()
