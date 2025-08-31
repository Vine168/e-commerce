import { useState, useRef } from "react";
import axios from "axios";

const CheckoutModal = ({ product, onClose, onSuccess, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    quantity: 1,
  });
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const totalAmount = (product.price * formData.quantity).toFixed(2);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuantityChange = (increment) => {
    const maxStock = product.stock || 999;
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, Math.min(maxStock, prev.quantity + increment)),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setQrFile(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setQrFile(null);
    setQrPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.customer_name.trim()) {
        throw new Error("Customer name is required");
      }

      // Prepare checkout data
      const checkoutData = {
        product_id: product.id,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim() || null,
        customer_phone: formData.customer_phone.trim() || null,
        quantity: formData.quantity,
        payment_method: "qr_code",
      };

      // If QR receipt is uploaded, we can simulate payment success
      // In a real app, you'd upload the image to a cloud service first
      if (qrFile) {
        console.log("QR Receipt uploaded:", qrFile.name);
        // In real implementation, upload file to cloud storage here
        // and get the URL to include in the checkout data
      }

      // Call checkout API
      const response = await axios.post(`${apiBaseUrl}/checkout`, checkoutData);

      if (response.data.success) {
        onSuccess(response.data.data);
      } else {
        throw new Error(response.data.message || "Checkout failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Checkout failed");
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Product Summary */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-2xl">
              📦
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-gray-600 text-sm">${product.price}</p>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                disabled={formData.quantity <= 1}
              >
                -
              </button>
              <span className="w-12 text-center font-medium">
                {formData.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                disabled={formData.quantity >= (product.stock || 999)}
              >
                +
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label
              htmlFor="customer_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          {/* Customer Email */}
          <div>
            <label
              htmlFor="customer_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="customer_email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email (optional)"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label
              htmlFor="customer_phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="customer_phone"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number (optional)"
            />
          </div>

          {/* QR Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Receipt (QR Code)
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> QR
                      receipt
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* QR Preview */}
              {qrPreview && (
                <div className="relative">
                  <img
                    src={qrPreview}
                    alt="QR Receipt Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">${totalAmount}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
