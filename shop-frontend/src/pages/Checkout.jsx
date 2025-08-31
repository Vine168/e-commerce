import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useCart } from "../context/CartContext";
import { orderAPI } from "../services/api";
import { ArrowLeft, CreditCard } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceCents / 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      setLoading(true);

      // Prepare order data
      const orderData = {
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        items: items.map((item) => ({
          productId: item.product.id,
          qty: item.quantity,
        })),
      };

      // Create order
      const orderResponse = await orderAPI.create(orderData);
      const order = orderResponse.data;

      // Generate KHQR for payment
      const khqrResponse = await orderAPI.generateKHQR(order.id);
      const khqrData = khqrResponse.data;

      // Clear cart and navigate to payment page
      clearCart();
      navigate("/payment", {
        state: {
          order,
          khqrData,
          customerInfo: formData,
        },
      });
    } catch (error) {
      console.error("Failed to create order:", error);
      alert(
        error.response?.data?.message ||
          "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-16 w-16 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              No items to checkout
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Add some products to your cart before proceeding to checkout.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-medium hover:shadow-lg transition-all duration-200 text-lg">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Continue Shopping
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
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600 mt-1">Complete your order details</p>
            </div>
            <Link to="/cart">
              <Button
                variant="ghost"
                className="hover:bg-gray-50 rounded-full px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-xl font-semibold">
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Name */}
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.customerName
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.customerName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                          !
                        </span>
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.phone
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="+855 12 345 678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                          !
                        </span>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 mb-3"
                    >
                      Delivery Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={4}
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                        errors.address
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="Enter your full delivery address"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                          !
                        </span>
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-medium text-lg hover:shadow-lg transition-all duration-200 mt-8"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-3" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden sticky top-8">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle className="text-xl font-semibold">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="max-h-64 overflow-y-auto modal-scrollbar space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                          <img
                            src={
                              item.product.imageUrl ||
                              "/placeholder-product.svg"
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity} ×{" "}
                            {formatPrice(item.product.priceCents)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatPrice(item.product.priceCents * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm font-bold">💳</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Payment Method
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        You will pay using <strong>Bakong KHQR</strong>. After
                        placing your order, you'll receive a QR code to scan
                        with your banking app.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
