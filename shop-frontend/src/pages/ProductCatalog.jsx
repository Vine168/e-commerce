import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { totalItems } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Failed to load products. Please try again later.");

      // Fallback to mock data for development
      setProducts([
        {
          id: "mock1",
          name: "Wireless Bluetooth Headphones",
          slug: "wireless-bluetooth-headphones",
          priceCents: 4999,
          currency: "USD",
          imageUrl:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        },
        {
          id: "mock2",
          name: "Smartphone Case - Clear",
          slug: "smartphone-case-clear",
          priceCents: 1999,
          currency: "USD",
          imageUrl:
            "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=400",
        },
        {
          id: "mock3",
          name: "USB-C Cable 2m",
          slug: "usb-c-cable-2m",
          priceCents: 1299,
          currency: "USD",
          imageUrl:
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        },
        {
          id: "mock4",
          name: "Wireless Charging Pad",
          slug: "wireless-charging-pad",
          priceCents: 2999,
          currency: "USD",
          imageUrl:
            "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header Section */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Accessories Store
                </h1>
                <p className="text-sm text-gray-500">
                  Premium accessories for modern life
                </p>
              </div>
            </div>

            <Link to="/cart">
              <Button
                variant="outline"
                className="relative bg-white hover:bg-gray-50 border-gray-200 rounded-full px-6 py-2.5 transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="font-medium">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-lg">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Accessories
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Elevate your lifestyle with our carefully curated collection of
            premium accessories
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-amber-600 text-sm">⚠</span>
                </div>
                <div>
                  <p className="text-amber-800 font-medium">{error}</p>
                  <p className="text-amber-600 text-sm mt-1">
                    Showing demo products for now.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No products available
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We're currently updating our inventory. Please check back soon for
              amazing new products.
            </p>
            <Button
              onClick={fetchProducts}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductCatalog;
