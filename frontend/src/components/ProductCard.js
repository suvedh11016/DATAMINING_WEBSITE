// import React from "react";

// const ProductCard = ({ product }) => {
//   return (
//     <div className="product-card">
//       <img
//         src={product.imageURL?.[0] || "https://via.placeholder.com/150"}
//         alt={product.title}
//       />
//       {/* <h3>{product.title}</h3> */}
//       <h3>{product.title?.length > 50 ? product.title.slice(0, 50) + "..." : product.title}</h3>

//       {/* <p><b>Price:</b> {product.price || "N/A"}</p> */}
//       <p>
//   <b>Price:</b> {product.price?.startsWith("$") ? product.price : "N/A"}
// </p>

//       {/* <p><b>Brand:</b> {product.brand || "N/A"}</p> */}
//     </div>
//   );
// };

// export default ProductCard;

import React, { useState } from "react";

const ProductCard = ({ product }) => {
  const [showFull, setShowFull] = useState(false);
  const maxLength = 50;

  const toggleTitle = () => setShowFull(!showFull);

  const displayTitle = () => {
    if (!product.title) return "";
    if (showFull || product.title.length <= maxLength) return product.title;
    return product.title.slice(0, maxLength) + "...";
  };

  return (
    <div className="product-card">
      <img
        src={product.imageURL?.[0] || "/1.png"}
        alt={product.title}
      />
      <h3>
        {displayTitle()}{" "}
        {product.title?.length > maxLength && (
          <span
            onClick={toggleTitle}
            style={{ color: "blue", cursor: "pointer" }}
          >
            {showFull ? "Show Less" : "View More"}
          </span>
        )}
      </h3>
      <p>
        <b>Price:</b> {product.price?.startsWith("$") ? product.price : "N/A"}
      </p>
    </div>
  );
};

export default ProductCard;
