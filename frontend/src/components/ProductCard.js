// import React, { useState } from "react";

// const ProductCard = ({ product }) => {
//   const [showFull, setShowFull] = useState(false);
//   const maxLength = 50;

//   const toggleTitle = () => setShowFull(!showFull);

//   const displayTitle = () => {
//     if (!product.title) return "";
//     if (showFull || product.title.length <= maxLength) return product.title;
//     return product.title.slice(0, maxLength) + "...";
//   };

//   return (
//     <div className="product-card">
//       <img
//         src={product.imageURL?.[0] || "/1.png"}
//         alt={product.title}
//       />
//       <h3>
//         {displayTitle()}{" "}
//         {product.title?.length > maxLength && (
//           <span
//             onClick={toggleTitle}
//             style={{ color: "blue", cursor: "pointer" }}
//           >
//             {showFull ? "Show Less" : "View More"}
//           </span>
//         )}
//       </h3>
//       <p>
//         <b>Price:</b> {product.price?.startsWith("$") ? product.price : "N/A"}
//       </p>
//     </div>
//   );
// };

// export default ProductCard;

import React, { useState } from "react";

const ProductCard = ({ product, onViewMore }) => {
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
        src={
          product.imageURLHighRes?.[0] ||
          "/1.png"
        }
        alt={product.title}
        style={{ width: "150px", height: "150px", objectFit: "contain" }}
      />
      <h3>
        {displayTitle()}{" "}
        {product.title?.length > maxLength && (
          <span
            onClick={toggleTitle}
            style={{ color: "blue", cursor: "pointer", fontSize: "0.9em" }}
          >
            {showFull ? "Show Less" : "View More"}
          </span>
        )}
      </h3>
      <p>
        <b>Price:</b> {product.price ? `$${product.price.replace(/^\$/, "")}` : "N/A"}
      </p>
      <button onClick={() => onViewMore(product.asin)}>View Details</button>
    </div>
  );
};

export default ProductCard;
