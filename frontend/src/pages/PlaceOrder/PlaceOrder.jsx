import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { INDIAN_CITIES, INDIAN_STATES, CITY_STATE_MAPPING, COUNTRIES, COUNTRY_PHONE_CODES } from "../../assets/indiaLocations";

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
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
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

  // Handle country changes & auto-sync calling code
  const handleCountryChange = (event) => {
    const val = event.target.value;
    setData((prev) => ({ ...prev, country: val }));
    if (val === "Nepal") setCountryCode("+977");
    else if (val === "India") setCountryCode("+91");
    else if (val === "United States" || val === "Canada") setCountryCode("+1");
    else if (val === "United Kingdom") setCountryCode("+44");
    else if (val === "Australia") setCountryCode("+61");
    else if (val === "United Arab Emirates") setCountryCode("+971");
    else if (val === "Singapore") setCountryCode("+65");
  };

  // Handle city selection
  const handleCitySelect = (event) => {
    const val = event.target.value;
    if (val === "other") {
      setIsCustomCity(true);
      setData((prev) => ({ ...prev, city: "" }));
    } else {
      setIsCustomCity(false);
      const matchedState = CITY_STATE_MAPPING[val];
      setData((prev) => ({
        ...prev,
        city: val,
        ...(matchedState ? { state: matchedState } : {}),
      }));
    }
  };

  // Handle state selection
  const handleStateSelect = (event) => {
    const val = event.target.value;
    if (val === "other") {
      setIsCustomState(true);
      setData((prev) => ({ ...prev, state: "" }));
    } else {
      setIsCustomState(false);
      setData((prev) => ({ ...prev, state: val }));
    }
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

  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOrderSuccess = (orderInfo) => {
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
    setErrorMessage("");
    setOrderSuccessData(orderInfo);
  };

  // Place order
  const placeOrder = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const activeToken = token || localStorage.getItem("token");

    if (!activeToken) {
      setErrorMessage("Please sign in first to continue with checkout");
      if (setShowLogin) setShowLogin(true);
      return;
    }

    const totalAmount = getTotalCartAmount();

    // Check cart
    if (totalAmount === 0) {
      setErrorMessage("Your cart is empty. Add items from the menu to proceed.");
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
      setErrorMessage("Your cart is empty. Add items from the menu to proceed.");
      navigate("/cart");
      return;
    }

    try {
      setSubmitting(true);

      const fullPhone = `${countryCode} ${phoneDigits.trim()}`.trim();
      if (!phoneDigits.trim()) {
        setErrorMessage("Please enter your phone number to receive delivery updates.");
        setSubmitting(false);
        return;
      }

      const discount = typeof getDiscountAmount === "function" ? getDiscountAmount() : 0;
      const payableAmount = Math.max(0, totalAmount - discount) + 2;

      const orderPayload = {
        address: {
          ...data,
          phone: fullPhone,
        },
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
        setErrorMessage(response.data?.message || "Unable to create order. Please try again.");
        setSubmitting(false);
        return;
      }

      // If Cash on Delivery or fallback
      if (paymentMethod === "cod" || response.data?.paymentMethod === "cod") {
        handleOrderSuccess({
          orderId: response.data?.orderId || `ORD-${Date.now().toString().slice(-6)}`,
          paymentMethod: "cod",
          amount: payableAmount,
          items: orderItems,
          address: {
            ...data,
            phone: fullPhone,
          },
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        return;
      }

      // Razorpay Online Payment Flow
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        handleOrderSuccess({
          orderId: response.data?.orderId || `ORD-${Date.now().toString().slice(-6)}`,
          paymentMethod: "cod",
          amount: payableAmount,
          items: orderItems,
          address: {
            ...data,
            phone: fullPhone,
          },
          note: "Payment gateway script could not load. Order confirmed with Cash on Delivery!",
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        return;
      }

      const { key, order } = response.data;

      if (!key || !order || !order.id) {
        // Safe fallback
        handleOrderSuccess({
          orderId: response.data?.orderId || `ORD-${Date.now().toString().slice(-6)}`,
          paymentMethod: "cod",
          amount: payableAmount,
          items: orderItems,
          address: {
            ...data,
            phone: fullPhone,
          },
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        return;
      }

      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Tomato.",
        description: "Food order payment",
        order_id: order.id,
        handler: function (razorpayResponse) {
          handleOrderSuccess({
            orderId: response.data?.orderId || razorpayResponse?.razorpay_order_id || `ORD-${Date.now().toString().slice(-6)}`,
            paymentId: razorpayResponse?.razorpay_payment_id,
            paymentMethod: "razorpay",
            amount: payableAmount,
            items: orderItems,
            address: {
              ...data,
              phone: fullPhone,
            },
            placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        },
        prefill: {
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          contact: `${countryCode}${phoneDigits}`.replace(/\D/g, ""),
        },
        theme: {
          color: "#ff4d4d",
        },
        modal: {
          ondismiss: function () {
            handleOrderSuccess({
              orderId: response.data?.orderId || `ORD-${Date.now().toString().slice(-6)}`,
              paymentMethod: "cod",
              amount: payableAmount,
              items: orderItems,
              address: {
                ...data,
                phone: fullPhone,
              },
              note: "Payment window was closed. Order confirmed with Cash on Delivery!",
              placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (failResponse) {
        console.error("Payment failed:", failResponse.error);
        handleOrderSuccess({
          orderId: response.data?.orderId || `ORD-${Date.now().toString().slice(-6)}`,
          paymentMethod: "cod",
          amount: payableAmount,
          items: orderItems,
          address: {
            ...data,
            phone: fullPhone,
          },
          note: "Payment failed. Order saved with Cash on Delivery!",
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });

      razorpay.open();
    } catch (error) {
      console.error("Place order error:", error);
      const errMsg = error.response?.data?.message || "Server error while placing order. Please try again.";
      setErrorMessage(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect if cart is empty on mount (only when not showing the congratulations modal)
  useEffect(() => {
    if (orderSuccessData) return;
    const total = getTotalCartAmount();
    if (total === 0 && (!cartItems || Object.keys(cartItems).length === 0)) {
      navigate("/cart");
    }
  }, [getTotalCartAmount, cartItems, navigate, orderSuccessData]);

  return (
    <>
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

          <div className="phone-input-container">
            <div className="phone-code-box" title="Click to change country calling code">
              <span className="phone-code-display">{countryCode}</span>
              <span className="phone-code-arrow">▾</span>
              <select
                className="phone-code-overlay-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                title="Select Country Calling Code"
              >
                {COUNTRY_PHONE_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="tel"
              name="phone"
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Phone Number"
              required
            />
          </div>
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
          {/* City - Scrollable selection with 100+ cities in India */}
          {isCustomCity ? (
            <div className="custom-input-wrap">
              <input
                type="text"
                name="city"
                value={data.city}
                onChange={onChangeHandler}
                placeholder="Type your City name"
                required
                autoFocus
              />
              <button
                type="button"
                className="switch-select-btn"
                onClick={() => {
                  setIsCustomCity(false);
                  setData((prev) => ({ ...prev, city: "" }));
                }}
                title="Choose from list of cities"
              >
                📋 Choose City
              </button>
            </div>
          ) : (
            <select
              name="city"
              value={data.city}
              onChange={handleCitySelect}
              required
            >
              <option value="">-- Select City in India --</option>
              {INDIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
              <option value="other">✏️ Other City (Type manually)</option>
            </select>
          )}

          {/* State - Scrollable selection with all Indian States & UTs */}
          {isCustomState ? (
            <div className="custom-input-wrap">
              <input
                type="text"
                name="state"
                value={data.state}
                onChange={onChangeHandler}
                placeholder="Type State name"
                required
                autoFocus
              />
              <button
                type="button"
                className="switch-select-btn"
                onClick={() => {
                  setIsCustomState(false);
                  setData((prev) => ({ ...prev, state: "" }));
                }}
                title="Choose from list of states"
              >
                📋 Choose State
              </button>
            </div>
          ) : (
            <select
              name="state"
              value={data.state}
              onChange={handleStateSelect}
              required
            >
              <option value="">-- Select State --</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
              <option value="other">✏️ Other State (Type manually)</option>
            </select>
          )}
        </div>

        <div className="multi-fields">
          <input
            type="text"
            name="zipcode"
            value={data.zipcode}
            onChange={onChangeHandler}
            placeholder="Zipcode / PIN Code"
            required
          />

          {/* Country - Scrollable selection defaulting to India */}
          <select
            name="country"
            value={data.country}
            onChange={handleCountryChange}
            required
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
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

          {/* Error banner without native browser alert */}
          {errorMessage && (
            <div className="place-order-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <p className="error-text">{errorMessage}</p>
              <button
                type="button"
                className="clear-error-btn"
                onClick={() => setErrorMessage("")}
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

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

    {/* BIG CONGO (CONGRATULATIONS) CELEBRATION MODAL */}
    {orderSuccessData && (
      <div className="congo-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="congo-title">
        <div className="congo-modal-card">
          {/* Confetti floating decorations */}
          <div className="congo-confetti-wrap" aria-hidden="true">
            <span className="congo-confetti c1">🎉</span>
            <span className="congo-confetti c2">✨</span>
            <span className="congo-confetti c3">🎊</span>
            <span className="congo-confetti c4">🍕</span>
            <span className="congo-confetti c6">✨</span>
            <span className="congo-confetti c7">🎉</span>
          </div>

          <button
            type="button"
            className="congo-modal-close"
            onClick={() => navigate("/orders")}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Animated checkmark badge */}
          <div className="congo-badge-wrapper">
            <div className="congo-badge-glow"></div>
            <div className="congo-badge-icon">
              <svg viewBox="0 0 52 52" className="congo-svg-check">
                <circle className="congo-svg-circle" cx="26" cy="26" r="23" fill="none" />
                <path className="congo-svg-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
          </div>

          {/* Title & short subtitle */}
          <h2 id="congo-title" className="congo-heading">
            Congratulations! 🎉
          </h2>
          <p className="congo-lead">
            Your order is confirmed & being prepared fresh.
          </p>

          {/* Compact Receipt Box */}
          <div className="congo-order-receipt">
            <div className="congo-receipt-row">
              <span className="order-id-tag">
                Order <strong>#{String(orderSuccessData.orderId || "TOMATO").slice(-8).toUpperCase()}</strong>
              </span>
              <span className="eta-tag">
                ⏱️ 30–40 mins
              </span>
            </div>

            <div className="congo-receipt-row payment-amount-row">
              <div className="payment-mode-pill">
                {orderSuccessData.paymentMethod === "cod" ? (
                  <span>💵 Cash on Delivery</span>
                ) : (
                  <span>💳 Online Paid</span>
                )}
              </div>
              <div className="total-amount-pill">
                Total: <strong>₹{orderSuccessData.amount}</strong>
              </div>
            </div>

            {orderSuccessData.address && (
              <div className="congo-address-row">
                <span className="address-icon">📍</span>
                <span className="address-line">
                  {orderSuccessData.address.firstName} {orderSuccessData.address.lastName} &bull; {[orderSuccessData.address.street, orderSuccessData.address.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {orderSuccessData.items && orderSuccessData.items.length > 0 && (
              <div className="congo-items-row">
                {orderSuccessData.items.map((it, idx) => (
                  <span key={idx} className="item-chip">
                    {it.name} <strong>x{it.quantity || 1}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons (side-by-side row) */}
          <div className="congo-actions">
            <button
              type="button"
              className="congo-primary-btn"
              onClick={() => navigate("/orders")}
            >
              🛵 Track Order
            </button>
            <button
              type="button"
              className="congo-secondary-btn"
              onClick={() => navigate("/")}
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default PlaceOrder;