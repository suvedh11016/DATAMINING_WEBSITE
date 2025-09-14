import gzip
import json
from pymongo import MongoClient
from bs4 import BeautifulSoup
import re
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

# Create a unique index on 'asin'
collection.create_index("asin", unique=True)
print(f"Created '{DB_NAME}' database and 'products' collection with unique asin index.")

# Dataset path
DATASET_PATH = "../data/meta_Appliances.json.gz"

# ---------------- Parsers ----------------
def extract_code_from_similar_item(html_str):
    """Parse the 'similar_item' HTML into structured list of dicts."""
    if not html_str.strip():
        return []

    soup = BeautifulSoup(html_str, "html.parser")
    items = []

    # ---- Title / Image row ----
    columns = soup.select("th.comparison_image_title_cell")
    num_items = len(columns)
    for _ in range(num_items):
        items.append({})

    for idx, th in enumerate(columns):
        link = th.find("a", href=True)
        if link:
            href = link["href"]
            m = re.search(r"/dp/([A-Z0-9]{10})", href)
            if m:
                items[idx]["asin"] = m.group(1)
            items[idx]["link"] = href

        title_tag = th.find("span", class_="a-size-base")
        if title_tag:
            items[idx]["title"] = title_tag.get_text(strip=True)

        img = th.find("img")
        if img and img.get("src"):
            items[idx]["image"] = img["src"]

    # ---- Price Row ----
    price_row = soup.select_one("tr#comparison_price_row")
    if price_row:
        # Base item price (the first product / "This item")
        base_td = price_row.find("td", class_=re.compile("comparison_baseitem_column"))
        if base_td:
            base_price_tag = base_td.find("span", class_="a-offscreen")
            if base_price_tag:
                try:
                    items[0]["price"] = float(base_price_tag.text.replace("$", "").replace(",", ""))
                except:
                    items[0]["price"] = base_price_tag.text

        # Other comparable items
        for idx, td in enumerate(price_row.find_all("td", class_=re.compile("comparable_item"))):
            price_tag = td.find("span", class_="a-offscreen")
            if price_tag:
                try:
                    items[idx+1]["price"] = float(price_tag.text.replace("$", "").replace(",", ""))
                except:
                    items[idx+1]["price"] = price_tag.text

    # ---- Rating Row ----
    rating_row = soup.select_one("tr#comparison_custormer_rating_row")
    if rating_row:
        # Base item rating
        base_td = rating_row.find("td", class_=re.compile("comparison_baseitem_column"))
        if base_td:
            rating_tag = base_td.find("span", class_="a-icon-alt")
            if rating_tag:
                items[0]["rating"] = rating_tag.text
            reviews = base_td.find("a", class_="a-link-normal")
            if reviews:
                items[0]["reviews"] = reviews.text

        # Other comparable items
        for idx, td in enumerate(rating_row.find_all("td", class_=re.compile("comparable_item"))):
            rating_tag = td.find("span", class_="a-icon-alt")
            if rating_tag:
                items[idx+1]["rating"] = rating_tag.text
            reviews = td.find("a", class_="a-link-normal")
            if reviews:
                items[idx+1]["reviews"] = reviews.text

    # ---- Shipping Row ----
    shipping_row = soup.select_one("tr#comparison_shipping_info_row")
    if shipping_row:
        # Base item shipping
        base_td = shipping_row.find("td", class_=re.compile("comparison_baseitem_column"))
        if base_td:
            items[0]["shipping"] = base_td.get_text(" ", strip=True)

        # Other comparable items
        for idx, td in enumerate(shipping_row.find_all("td", class_=re.compile("comparable_item"))):
            text = td.get_text(" ", strip=True)
            if text and text.lower() != "—":
                items[idx+1]["shipping"] = text

    # ---- Sold By Row ----
    sold_by_row = soup.select_one("tr#comparison_sold_by_row")
    if sold_by_row:
        # Base item sold by
        base_td = sold_by_row.find("td", class_=re.compile("comparison_baseitem_column"))
        if base_td:
            text = base_td.get_text(" ", strip=True)
            if text and text.lower() != "—":
                items[0]["sold_by"] = text

        # Other comparable items
        for idx, td in enumerate(sold_by_row.find_all("td", class_=re.compile("comparable_item"))):
            text = td.get_text(" ", strip=True)
            if text and text.lower() != "—":
                items[idx+1]["sold_by"] = text

    # ---- Extra rows (Color, Style, Size, Model Number, etc.) ----
    extra_labels = {
        "Color": "color",
        "Style": "style",
        "Size": "size",
        "Model Number": "model_number",
        "Part Number": "part_number",
    }

    for row in soup.select("tr"):
        header = row.find("th")
        if not header:
            continue
        label = header.get_text(strip=True)
        for key, field in extra_labels.items():
            if key in label:
                # Base item
                base_td = row.find("td", class_=re.compile("comparison_baseitem_column"))
                if base_td:
                    text = base_td.get_text(" ", strip=True)
                    if text and text.lower() != "—":
                        items[0][field] = text
                
                # Other comparable items
                for idx, td in enumerate(row.find_all("td", class_=re.compile("comparable_item"))):
                    text = td.get_text(" ", strip=True)
                    if text and text.lower() != "—":
                        items[idx+1][field] = text

    return items

def extract_code_from_tech(html_str):
    """Parse 'tech1' or 'tech2' HTML <tbody> into dict of specs."""
    if not html_str.strip():
        return {}

    soup = BeautifulSoup(html_str, "html.parser")
    specs = {}
    for row in soup.find_all("tr"):
        key_tag = row.find("th")
        value_tag = row.find("td")
        if key_tag and value_tag:
            key = key_tag.get_text(strip=True)
            value = value_tag.get_text(" ", strip=True)
            specs[key] = value
    return specs
    
def clean_features_description(features):
    """
    Takes a list of feature strings (some plain, some HTML) or a single string,
    and returns a list of clean text values.
    """
    if isinstance(features, str):
        features = [features]
    elif not isinstance(features, list):
        return []
    
    clean_list = []
    for f in features:
        if not isinstance(f, str):
            continue  # skip non-string values
        
        # If it looks like HTML, parse with BeautifulSoup
        if "<" in f and ">" in f:
            soup = BeautifulSoup(f, "html.parser")
            text = soup.get_text(" ", strip=True)  # extract visible text
            if text:
                clean_list.append(text)
        else:
            clean_list.append(f.strip())
    
    return clean_list

def extract_price_from_html(price_field: str):
    """
    Extract a numeric price (like '$12.34') from messy HTML/CSS stored in `price`.
    Returns None if nothing valid is found.
    """
    if not price_field or not isinstance(price_field, str):
        return None

    # If it already looks like a price string
    if price_field.strip().startswith("$"):
        return price_field.strip()

    # Otherwise parse with BeautifulSoup
    soup = BeautifulSoup(price_field, "html.parser")

    # Collect visible text
    text = soup.get_text(" ", strip=True)

    # Try to find something like $12.34 or $123
    match = re.search(r"\$\s*\d+(?:\.\d{1,2})?", text)
    if match:
        return match.group().replace(" ", "")

    return None

# ---------------- Main Insert Loop ----------------
BATCH_SIZE = 1000
count = 0
skipped = 0

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
                obj["similar_item"] = extract_code_from_similar_item(similar_item_html) or []
                # Extract asins from similar_item
                similar_asins = [
                    item.get("asin") for item in obj["similar_item"] if "asin" in item
                ]

            # Handle tech fields
            tech1 = obj.get("tech1", "")
            tech2 = obj.get("tech2", "")
            if isinstance(tech1, str):
                obj["tech1"] = extract_code_from_tech(tech1) or {}
            if isinstance(tech2, str):
                obj["tech2"] = extract_code_from_tech(tech2) or {}

            # Handle features and description
            feature = obj.get("feature", [])
            description = obj.get("description", [])
            obj["feature"] = clean_features_description(feature)
            obj["description"] = clean_features_description(description)

            # Handle price field
            price = obj.get("price", "")
            if isinstance(price, str):
                clean_price = extract_price_from_html(price)
                if clean_price:
                    obj["price"] = clean_price.replace("$", "").replace(",", "")
                else:
                    obj["price"] = None
            else:
                obj["price"] = None

            # Fetch also_buy and also_view from DB if asin exists
            if "asin" in obj:
                also_buy = obj.get("also_buy", [])
                also_view = obj.get("also_view", [])

                if isinstance(also_buy, list):
                    also_buy = [str(asin) for asin in also_buy if isinstance(asin, str)]
                    similar_asins.extend(also_buy)
                if isinstance(also_view, list):
                    also_view = [str(asin) for asin in also_view if isinstance(asin, str)]
                    similar_asins.extend(also_view)

                # Remove duplicates
                obj["similar_asins"] = list(set(similar_asins))

            # Upsert into MongoDB
            if "asin" in obj:
                result = collection.update_one(
                    {"asin": obj["asin"]},
                    {"$set": obj},
                    upsert=True
                )

                if result.matched_count > 0:
                    skipped += 1
                else:
                    count += 1

                if (count + skipped) % 1000 == 0:
                    print(f"Inserted {count + skipped} products...")

        except Exception as e:
            print("Error processing line:", e)

print(f"\nFinished inserting {count} products (Skipped duplicates: {skipped})")
