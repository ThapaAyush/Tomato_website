import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const PlaceOrder = ({ setShowLogin }) => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    setCartItems,
    clearCart,
    promoCode,
    getDiscountAmount,
    url,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // Handle input changes
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  const finalizeOrderSuccess = (message = "Order placed successfully!") => {
    if (typeof clearCart === "function") {
      clearCart();
    } else if (typeof setCartItems === "function") {
      setCartItems({});
    }
    try {
      localStorage.removeItem("food-del-cart");
    } catch (e) {
      console.warn("Could not clear saved cart:", e);
    }
    alert(message);
    navigate("/orders");
  };

  // Place order
  const placeOrder = async (event) => {
    event.preventDefault();

    const activeToken = token || localStorage.getItem("token");

    if (!activeToken) {
      alert("Please login first to continue with checkout");
      if (setShowLogin) setShowLogin(true);
      return;
    }

    const totalAmount = getTotalCartAmount();

    // Check cart
    if (totalAmount === 0) {
      alert("Your cart is empty");
      navigate("/cart");
      return;
    }

    // Create order items
    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        ...item,
        quantity: cartItems[item._id],
      }));

    if (orderItems.length === 0) {
      alert("Your cart is empty");
      navigate("/cart");
      return;
    }

    try {
      setSubmitting(true);

      const discount = typeof getDiscountAmount === "function" ? getDiscountAmount() : 0;
      const payableAmount = Math.max(0, totalAmount - discount) + 2;

      const orderPayload = {
        address: data,
        items: orderItems,
        amount: payableAmount,
        discount: discount,
        promoCode: promoCode || null,
        paymentMethod: paymentMethod,
      };

      const response = await axios.post(
        `${url}/api/order/place`,
        orderPayload,
        {
          headers: {
            token: activeToken,
          },
        }
      );

      // Check backend response
      if (!response.data?.success) {
        alert(response.data?.message || "Unable to create order. Please try again.");
        setSubmitting(false);
        return;
      }

      // If Cash on Delivery or fallback
      if (paymentMethod === "cod" || response.data?.paymentMethod === "cod") {
        finalizeOrderSuccess(response.data?.message || "Order placed successfully with Cash on Delivery!");
        return;
      }

      // Razorpay Online Payment Flow
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        alert("Payment gateway script could not be loaded. Your order was placed as Cash on Delivery.");
        finalizeOrderSuccess("Order placed successfully with Cash on Delivery!");
        return;
      }

      const { key, order } = response.data;

      if (!key || !order || !order.id) {
        // Safe fallback
        finalizeOrderSuccess("Order placed successfully!");
        return;
      }

      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Tomato.",
        description: "Food order payment",
        order_id: order.id,
        handler: function () {
          finalizeOrderSuccess("Payment successful! Your order has been placed.");
        },
        prefill: {
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          contact: data.phone,
        },
        theme: {
          color: "#ff4d4d",
        },
        modal: {
          ondismiss: function () {
            alert("Payment window closed. You can track your order in My Orders.");
            finalizeOrderSuccess("Order placed! Tracking available in My Orders.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (failResponse) {
        console.error("Payment failed:", failResponse.error);
        alert(failResponse.error?.description || "Payment failed. Order saved for offline processing.");
        finalizeOrderSuccess("Order created. Please pay cash upon arrival.");
      });

      razorpay.open();
    } catch (error) {
      console.error("Place order error:", error);
      const errMsg = error.response?.data?.message || "Server error while placing order. Please try again.";
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect if cart is empty on mount
  useEffect(() => {
    const total = getTotalCartAmount();
    if (total === 0 && (!cartItems || Object.keys(cartItems).length === 0)) {
      navigate("/cart");
    }
  }, [getTotalCartAmount, cartItems, navigate]);

  return (
    <form className="place-order" onSubmit={placeOrder}>
      {/* LEFT SIDE - DELIVERY DETAILS */}
      <div className="place-order-left">
        <h2 className="title">Delivery Details</h2>

        <div className="multi-fields">
          <input
            type="text"
            name="firstName"
            value={data.firstName}
            onChange={onChangeHandler}
            placeholder="First Name"
            required
          />

          <input
            type="text"
            name="lastName"
            value={data.lastName}
            onChange={onChangeHandler}
            placeholder="Last Name"
            required
          />
        </div>

        <div className="multi-fields">
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={onChangeHandler}
            placeholder="Email Address"
            required
          />

          <input
            type="tel"
            name="phone"
            value={data.phone}
            onChange={onChangeHandler}
            placeholder="Phone Number"
            required
          />
        </div>

        <input
          type="text"
          name="street"
          value={data.street}
          onChange={onChangeHandler}
          placeholder="Street Address"
          required
        />

        <div className="multi-fields">
          <input
            type="text"
            name="city"
            value={data.city}
            onChange={onChangeHandler}
            placeholder="City"
            required
          />

          <input
            type="text"
            name="state"
            value={data.state}
            onChange={onChangeHandler}
            placeholder="State"
            required
          />
        </div>

        <div className="multi-fields">
          <input
            type="text"
            name="zipcode"
            value={data.zipcode}
            onChange={onChangeHandler}
            placeholder="Zipcode"
            required
          />

          <input
            type="text"
            name="country"
            value={data.country}
            onChange={onChangeHandler}
            placeholder="Country"
            required
          />
        </div>
      </div>

      {/* RIGHT SIDE - CART TOTAL & PAYMENT */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₹{getTotalCartAmount()}</p>
            </div>

            {typeof getDiscountAmount === "function" && getDiscountAmount() > 0 && (
              <div className="cart-total-details cart-discount-row" style={{ color: '#1b8a3e', background: '#eef9f1', padding: '8px 12px', borderRadius: '8px', margin: '4px 0' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1b8a3e', margin: 0 }}>
                  <span>🎁 Promo Discount ({promoCode})</span>
                  <span style={{ background: '#1b8a3e', color: '#fff', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '6px' }}>50% OFF</span>
                </p>
                <b style={{ color: '#1b8a3e', margin: 0 }}>-₹{getDiscountAmount()}</b>
              </div>
            )}

            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₹{getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>

            <hr />

            <div className="cart-total-details">
              <b>Total</b>
              <b>
                ₹
                {getTotalCartAmount() === 0
                  ? 0
                  : Math.max(0, getTotalCartAmount() - (typeof getDiscountAmount === "function" ? getDiscountAmount() : 0)) + 2}
              </b>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-options-section">
            <h3 className="payment-title">Payment Method</h3>
            <div className="payment-methods-grid">
              <label className={`payment-method-card ${paymentMethod === "cod" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div className="payment-method-content">
                  <span className="payment-icon">💵</span>
                  <div>
                    <span className="payment-name">Cash on Delivery</span>
                    <span className="payment-desc">Pay cash when food arrives</span>
                  </div>
                </div>
              </label>

              <label className={`payment-method-card ${paymentMethod === "razorpay" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
                <div className="payment-method-content">
                  <span className="payment-icon">💳</span>
                  <div>
                    <span className="payment-name">Online Payment</span>
                    <span className="payment-desc">UPI, Cards, NetBanking (Razorpay)</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={submitting}>
            {submitting
              ? "PROCESSING ORDER..."
              : paymentMethod === "cod"
              ? "PLACE ORDER (CASH ON DELIVERY)"
              : "PROCEED TO ONLINE PAYMENT"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;