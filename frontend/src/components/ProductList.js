// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import ProductCard from "./ProductCard";

// function ProductList() {
//   const [products, setProducts] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const itemsPerPage = 48;
//   const visiblePages = 3; // show 5 page buttons at a time

//   const fetchProducts = async (page) => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `http://localhost:5000/products?page=${page}&limit=${itemsPerPage}`
//       );
//       setProducts(res.data.products);
//       setTotalPages(res.data.totalPages);
//       setCurrentPage(res.data.page);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProducts(1);
//   }, []);

//   const handlePageChange = (page) => {
//     if (page < 1 || page > totalPages) return;
//     fetchProducts(page);
//   };

//   const getPageNumbers = () => {
//     const pages = [];
//     let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
//     let end = Math.min(totalPages, start + visiblePages - 1);

//     if (end - start + 1 < visiblePages) {
//       start = Math.max(1, end - visiblePages + 1);
//     }

//     if (start > 1) pages.push(1, "...");
//     for (let i = start; i <= end; i++) pages.push(i);
//     if (end < totalPages) pages.push("...", totalPages);

//     return pages;
//   };

//   return (
//     <div className="App">
//       <h1>Amazon Products</h1>

//       {loading && <p>Loading...</p>}

//       <div className="product-list">
//         {products.map((p) => (
//           <ProductCard key={p.asin} product={p} />
//         ))}
//       </div>

//       <div className="pagination">
//         <button onClick={() => handlePageChange(currentPage - 1)}>Prev</button>

//         {getPageNumbers().map((p, i) =>
//           p === "..." ? (
//             <span key={i} style={{ margin: "0 5px" }}>...</span>
//           ) : (
//             <button
//               key={i}
//               onClick={() => handlePageChange(p)}
//               style={{
//                 margin: "0 5px",
//                 background: currentPage === p ? "#ddd" : "#fff",
//               }}
//             >
//               {p}
//             </button>
//           )
//         )}

//         <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
//       </div>
//     </div>
//   );
// }

// export default ProductList;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import ProductCard from "./ProductCard";

// function ProductList() {
//   const [products, setProducts] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const itemsPerPage = 48;
//   const visiblePages = 3;

//   const navigate = useNavigate();

//   const fetchProducts = async (page) => {
//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `http://localhost:5000/products?page=${page}&limit=${itemsPerPage}`
//       );
//       setProducts(res.data.products);
//       setTotalPages(res.data.totalPages);
//       setCurrentPage(res.data.page);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProducts(1);
//   }, []);

//   const handlePageChange = (page) => {
//     if (page < 1 || page > totalPages) return;
//     fetchProducts(page);
//   };

//   const getPageNumbers = () => {
//     const pages = [];
//     let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
//     let end = Math.min(totalPages, start + visiblePages - 1);

//     if (end - start + 1 < visiblePages) start = Math.max(1, end - visiblePages + 1);

//     if (start > 1) pages.push(1, "...");
//     for (let i = start; i <= end; i++) pages.push(i);
//     if (end < totalPages) pages.push("...", totalPages);

//     return pages;
//   };
  

//   return (
//     <div className="App">
//       <h1>Amazon Products</h1>

//       {loading && <p>Loading...</p>}

//       <div className="product-list">
//         {products.map((p) => (
//           <ProductCard
//             key={p.asin}
//             product={p}
//             onViewMore={(asin) => navigate(`/product/${asin}`)}
//           />
//         ))}
//       </div>

//       <div className="pagination">
//         <button onClick={() => handlePageChange(currentPage - 1)}>Prev</button>

//         {getPageNumbers().map((p, i) =>
//           p === "..." ? (
//             <span key={i} style={{ margin: "0 5px" }}>...</span>
//           ) : (
//             <button
//               key={i}
//               onClick={() => handlePageChange(p)}
//               style={{
//                 margin: "0 5px",
//                 background: currentPage === p ? "#ddd" : "#fff",
//               }}
//             >
//               {p}
//             </button>
//           )
//         )}

//         <button onClick={() => handlePageChange(currentPage + 1)}>Next</button>
//       </div>
//     </div>
//   );
// }

// export default ProductList;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 48;
  const visiblePages = 3;

  const navigate = useNavigate();

  const fetchProducts = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/products", {
        params: { page, limit: itemsPerPage, search },
      });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.page);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(); // initial load
  }, []);

  // **Live search effect**
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts(1, searchTerm); // fetch results for page 1
    }, 300); // wait 300ms after typing stops

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchProducts(page, searchTerm);
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(totalPages, start + visiblePages - 1);
    if (end - start + 1 < visiblePages) start = Math.max(1, end - visiblePages + 1);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  };

  return (
    <div className="App">
      <h1>Amazon Products</h1>

      {/* Live Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button
        type="button"
        onClick={() => {
          setSearchTerm("");
          fetchProducts(1, "");
        }}
      >
        Clear
      </button>

      {loading && <p>Loading...</p>}

      <div className="product-list">
        {products.map((p) => (
          <ProductCard
            key={p.asin}
            product={p}
            onViewMore={(asin) => navigate(`/product/${asin}`)}
          />
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

export default ProductList;
