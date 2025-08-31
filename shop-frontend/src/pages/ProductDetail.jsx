import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { productAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCart } from "../context/CartContext";
import { ShoppingCart, ArrowLeft, Plus, Minus } from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const { addToCart, getItemQuantity } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getBySlug(slug);
      setProduct(response.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceCents / 100);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setQuantity(1);
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The product you are looking for does not exist."}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const itemInCart = getItemQuantity(product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </Link>
      </div>

      {/* Product Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {imageError ? (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl text-gray-400 mb-4">📦</div>
                    <p className="text-gray-500">No Image Available</p>
                  </div>
                </div>
              ) : (
                <img
                  src={product.imageUrl || "/placeholder-product.svg"}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {formatPrice(product.priceCents)}
            </div>
          </div>

          {itemInCart > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                {itemInCart} item{itemInCart > 1 ? "s" : ""} already in cart
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 border border-gray-200 rounded-md min-w-[60px] text-center">
                  {quantity}
                </span>
                <Button variant="outline" size="sm" onClick={incrementQuantity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full lg:w-auto"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add {quantity} to Cart -{" "}
              {formatPrice(product.priceCents * quantity)}
            </Button>
          </div>

          {/* Product Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Product ID:</span>
                  <span className="font-mono">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="font-mono">{product.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span>{product.currency}</span>
                </div>
                {product.createdAt && (
                  <div className="flex justify-between">
                    <span>Added:</span>
                    <span>
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
