import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { orderAPI } from "../services/api";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
} from "lucide-react";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, khqrData, customerInfo } = location.state || {};

  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [timeLeft, setTimeLeft] = useState(khqrData?.expiresIn || 600); // 10 minutes default
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);
  const [newQrData, setNewQrData] = useState(khqrData);

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Redirect if no order data
  useEffect(() => {
    if (!order || !khqrData) {
      navigate("/");
      return;
    }
  }, [order, khqrData, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus("EXPIRED");
      setPolling(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus("EXPIRED");
          setPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Payment status polling
  useEffect(() => {
    if (!polling || paymentStatus !== "PENDING") return;

    const pollPaymentStatus = async () => {
      try {
        const response = await orderAPI.checkPaymentStatus(order.id);
        const status = response.data.status;

        if (status === "PAID") {
          setPaymentStatus("PAID");
          setPolling(false);
        } else if (status === "EXPIRED") {
          setPaymentStatus("EXPIRED");
          setPolling(false);
        }
      } catch (error) {
        console.error("Failed to check payment status:", error);
        setError("Failed to check payment status");
      }
    };

    // Poll every 3 seconds
    const pollInterval = setInterval(pollPaymentStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [polling, paymentStatus, order?.id]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(priceCents / 100);
  };

  const handleRegenerateQR = async () => {
    try {
      setError(null);
      const response = await orderAPI.generateKHQR(order.id);
      setNewQrData(response.data);
      setTimeLeft(response.data.expiresIn || 600);
      setPaymentStatus("PENDING");
      setPolling(true);
    } catch (error) {
      console.error("Failed to regenerate QR:", error);
      setError("Failed to regenerate QR code. Please try again.");
    }
  };

  // Receipt upload functions
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (PNG, JPG, etc.)");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setError(null);
  };

  const handleSubmitReceipt = async () => {
    if (!receiptFile) {
      setError("Please select a receipt image to upload");
      return;
    }

    setUploadLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("orderId", order.id);
      formData.append("amount", order.amountCents);
      formData.append("customerName", order.customerName);

      const response = await fetch(
        "http://localhost:3001/api/orders/upload-receipt",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setUploadSuccess(true);
        setPaymentStatus("RECEIPT_UPLOADED");
        setPolling(false);

        // Show success message
        alert(
          "Receipt uploaded successfully! We will verify your payment and send confirmation via Telegram."
        );
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Receipt upload failed:", error);
      setError("Failed to upload receipt. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order not found
          </h1>
          <Link to="/">
            <Button>Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Payment
          </h1>
          <p className="text-xl text-gray-600">
            Scan the Bakong KHQR code below with your banking app
          </p>
          {newQrData?.isStaticKhqr && (
            <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              💳 Pay directly to our store account
            </div>
          )}
        </div>

        {/* Payment Status */}
        {paymentStatus === "PAID" && (
          <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-800 mb-4">
                Payment Successful!
              </h2>
              <p className="text-green-700 mb-6 text-lg">
                Thank you for your purchase. Your order #{order.id.slice(-8)}{" "}
                has been confirmed and will be processed shortly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200">
                    Continue Shopping
                  </Button>
                </Link>
                <Button variant="outline" className="rounded-full px-8 py-3">
                  View Order Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "EXPIRED" && (
          <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center bg-gradient-to-r from-red-50 to-orange-50">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-red-800 mb-4">
                Payment Expired
              </h2>
              <p className="text-red-700 mb-6 text-lg">
                The QR code has expired. You can generate a new one to complete
                your payment.
              </p>
              <Button
                onClick={handleRegenerateQR}
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Generate New QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "PENDING" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-6">
                <CardTitle className="flex items-center justify-center text-xl">
                  <Clock className="h-6 w-6 mr-3 text-white" />
                  Time Remaining: {formatTime(timeLeft)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center p-8">
                {/* QR Code Image */}
                <div className="bg-white p-8 rounded-2xl border shadow-sm mb-6 inline-block">
                  {/* Always display your static KHQR image */}
                  <img
                    src="public/khqr.png"
                    alt="KHQR Payment Code"
                    className="w-30 h-30 mx-auto object-contain"
                    onError={(e) => {
                      console.error("Failed to load KHQR image:", e);
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "block";
                    }}
                  />

                  {/* Fallback message if image fails to load */}
                  <div
                    style={{ display: "none" }}
                    className="w-64 h-64 mx-auto bg-red-50 border-2 border-dashed border-red-200 rounded-xl flex items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="text-red-600 text-sm font-medium mb-2">
                        KHQR Image Not Found
                      </p>
                      <p className="text-red-500 text-xs">
                        Please add khqr.png to shop-backend/public/ folder
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    How to pay:
                  </h4>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <p>Open your banking app (ABA, ACLEDA, Wing, etc.)</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <p>Scan the Bakong KHQR code above</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <p>
                      Pay exactly:{" "}
                      <strong className="text-blue-900">
                        {formatPrice(order.amountCents)}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      4
                    </span>
                    <p>Take a screenshot of payment confirmation</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      5
                    </span>
                    <p>Upload the screenshot below to complete your order</p>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 text-sm">💡</span>
                      <div>
                        <p className="text-green-800 font-medium text-sm">
                          Quick Manual Verification:
                        </p>
                        <p className="text-green-700 text-sm">
                          After payment, upload your receipt below. We'll verify
                          and confirm your order via Telegram within minutes!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipt Upload Section */}
                <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl">
                  <h4 className="font-semibold text-purple-900 mb-4 text-lg flex items-center">
                    📸 Upload Payment Receipt
                  </h4>

                  {!uploadSuccess ? (
                    <div className="space-y-4">
                      {!receiptFile ? (
                        <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
                          <div className="text-purple-500 mb-4">
                            <svg
                              className="w-12 h-12 mx-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>
                          <p className="text-purple-700 mb-2 font-medium">
                            Click to upload receipt
                          </p>
                          <p className="text-purple-600 text-sm mb-4">
                            PNG, JPG, or other image formats
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="hidden"
                            id="receipt-upload"
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="cursor-pointer inline-block px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                          >
                            Choose File
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border border-purple-200 rounded-xl p-4 bg-white">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <img
                                  src={receiptPreview}
                                  alt="Receipt Preview"
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium text-gray-900">
                                  {receiptFile.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {(receiptFile.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                                <button
                                  onClick={handleRemoveReceipt}
                                  className="text-red-500 text-sm hover:text-red-700 mt-2"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleSubmitReceipt}
                            disabled={uploadLoading}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {uploadLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Submit Receipt</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Receipt Uploaded!
                      </h3>
                      <p className="text-green-600">
                        We've received your payment receipt. You'll get
                        confirmation via Telegram soon!
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                    <span className="w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center font-bold">
                      !
                    </span>
                    <div>
                      <p className="text-red-700 font-medium">Error</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold mb-3 text-gray-900">
                    Customer Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Name:</strong> {customerInfo.customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {customerInfo.phone}
                    </p>
                    <p>
                      <strong>Address:</strong> {customerInfo.address}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">
                    Order Items
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {order.orderItems?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium">
                          {item.product?.name || "Product"} × {item.qty}
                        </span>
                        <span className="font-bold">
                          {formatPrice(item.priceCents * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total Amount</span>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formatPrice(order.amountCents)}
                    </span>
                  </div>
                </div>

                {/* Order ID */}
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                  <p className="mb-1">
                    <strong>Order ID:</strong> {order.id}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link to="/">
            <Button
              variant="ghost"
              className="hover:bg-white/50 rounded-full px-8 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Payment;
