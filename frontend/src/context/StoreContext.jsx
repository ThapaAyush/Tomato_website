import axios from "axios";
import { createContext, useEffect, useState } from "react";
export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {
    const storageKey = "food-del-cart";

    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem(storageKey);
        if (!savedCart) return {};

        try {
            return JSON.parse(savedCart);
        } catch (error) {
            console.error("Failed to parse saved cart:", error);
            return {};
        }
    });
    const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const [token, setToken] = useState(() => localStorage.getItem("token") || "");
    const [food_list, setFoodList] = useState([]);

    const [role, setRole] = useState(() => localStorage.getItem("role") || "Customer");
    const [promoCode, setPromoCode] = useState(() => localStorage.getItem("food-del-promo") || "");

    const applyPromoCode = (inputCode) => {
        const clean = (inputCode || "").trim().toUpperCase();
        if (clean === "OFF50%" || clean === "OFF50") {
            setPromoCode("OFF50%");
            localStorage.setItem("food-del-promo", "OFF50%");
            return { success: true, message: "Promo code OFF50% applied! 50% discount has been reduced from your order." };
        } else {
            return { success: false, message: 'Invalid promo code! Only "OFF50%" is valid for 50% discount.' };
        }
    };

    const removePromoCode = () => {
        setPromoCode("");
        localStorage.removeItem("food-del-promo");
    };

    const getDiscountAmount = () => {
        const total = getTotalCartAmount();
        if ((promoCode === "OFF50%" || promoCode === "OFF50") && total > 0) {
            return Math.round(total * 0.5);
        }
        return 0;
    };

    const getFinalOrderAmount = () => {
        const total = getTotalCartAmount();
        if (total === 0) return 0;
        const discount = getDiscountAmount();
        return Math.max(0, total - discount) + 2;
    };

    const clearCart = () => {
        setCartItems({});
        localStorage.removeItem(storageKey);
        removePromoCode();
    };

    const addToCart = async (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1,
        }))
        if (token) {
            await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
        }
    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => {
            const updatedCart = { ...prev };
            const nextQty = (updatedCart[itemId] || 0) - 1;

            if (nextQty <= 0) {
                delete updatedCart[itemId];
            } else {
                updatedCart[itemId] = nextQty;
            }

            return updatedCart;
        })
        if (token) {
            await axios.post(url+"/api/cart/remove",{itemId},{headers:{token}})
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    }

    const getUniqueItemCount = () => {
        let count = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                count++;
            }
        }
        return count;
    }

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            const foods = response.data?.data;
            if (Array.isArray(foods) && foods.length > 0) {
                setFoodList(foods)
            }
        } catch (error) {
            console.error("Unable to load food list:", error)
        }
    }

    const loadCartData = async (currentToken) => {
        try {
            const response = await axios.post(url+"/api/cart/get",{}, {headers:{token: currentToken}})
            const serverCart = response.data?.cartData || response.data?.CartData || {};

            if (Object.keys(serverCart).length > 0) {
                setCartItems(serverCart);
                return;
            }

            const savedCart = JSON.parse(localStorage.getItem(storageKey) || "{}");
            if (Object.keys(savedCart).length > 0) {
                setCartItems(savedCart);
            }
        } catch (error) {
            console.error("Unable to load saved cart:", error)
        }
    }

    useEffect(() => {
        async function localData() {
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                setToken(savedToken);
                await loadCartData(savedToken);
            }
            if (localStorage.getItem("role")) {
                setRole(localStorage.getItem("role"));
            }
            await fetchFoodList();
        }
        localData();
    }, [])

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }, [cartItems])

    const contextValue = {
        food_list,
        fetchFoodList,
        cartItems,
        setCartItems,
        clearCart,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getUniqueItemCount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        getDiscountAmount,
        getFinalOrderAmount,
        url,
        token,
        setToken,
        role,
        setRole,
    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}

        </StoreContext.Provider>
    )
}
export default StoreContextProvider