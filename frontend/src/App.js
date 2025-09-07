// import React, { useState } from "react";
// import { getAllProducts } from "./services/api";
// import ProductCard from "./components/ProductCard";
// import "./App.css";

// function App() {
//   const [products, setProducts] = useState([]);
//   const [loaded, setLoaded] = useState(false);

//   const fetchProducts = async () => {
//     const data = await getAllProducts();
//     setProducts(data.slice(0, 50)); // show first 50 for demo
//     setLoaded(true);
//   };

//   return (
//     <div className="App">
//       <h1>Amazon Products</h1>

//       {!loaded && <button onClick={fetchProducts}>Load Products</button>}

//       {loaded && (
//         <div className="product-list">
//           {products.map((p) => (
//             <ProductCard key={p.asin} product={p} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

// import React, { useState, useEffect } from "react";
// import { getAllProducts } from "./services/api";
// import ProductCard from "./components/ProductCard";
// import "./App.css";

// function App() {
//   const [products, setProducts] = useState([]);
//   const [loaded, setLoaded] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 50;

//   useEffect(() => {
//     const fetchProducts = async () => {
//       const data = await getAllProducts();
//       setProducts(data);
//       setLoaded(true);
//     };
//     fetchProducts();
//   }, []);

//   const totalPages = Math.ceil(products.length / itemsPerPage);

//   const paginatedProducts = products.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   return (
//     <div className="App">
//       <h1>Amazon Products</h1>

//       {!loaded && <p>Loading...</p>}

//       {loaded && (
//         <>
//           <div className="product-list">
//             {paginatedProducts.map((p) => (
//               <ProductCard key={p.asin} product={p} />
//             ))}
//           </div>

//           <div className="pagination">
//             {Array.from({ length: totalPages }, (_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => handlePageChange(i + 1)}
//                 style={{
//                   margin: "0 5px",
//                   background: currentPage === i + 1 ? "#ddd" : "#fff",
//                 }}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default App;





// solution 3
import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./components/ProductCard";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 48;
  const visiblePages = 5; // show 5 page buttons at a time

  const fetchProducts = async (page) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/products?page=${page}&limit=${itemsPerPage}`
      );
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.page);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchProducts(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(totalPages, start + visiblePages - 1);

    if (end - start + 1 < visiblePages) {
      start = Math.max(1, end - visiblePages + 1);
    }

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);

    return pages;
  };

  return (
    <div className="App">
      <h1>Amazon Products</h1>

      {loading && <p>Loading...</p>}

      <div className="product-list">
        {products.map((p) => (
          <ProductCard key={p.asin} product={p} />
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)}>Prev</button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={i} style={{ margin: "0 5px" }}>...</span>
          ) : (
            <button
              key={i}
              onClick={() => handlePageChange(p)}
              style={{
                margin: "0 5px",
                background: currentPage === p ? "#ddd" : "#fff",
              }}
            >
              {p}
            </button>
          )
        )}

        <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
      </div>
    </div>
  );
}

export default App;
