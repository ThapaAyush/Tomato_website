import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { food_list as sampleFoodList } from "../assets/assets";


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
    const url = "http://localhost:4000";
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState(sampleFoodList)

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
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                const savedToken = localStorage.getItem("token");
                setToken(savedToken);
                await loadCartData(savedToken)
            }
        }
        localData();
    }, [])

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }, [cartItems])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}

        </StoreContext.Provider>
    )
}
export default StoreContextProvider