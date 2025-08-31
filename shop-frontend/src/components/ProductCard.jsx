import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Eye } from "lucide-react";

const ProductCard = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { addToCart, getItemQuantity } = useCart();

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceCents / 100);
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const itemQuantity = getItemQuantity(product.id);

  const PlaceholderImage = () => (
    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-2xl">
      <div className="text-center">
        <div className="text-5xl mb-3 opacity-50">📦</div>
        <p className="text-gray-500 text-sm font-medium">No Image Available</p>
      </div>
    </div>
  );

  return (
    <div className="group">
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl bg-white">
        {/* Product Image */}
        <div className="relative overflow-hidden">
          {imageError ? (
            <PlaceholderImage />
          ) : (
            <>
              {imageLoading && (
                <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-t-2xl flex items-center justify-center">
                  <div className="text-gray-400 font-medium">Loading...</div>
                </div>
              )}
              <img
                src={product.imageUrl || "/placeholder-product.svg"}
                alt={product.name}
                className={`w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105 ${
                  imageLoading ? "hidden" : "block"
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </>
          )}

          {/* In cart indicator */}
          {itemQuantity > 0 && (
            <div className="absolute top-4 right-4">
              <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-blue-100">
                {itemQuantity} in cart
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Link to={`/product/${product.slug}`}>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Quick View
              </Button>
            </Link>
          </div>
        </div>

        {/* Product Info */}
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          <div className="mb-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(product.priceCents)}
            </div>
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardFooter className="p-6 pt-0">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProductCard;
