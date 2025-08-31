import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";

const Cart = () => {
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } =
    useCart();

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceCents / 100);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Add some amazing products to get started on your shopping journey!
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-medium hover:shadow-lg transition-all duration-200 text-lg">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-gray-600 mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} in your
                cart
              </p>
            </div>
            <Link to="/">
              <Button
                variant="ghost"
                className="hover:bg-gray-50 rounded-full px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card
                key={item.product.id}
                className="border-0 shadow-sm rounded-2xl overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={
                            item.product.imageUrl || "/placeholder-product.svg"
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-product.svg";
                          }}
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600">
                        {formatPrice(item.product.priceCents)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(
                            item.product.id,
                            item.quantity - 1
                          )
                        }
                        className="w-10 h-10 p-0 rounded-full border-gray-200 hover:border-gray-300"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-4 py-2 bg-gray-50 rounded-xl min-w-[60px] text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(
                            item.product.id,
                            item.quantity + 1
                          )
                        }
                        className="w-10 h-10 p-0 rounded-full border-gray-200 hover:border-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[100px]">
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(item.product.priceCents * item.quantity)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-10 h-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end pt-4">
              <Button
                variant="ghost"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full px-6"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Items
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden sticky top-8">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-xl font-semibold">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-700">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(item.product.priceCents * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                <Link to="/checkout" className="block mt-6">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-medium text-lg hover:shadow-lg transition-all duration-200"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
