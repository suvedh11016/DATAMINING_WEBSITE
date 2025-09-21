import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ProductDetails() {
    const { asin } = useParams();
    const [product, setProduct] = useState(null);
    const [imgIdx, setImgIdx] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/products/${asin}`);
                setProduct(res.data);
                setImgIdx(0); // Reset carousel on new product
            } catch (err) {
                console.error(err);
            }
        };
        fetchProduct();
    }, [asin]);

    if (!product) return <p>Loading...</p>;

    const images = product.imageURLHighRes && product.imageURLHighRes.length > 0 ? product.imageURLHighRes : ["/1.png"];

    const prevImg = () => setImgIdx((imgIdx - 1 + images.length) % images.length);
    const nextImg = () => setImgIdx((imgIdx + 1) % images.length);

    if (!product.price || !product.price.startsWith("$")) {
        product.price = "N/A";
    }
    console.log(product);
    return (
        <div className="product-details">
            <button onClick={() => navigate(-1)}>⬅ Back</button>
            <h2>{product.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={prevImg} disabled={images.length <= 1}>{"<"}</button>
                <img
                    src={images[imgIdx]}
                    alt={product.title}
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                />
                <button onClick={nextImg} disabled={images.length <= 1}>{">"}</button>
            </div>
            <div style={{ marginTop: "8px" }}>
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt=""
                        style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            margin: "0 2px",
                            border: imgIdx === idx ? "2px solid #333" : "1px solid #ccc",
                            cursor: "pointer",
                            opacity: imgIdx === idx ? 1 : 0.6,
                        }}
                        onClick={() => setImgIdx(idx)}
                    />
                ))}
            </div>
            <p><b>Price:</b> {product.price}</p>
            <p><b>Brand:</b> {product.brand ? product.brand : "N/A"}</p>
            <p><b>Description:</b> {
                product.description
                    ? (Array.isArray(product.description)
                        ? product.description.join(" ")
                        : product.description)
                    : "N/A"
            }</p>
            <p><b>Features:</b></p>
            <ul>
                {Array.isArray(product.feature) && product.feature.length > 0
                    ? product.feature.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                    ))
                    : <li>N/A</li>
                }
            </ul>
        </div>
    );
}

export default ProductDetails;
