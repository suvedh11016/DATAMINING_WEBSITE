// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";

// function ProductDetails() {
//     const { asin } = useParams();
//     const [product, setProduct] = useState(null);
//     const [imgIdx, setImgIdx] = useState(0);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchProduct = async () => {
//             try {
//                 const res = await axios.get(`http://localhost:5000/products/${asin}`);
//                 setProduct(res.data);
//                 setImgIdx(0); // Reset carousel on new product
//             } catch (err) {
//                 console.error(err);
//             }
//         };
//         fetchProduct();
//     }, [asin]);

//     if (!product) return <p>Loading...</p>;

//     const images = product.imageURLHighRes && product.imageURLHighRes.length > 0 ? product.imageURLHighRes : ["/1.png"];

//     const prevImg = () => setImgIdx((imgIdx - 1 + images.length) % images.length);
//     const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

//     if (!product.price || !product.price.startsWith("$")) {
//         product.price = "N/A";
//     }
//     console.log(product);
//     return (
//         <div className="product-details">
//             <button onClick={() => navigate(-1)}>⬅ Back</button>
//             <h2>{product.title}</h2>
//             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                 <button onClick={prevImg} disabled={images.length <= 1}>{"<"}</button>
//                 <img
//                     src={images[imgIdx]}
//                     alt={product.title}
//                     style={{ maxWidth: "200px", maxHeight: "200px" }}
//                 />
//                 <button onClick={nextImg} disabled={images.length <= 1}>{">"}</button>
//             </div>
//             <div style={{ marginTop: "8px" }}>
//                 {images.map((img, idx) => (
//                     <img
//                         key={idx}
//                         src={img}
//                         alt=""
//                         style={{
//                             width: 32,
//                             height: 32,
//                             objectFit: "cover",
//                             margin: "0 2px",
//                             border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
//                             cursor: "pointer",
//                             opacity: imgIdx === idx ? 1 : 0.6,
//                         }}
//                         onClick={() => setImgIdx(idx)}
//                     />
//                 ))}
//             </div>
//             <p><b>Price:</b> {product.price}</p>
//             <p><b>Brand:</b> {product.brand ? product.brand : "N/A"}</p>
//             <p><b>Description:</b> {
//                 product.description
//                     ? (Array.isArray(product.description)
//                         ? product.description.join(" ")
//                         : product.description)
//                     : "N/A"
//             }</p>
//             <p><b>Features:</b></p>
//             <ul>
//                 {Array.isArray(product.feature) && product.feature.length > 0
//                     ? product.feature.map((feature, idx) => (
//                         <li key={idx}>{feature}</li>
//                     ))
//                     : <li>N/A</li>
//                 }
//             </ul>
//         </div>
//     );
// }

// export default ProductDetails;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";

// function ProductDetails() {
//   const { asin } = useParams();
//   const [product, setProduct] = useState(null);
//   const [imgIdx, setImgIdx] = useState(0);
//   const [mode, setMode] = useState("similar_items");
//   const [similar, setSimilar] = useState([]);
//   const navigate = useNavigate();

//   // Fetch product details
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         console.log("➡️ Fetching product:", asin);
//         const res = await axios.get(`http://localhost:5000/products/${asin}`);
//         console.log("✅ Product fetched:", res.data);
//         setProduct(res.data);
//         setImgIdx(0);
//         setMode("similar_items");
//       } catch (err) {
//         console.error("❌ Error fetching product:", err.message);
//       }
//     };
//     fetchProduct();
//   }, [asin]);

//   // Fetch similar products
//   useEffect(() => {
//     if (!product) return;

//     const fetchSimilar = async () => {
//       console.log("➡️ Mode changed:", mode);

//       if (mode === "similar_items") {
//         let similarAsins = product.similar_asins || [];
//         console.log("🔍 similar_asins from product:", similarAsins);

//         if (similarAsins.length > 0) {
//           try {
//             const query = similarAsins.slice(0, 10).join(",");
//             console.log("➡️ Fetching bulk products for ASINs:", query);

//             const res = await axios.get(
//               `http://localhost:5000/products/bulk?asins=${query}`
//             );
//             console.log("✅ Bulk products fetched:", res.data.length);

//             setSimilar((res.data || []).filter((p) => p));
//           } catch (err) {
//             console.error("❌ Error fetching bulk products:", err.message);
//             setSimilar([]);
//           }
//         } else {
//           console.log("⚠️ No similar_asins found for this product.");
//           setSimilar([]);
//         }
//       } else {
//         try {
//           console.log("➡️ Fetching LSH-based similar products:", mode);
//           const res = await axios.get(
//             `http://localhost:5000/products/${asin}/similar?mode=${mode}`
//           );
//           console.log("✅ LSH products fetched:", res.data.length);
//           setSimilar((res.data || []).filter((p) => p));
//         } catch (err) {
//           console.error("❌ Error fetching LSH products:", err.message);
//           setSimilar([]);
//         }
//       }
//     };

//     fetchSimilar();
//   }, [mode, product, asin]);

//   if (!product) return <p>Loading...</p>;

//   const images =
//     product.imageURLHighRes && product.imageURLHighRes.length > 0
//       ? product.imageURLHighRes
//       : ["/1.png"];

//   const prevImg = () =>
//     setImgIdx((imgIdx - 1 + images.length) % images.length);
//   const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

//   if (!product.price || !product.price.startsWith("$")) product.price = "N/A";

//   return (
//     <div className="product-details">
//       <button onClick={() => navigate(-1)}>⬅ Back</button>
//       <h2>{product.title}</h2>

//       {/* Image Carousel */}
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button onClick={prevImg} disabled={images.length <= 1}>
//           {"<"}
//         </button>
//         <img
//           src={images[imgIdx]}
//           alt={product.title}
//           style={{ maxWidth: "200px", maxHeight: "200px" }}
//         />
//         <button onClick={nextImg} disabled={images.length <= 1}>
//           {">"}
//         </button>
//       </div>

//       {/* Thumbnail Strip */}
//       <div style={{ marginTop: "8px" }}>
//         {images.map((img, idx) => (
//           <img
//             key={idx}
//             src={img}
//             alt=""
//             style={{
//               width: 32,
//               height: 32,
//               objectFit: "cover",
//               margin: "0 2px",
//               border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
//               cursor: "pointer",
//               opacity: imgIdx === idx ? 1 : 0.6,
//             }}
//             onClick={() => setImgIdx(idx)}
//           />
//         ))}
//       </div>

//       {/* Product Info */}
//       <p>
//         <b>Price:</b> {product.price}
//       </p>
//       <p>
//         <b>Brand:</b> {product.brand || "N/A"}
//       </p>
//       <p>
//         <b>Description:</b>{" "}
//         {product.description
//           ? Array.isArray(product.description)
//             ? product.description.join(" ")
//             : product.description
//           : "N/A"}
//       </p>
//       <p>
//         <b>Features:</b>
//       </p>
//       <ul>
//         {Array.isArray(product.feature) && product.feature.length > 0 ? (
//           product.feature.map((f, idx) => <li key={idx}>{f}</li>)
//         ) : (
//           <li>N/A</li>
//         )}
//       </ul>

//       {/* Similar Products Mode Buttons */}
//       <div style={{ marginTop: "12px" }}>
//         {["similar_items", "PST", "PSD", "PSTD"].map((m) => (
//           <button
//             key={m}
//             onClick={() => setMode(m)}
//             disabled={mode === m}
//             style={{ marginRight: "5px" }}
//           >
//             {m}
//           </button>
//         ))}
//       </div>

//       {/* Similar Products List */}
//       <div style={{ display: "flex", overflowX: "scroll", marginTop: "8px" }}>
//         {similar.length === 0 && <p>No similar products found.</p>}
//         {similar.map((item, i) => (
//           <div
//             key={i}
//             style={{
//               margin: "0 8px",
//               textAlign: "center",
//               minWidth: "120px",
//             }}
//           >
//             <img
//               src={
//                 item.imageURLHighRes?.[0] ||
//                 item.imageURL?.[0] ||
//                 "/1.png"
//               }
//               alt={item.title || "Product"}
//               style={{ width: "100px", height: "100px", objectFit: "cover" }}
//             />
//             <p style={{ fontSize: "12px" }}>
//               {item.title?.slice(0, 50) || "N/A"}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default ProductDetails;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";

// function ProductDetails() {
//   const { asin } = useParams();
//   const [product, setProduct] = useState(null);
//   const [imgIdx, setImgIdx] = useState(0);
//   const [mode, setMode] = useState("similar_items");
//   const [similar, setSimilar] = useState([]);
//   const navigate = useNavigate();

//   // Fetch product details
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         console.log("➡️ Fetching product:", asin);
//         const res = await axios.get(`http://localhost:5000/products/${asin}`);
//         console.log("✅ Product fetched:", res.data);
//         setProduct(res.data);
//         setImgIdx(0);
//         setMode("similar_items");
//       } catch (err) {
//         console.error("❌ Error fetching product:", err.message);
//       }
//     };
//     fetchProduct();
//   }, [asin]);

//   // Fetch similar products
//   useEffect(() => {
//     if (!product) return;

//     const fetchSimilar = async () => {
//       console.log("➡️ Mode changed:", mode);

//       if (mode === "similar_items") {
//         let similarAsins = product.similar_asins || [];
//         console.log("🔍 similar_asins from product:", similarAsins);

//         if (similarAsins.length > 0) {
//           try {
//             const query = similarAsins.slice(0, 10).join(",");
//             console.log("➡️ Fetching bulk products for ASINs:", query);

//             const res = await axios.get(
//               `http://localhost:5000/products/bulk?asins=${query}`
//             );
//             console.log("✅ Bulk products fetched:", res.data.length);

//             setSimilar((res.data || []).filter((p) => p));
//           } catch (err) {
//             console.error("❌ Error fetching bulk products:", err.message);
//             setSimilar([]);
//           }
//         } else {
//           console.log("⚠️ No similar_asins found for this product.");
//           setSimilar([]);
//         }
//       } else {
//         try {
//           console.log("➡️ Fetching LSH-based similar products:", mode);
//           const res = await axios.get(
//             `http://localhost:5000/products/${asin}/similar?mode=${mode}`
//           );
//           console.log("✅ LSH products fetched:", res.data.length);
//           setSimilar((res.data || []).filter((p) => p));
//         } catch (err) {
//           console.error("❌ Error fetching LSH products:", err.message);
//           setSimilar([]);
//         }
//       }
//     };

//     fetchSimilar();
//   }, [mode, product, asin]);

//   if (!product) return <p>Loading...</p>;

//   const images =
//     product.imageURLHighRes && product.imageURLHighRes.length > 0
//       ? product.imageURLHighRes
//       : ["/1.png"];

//   const prevImg = () =>
//     setImgIdx((imgIdx - 1 + images.length) % images.length);
//   const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

//   if (!product.price || !product.price.startsWith("$")) product.price = "N/A";

//   return (
//     <div className="product-details">
//       <button onClick={() => navigate(-1)}>⬅ Back</button>
//       <h2>{product.title}</h2>

//       {/* Image Carousel */}
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button onClick={prevImg} disabled={images.length <= 1}>
//           {"<"}
//         </button>
//         <img
//           src={images[imgIdx]}
//           alt={product.title}
//           style={{ maxWidth: "200px", maxHeight: "200px" }}
//         />
//         <button onClick={nextImg} disabled={images.length <= 1}>
//           {">"}
//         </button>
//       </div>

//       {/* Thumbnail Strip */}
//       <div style={{ marginTop: "8px" }}>
//         {images.map((img, idx) => (
//           <img
//             key={idx}
//             src={img}
//             alt=""
//             style={{
//               width: 32,
//               height: 32,
//               objectFit: "cover",
//               margin: "0 2px",
//               border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
//               cursor: "pointer",
//               opacity: imgIdx === idx ? 1 : 0.6,
//             }}
//             onClick={() => setImgIdx(idx)}
//           />
//         ))}
//       </div>

//       {/* Product Info */}
//       <p>
//         <b>Price:</b> {product.price}
//       </p>
//       <p>
//         <b>Brand:</b> {product.brand || "N/A"}
//       </p>
//       <p>
//         <b>Description:</b>{" "}
//         {product.description
//           ? Array.isArray(product.description)
//             ? product.description.join(" ")
//             : product.description
//           : "N/A"}
//       </p>
//       <p>
//         <b>Features:</b>
//       </p>
//       <ul>
//         {Array.isArray(product.feature) && product.feature.length > 0 ? (
//           product.feature.map((f, idx) => <li key={idx}>{f}</li>)
//         ) : (
//           <li>N/A</li>
//         )}
//       </ul>

//       {/* Similar Products Mode Buttons */}
//       <div style={{ marginTop: "12px" }}>
//         {["similar_items", "PST", "PSD", "PSTD"].map((m) => (
//           <button
//             key={m}
//             onClick={() => setMode(m)}
//             disabled={mode === m}
//             style={{ marginRight: "5px" }}
//           >
//             {m}
//           </button>
//         ))}
//       </div>

//       {/* Similar Products List */}
//       <div
//         style={{
//           display: "flex",
//           overflowX: "scroll",
//           marginTop: "8px",
//           paddingBottom: "8px",
//         }}
//       >
//         {similar.length === 0 && <p>No similar products found.</p>}
//         {similar.map((item, i) => (
//           <SimilarProductCard key={i} item={item} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ---------------- Similar Product Card ----------------
// function SimilarProductCard({ item }) {
//   const [expanded, setExpanded] = useState(false);
//   const navigate = useNavigate();

//   return (
//     <div
//       style={{
//         margin: "0 8px",
//         textAlign: "center",
//         minWidth: "150px",
//         border: "1px solid #ddd",
//         borderRadius: "8px",
//         padding: "10px",
//       }}
//     >
//       <img
//         src={item.imageURLHighRes?.[0] || item.imageURL?.[0] || "/1.png"}
//         alt={item.title || "Product"}
//         style={{ width: "120px", height: "120px", objectFit: "cover" }}
//       />

//       <p style={{ fontSize: "12px", marginTop: "5px" }}>
//         {expanded ? item.title : (item.title || "N/A").slice(0, 20) + "..."}
//         {item.title && item.title.length > 20 && (
//           <button
//             onClick={() => setExpanded(!expanded)}
//             style={{
//               background: "none",
//               border: "none",
//               color: "blue",
//               cursor: "pointer",
//               fontSize: "11px",
//               marginLeft: "4px",
//             }}
//           >
//             {expanded ? "View Less" : "View More"}
//           </button>
//         )}
//       </p>

//       <button
//         onClick={() => navigate(`/product/${item.asin}`)}
//         style={{
//           marginTop: "5px",
//           padding: "5px 8px",
//           backgroundColor: "#ff9900",
//           border: "none",
//           borderRadius: "4px",
//           cursor: "pointer",
//           fontSize: "12px",
//           color: "white",
//         }}
//       >
//         View Details
//       </button>
//     </div>
//   );
// }

// export default ProductDetails;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";

// function ProductDetails() {
//   const { asin } = useParams();
//   const [product, setProduct] = useState(null);
//   const [imgIdx, setImgIdx] = useState(0);
//   const [mode, setMode] = useState("similar_items");
//   const [similar, setSimilar] = useState([]);
//   const navigate = useNavigate();

//   // Fetch product details
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         console.log("➡️ Fetching product:", asin);
//         const res = await axios.get(`http://localhost:5000/products/${asin}`);
//         console.log("✅ Product fetched:", res.data);
//         setProduct(res.data);
//         setImgIdx(0);
//         setMode("similar_items");
//       } catch (err) {
//         console.error("❌ Error fetching product:", err.message);
//       }
//     };
//     fetchProduct();
//   }, [asin]);

//   // Fetch similar products
//   useEffect(() => {
//     if (!product) return;

//     const fetchSimilar = async () => {
//       console.log("➡️ Mode changed:", mode);

//       if (mode === "similar_items") {
//         let similarAsins = product.similar_asins || [];
//         console.log("🔍 similar_asins from product:", similarAsins);

//         if (similarAsins.length > 0) {
//           try {
//             const query = similarAsins.join(","); // fetch ALL
//             console.log("➡️ Fetching bulk products for ASINs:", query);

//             const res = await axios.get(
//               `http://localhost:5000/products/bulk?asins=${query}`
//             );
//             console.log("✅ Bulk products fetched:", res.data.length);

//             setSimilar((res.data || []).filter((p) => p));
//           } catch (err) {
//             console.error("❌ Error fetching bulk products:", err.message);
//             setSimilar([]);
//           }
//         } else {
//           console.log("⚠️ No similar_asins found for this product.");
//           setSimilar([]);
//         }
//       } else {
//         try {
//           console.log("➡️ Fetching LSH-based similar products:", mode);
//           const res = await axios.get(
//             `http://localhost:5000/products/${asin}/similar?mode=${mode}`
//           );
//           console.log("✅ LSH products fetched:", res.data.length);
//           setSimilar((res.data || []).filter((p) => p));
//         } catch (err) {
//           console.error("❌ Error fetching LSH products:", err.message);
//           setSimilar([]);
//         }
//       }
//     };

//     fetchSimilar();
//   }, [mode, product, asin]);

//   if (!product) return <p>Loading...</p>;

//   const images =
//     product.imageURLHighRes && product.imageURLHighRes.length > 0
//       ? product.imageURLHighRes
//       : ["/1.png"];

//   const prevImg = () =>
//     setImgIdx((imgIdx - 1 + images.length) % images.length);
//   const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

//   if (!product.price || !product.price.startsWith("$")) product.price = "N/A";

//   return (
//     <div className="product-details">
//       <button onClick={() => navigate(-1)}>⬅ Back</button>
//       <h2>{product.title}</h2>

//       {/* Image Carousel */}
//       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//         <button onClick={prevImg} disabled={images.length <= 1}>
//           {"<"}
//         </button>
//         <img
//           src={images[imgIdx]}
//           alt={product.title}
//           style={{ maxWidth: "200px", maxHeight: "200px" }}
//         />
//         <button onClick={nextImg} disabled={images.length <= 1}>
//           {">"}
//         </button>
//       </div>

//       {/* Thumbnail Strip */}
//       <div style={{ marginTop: "8px" }}>
//         {images.map((img, idx) => (
//           <img
//             key={idx}
//             src={img}
//             alt=""
//             style={{
//               width: 32,
//               height: 32,
//               objectFit: "cover",
//               margin: "0 2px",
//               border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
//               cursor: "pointer",
//               opacity: imgIdx === idx ? 1 : 0.6,
//             }}
//             onClick={() => setImgIdx(idx)}
//           />
//         ))}
//       </div>

//       {/* Product Info */}
//       <p>
//         <b>Price:</b> {product.price}
//       </p>
//       <p>
//         <b>Brand:</b> {product.brand || "N/A"}
//       </p>
//       <p>
//         <b>Description:</b>{" "}
//         {product.description
//           ? Array.isArray(product.description)
//             ? product.description.join(" ")
//             : product.description
//           : "N/A"}
//       </p>
//       <p>
//         <b>Features:</b>
//       </p>
//       <ul>
//         {Array.isArray(product.feature) && product.feature.length > 0 ? (
//           product.feature.map((f, idx) => <li key={idx}>{f}</li>)
//         ) : (
//           <li>N/A</li>
//         )}
//       </ul>

//       {/* Similar Products Mode Buttons */}
//       <div style={{ marginTop: "12px" }}>
//         {["similar_items", "PST", "PSD", "PSTD"].map((m) => (
//           <button
//             key={m}
//             onClick={() => setMode(m)}
//             disabled={mode === m}
//             style={{ marginRight: "5px" }}
//           >
//             {m}
//           </button>
//         ))}
//       </div>

//       {/* Similar Products List */}
//       <div
//         style={{
//           display: "flex",
//           marginTop: "8px",
//           paddingBottom: "8px",
//           overflowX: "hidden",
//         }}
//         onMouseEnter={(e) => (e.currentTarget.style.overflowX = "auto")}
//         onMouseLeave={(e) => (e.currentTarget.style.overflowX = "hidden")}
//       >
//         {similar.length === 0 && <p>No similar products found.</p>}
//         {similar.map((item, i) => (
//           <SimilarProductCard key={i} item={item} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ---------------- Similar Product Card ----------------
// function SimilarProductCard({ item }) {
//   const [expanded, setExpanded] = useState(false);
//   const navigate = useNavigate();

//   return (
//     <div
//       style={{
//         margin: "0 8px",
//         textAlign: "center",
//         minWidth: "150px",
//         border: "1px solid #ddd",
//         borderRadius: "8px",
//         padding: "10px",
//         background: "#fff",
//       }}
//     >
//       <img
//         src={item.imageURLHighRes?.[0] || item.imageURL?.[0] || "/1.png"}
//         alt={item.title || "Product"}
//         style={{ width: "120px", height: "120px", objectFit: "cover" }}
//       />

//       <p style={{ fontSize: "12px", marginTop: "5px" }}>
//         {expanded ? item.title : (item.title || "N/A").slice(0, 40) + "..."}
//         {item.title && item.title.length > 40 && (
//           <button
//             onClick={() => setExpanded(!expanded)}
//             style={{
//               background: "none",
//               border: "none",
//               color: "blue",
//               cursor: "pointer",
//               fontSize: "11px",
//               marginLeft: "4px",
//             }}
//           >
//             {expanded ? "View Less" : "View More"}
//           </button>
//         )}
//       </p>

//       <button
//         onClick={() => navigate(`/product/${item.asin}`)}
//         style={{
//           marginTop: "5px",
//           padding: "5px 8px",
//           backgroundColor: "#ff9900",
//           border: "none",
//           borderRadius: "4px",
//           cursor: "pointer",
//           fontSize: "12px",
//           color: "white",
//         }}
//       >
//         View Details
//       </button>
//     </div>
//   );
// }

// export default ProductDetails;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ProductDetails() {
  const { asin } = useParams();
  const [product, setProduct] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [mode, setMode] = useState("similar_items");
  const [similar, setSimilar] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const navigate = useNavigate();

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/products/${asin}`);
        setProduct(res.data);
        setImgIdx(0);
        setMode("similar_items");
      } catch (err) {
        console.error("Error fetching product:", err.message);
      }
    };
    fetchProduct();
  }, [asin]);

  // Fetch similar products when mode changes
  // useEffect(() => {
  //   if (!product) return;

  //   const fetchSimilar = async () => {
  //     setLoadingSimilar(true);
  //     try {
  //       if (mode === "similar_items") {
  //         const similarAsins = product.similar_asins || [];
  //         if (!similarAsins.length) return setSimilar([]);
  //         const res = await axios.get(
  //           `http://localhost:5000/products/bulk?asins=${similarAsins.join(",")}`
  //         );
  //         setSimilar(res.data || []);
  //       } else {
  //         const res = await axios.get(
  //           `http://localhost:5000/products/${asin}/similar?mode=${mode.toLowerCase()}`
  //         );
  //         setSimilar(res.data || []);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching similar products:", err.message);
  //       setSimilar([]);
  //     } finally {
  //       setLoadingSimilar(false);
  //     }
  //   };

  //   fetchSimilar();
  // }, [mode, product, asin]);
  useEffect(() => {
    if (!product) return;
  
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        if (mode === "similar_items") {
          const similarAsins = product.similar_asins || [];
          if (!similarAsins.length) return setSimilar([]);
          const res = await axios.get(
            `http://localhost:5000/products/bulk?asins=${similarAsins.join(",")}`
          );
          setSimilar(res.data || []);
        } else {
          const modeKey = mode.toLowerCase();
          const res = await axios.get(
            `http://localhost:5000/products/${asin}/similar?mode=${modeKey}`
          );
          setSimilar(res.data?.[modeKey] || []);
        }
      } catch (err) {
        console.error("Error fetching similar products:", err.message);
        setSimilar([]);
      } finally {
        setLoadingSimilar(false);
      }
    };
  
    fetchSimilar();
  }, [mode, product, asin]);
  

  if (!product) return <p>Loading product...</p>;

  const images = product.imageURLHighRes?.length
    ? product.imageURLHighRes
    : ["/1.png"];

  const price = product.price || "N/A";

  const prevImg = () => setImgIdx((imgIdx - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

  return (
    <div className="product-details">
      <button onClick={() => navigate(-1)}>⬅ Back</button>
      <h2>{product.title}</h2>

      {/* Image Carousel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={prevImg} disabled={images.length <= 1}>{"<"}</button>
        <img src={images[imgIdx]} alt={product.title} style={{ maxWidth: 200, maxHeight: 200 }} />
        <button onClick={nextImg} disabled={images.length <= 1}>{">"}</button>
      </div>

      {/* Thumbnails */}
      <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            style={{
              width: 32,
              height: 32,
              objectFit: "cover",
              border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
              cursor: "pointer",
              opacity: imgIdx === idx ? 1 : 0.6,
            }}
            onClick={() => setImgIdx(idx)}
          />
        ))}
      </div>

      {/* Product Info */}
      <p><b>Price:</b> {price}</p>
      <p><b>Brand:</b> {product.brand || "N/A"}</p>
      <p><b>Description:</b> {Array.isArray(product.description) ? product.description.join(" ") : product.description || "N/A"}</p>
      <p><b>Features:</b></p>
      <ul>
        {Array.isArray(product.feature) && product.feature.length
          ? product.feature.map((f, i) => <li key={i}>{f}</li>)
          : <li>N/A</li>
        }
      </ul>

      {/* Mode Buttons */}
      <div style={{ marginTop: 12 }}>
        {["similar_items", "PST", "PSD", "PSTD"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={mode === m}
            style={{
              marginRight: 5,
              fontWeight: mode === m ? "bold" : "normal",
              backgroundColor: mode === m ? "#ffcc00" : "#eee",
              border: "1px solid #ccc",
              padding: "5px 8px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Similar Products */}
      <div
        style={{
          display: "flex",
          marginTop: 8,
          paddingBottom: 8,
          overflowX: "hidden",
        }}
        onMouseEnter={e => e.currentTarget.style.overflowX = "auto"}
        onMouseLeave={e => e.currentTarget.style.overflowX = "hidden"}
      >
        {loadingSimilar ? (
          <p>Loading similar products...</p>
        ) : !similar.length ? (
          <p>No similar products found.</p>
        ) : (
          similar.map((item) => <SimilarProductCard key={item.asin} item={item} />)
        )}
      </div>
    </div>
  );
}

// ---------------- Similar Product Card ----------------
function SimilarProductCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{
      margin: "0 8px",
      textAlign: "center",
      minWidth: 150,
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 10,
      background: "#fff"
    }}>
      <img
        src={item.imageURLHighRes?.[0] || item.imageURL?.[0] || "/1.png"}
        alt={item.title || "Product"}
        style={{ width: 120, height: 120, objectFit: "cover" }}
      />

      <p style={{ fontSize: 12, marginTop: 5 }}>
        {expanded ? item.title : (item.title || "N/A").slice(0, 40) + "..."}
        {item.title?.length > 40 && (
          <button onClick={() => setExpanded(!expanded)} style={{
            background: "none",
            border: "none",
            color: "blue",
            cursor: "pointer",
            fontSize: 11,
            marginLeft: 4
          }}>
            {expanded ? "View Less" : "View More"}
          </button>
        )}
      </p>

      <button onClick={() => navigate(`/product/${item.asin}`)} style={{
        marginTop: 5,
        padding: "5px 8px",
        backgroundColor: "#ff9900",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 12,
        color: "white"
      }}>
        View Details
      </button>
    </div>
  );
}

export default ProductDetails;
