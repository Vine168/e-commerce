import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navigation from "./components/Navigation";
import ProductCatalog from "./pages/ProductCatalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-16 md:pb-0">
          <Routes>
            {/* Main store routes */}
            <Route path="/" element={<ProductCatalog />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="container mx-auto px-4 py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600 mb-8">
                      The page you are looking for does not exist.
                    </p>
                    <a
                      href="/"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                    >
                      Return Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>

          {/* Mobile Navigation */}
          <Navigation />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
