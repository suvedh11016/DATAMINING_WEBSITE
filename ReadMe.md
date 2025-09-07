# Amazon Search App

A full-stack web application for browsing and searching Amazon products. The **frontend** is built with React, and the **backend** uses Node.js, Express, and MongoDB.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

## Project Structure

```
amazon_search_app/
├── backend/
│   ├── .env
│   ├── package.json
│   ├── models/
│   │   └── product.model.js
│   ├── scripts/
│   │   └── loadDataset.js
│   ├── server/
│   │   └── server.js
│   └── utils/
├── data/
│   └── meta_Appliances.json.gz
├── frontend/
│   ├── .gitignore
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.css
│       ├── App.js
│       ├── index.css
│       ├── index.js
│       ├── components/
│       │   ├── ProductCard.js
│       │   ├── ProductDetails.js
│       │   └── ProductList.js
│       └── services/
│           └── api.js
```

## Setup Instructions

1. **Clone the repository** and navigate to the project root.

2. **Install dependencies:**

    - Backend:
      ```bash
      cd backend
      npm install
      ```
    - Frontend:
      ```bash
      cd ../frontend
      npm install
      ```

3. **Load the dataset into MongoDB:**

    From the project root, run:
    ```bash
    node backend/scripts/loadDataset.js
    ```

4. **Start the backend server:**

    ```bash
    cd backend
    node server/server.js
    ```

5. **Start the frontend development server:**

    ```bash
    cd ../frontend
    npm start
    ```

You can now access the application in your browser at `http://localhost:3000`.
