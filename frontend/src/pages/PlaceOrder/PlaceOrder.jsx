import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
  } = useContext(StoreContext);

  const navigate = useNavigate();

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
    const name = event.target.name;
    const value = event.target.value;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // If Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        resolve(true);
      };

      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  // Place order
  const placeOrder = async (event) => {
    event.preventDefault();

    console.log("Proceed to payment clicked");

    const totalAmount = getTotalCartAmount();

    if (!token) {
      alert("Please login first to continue with checkout");
      return;
    }

    // Check cart
    if (totalAmount === 0) {
      alert("Your cart is empty");
      return;
    }

    // Create order items
    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        ...item,
        quantity: cartItems[item._id],
      }));

    console.log("Order items:", orderItems);
    console.log("Cart total:", totalAmount);
    console.log("Token:", token);

    if (orderItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      // ============================================
      // STEP 1: CREATE ORDER ON BACKEND
      // ============================================

      const response = await axios.post(
        `${url}/api/order/place`,
        {
          address: data,
          items: orderItems,
          amount: totalAmount + 2,
        },
        {
          headers: {
            token: token,
          },
        }
      );

      console.log("Backend response:", response.data);

      // Check backend response
      if (!response.data.success) {
        alert(
          response.data.message || "Unable to create order"
        );
        return;
      }

      // ============================================
      // STEP 2: LOAD RAZORPAY
      // ============================================

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        alert(
          "Razorpay checkout failed to load. Please check your internet connection."
        );
        return;
      }

      console.log("Razorpay loaded:", window.Razorpay);

      // ============================================
      // STEP 3: GET RAZORPAY ORDER DETAILS
      // ============================================

      const { key, order } = response.data;

      console.log("Razorpay key:", key);
      console.log("Razorpay order:", order);

      if (!key) {
        alert("Razorpay key is missing from server response");
        console.error("Missing Razorpay key:", response.data);
        return;
      }

      if (!order) {
        alert("Razorpay order is missing from server response");
        console.error("Missing Razorpay order:", response.data);
        return;
      }

      if (!order.id) {
        alert("Razorpay order ID is missing");
        console.error("Missing order ID:", order);
        return;
      }

      // ============================================
      // STEP 4: RAZORPAY OPTIONS
      // ============================================

      const options = {
        key: key,

        amount: order.amount,

        currency: order.currency || "INR",

        name: "Tomato.",

        description: "Food order payment",

        order_id: order.id,

        // Payment successful
        handler: function (paymentResponse) {
          console.log(
            "Payment successful:",
            paymentResponse
          );

          alert("Payment successful!");

          window.location.href = "/orders";
        },

        // Customer information
        prefill: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          contact: data.phone,
        },

        // Razorpay theme
        theme: {
          color: "#ff4d4d",
        },

        // When payment popup is closed
        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay payment window was closed"
            );
          },
        },
      };

      // ============================================
      // STEP 5: CREATE RAZORPAY INSTANCE
      // ============================================

      console.log("Creating Razorpay instance...");

      const razorpay = new window.Razorpay(options);

      // Payment failed event
      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response.error
          );

          alert(
            response.error.description ||
              "Payment failed. Please try again."
          );
        }
      );

      // ============================================
      // STEP 6: OPEN RAZORPAY
      // ============================================

      console.log("Opening Razorpay checkout...");

      razorpay.open();
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      // Backend error
      if (error.response) {
        console.error(
          "Backend response:",
          error.response.data
        );

        alert(
          error.response.data.message ||
            "Server error while placing order"
        );
      }

      // Request sent but no response
      else if (error.request) {
        console.error(
          "No response received:",
          error.request
        );

        alert(
          "Cannot connect to server. Please make sure your backend is running."
        );
      }

      // Other error
      else {
        alert(
          "Unable to place order. Please try again."
        );
      }
    }
  };

  // ============================================
  // CHECK LOGIN AND CART
  // ============================================

  useEffect(() => {
    if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [
    getTotalCartAmount,
    navigate,
  ]);

  // ============================================
  // JSX
  // ============================================

  return (
    <form
      className="place-order"
      onSubmit={placeOrder}
    >
      {/* =========================================
          LEFT SIDE - DELIVERY DETAILS
      ========================================== */}

      <div className="place-order-left">
        <h2 className="title">
          Delivery Details
        </h2>

        {/* First Name + Last Name */}
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

        {/* Email + Phone */}
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

        {/* Street */}
        <input
          type="text"
          name="street"
          value={data.street}
          onChange={onChangeHandler}
          placeholder="Street Address"
          required
        />

        {/* City + State */}
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

        {/* Zipcode + Country */}
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

      {/* =========================================
          RIGHT SIDE - CART TOTAL
      ========================================== */}

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div>
            {/* Subtotal */}
            <div className="cart-total-details">
              <p>Subtotal</p>

              <p>
                ₹{getTotalCartAmount()}
              </p>
            </div>

            {/* Delivery Fee */}
            <div className="cart-total-details">
              <p>Delivery Fee</p>

              <p>
                ₹{getTotalCartAmount() === 0 ? 0 : 2}
              </p>
            </div>

            <hr />

            {/* Total */}
            <div className="cart-total-details">
              <b>Total</b>

              <b>
                ₹
                {getTotalCartAmount() === 0
                  ? 0
                  : getTotalCartAmount() + 2}
              </b>
            </div>
          </div>

          {/* Payment button */}
          <button type="submit">
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;