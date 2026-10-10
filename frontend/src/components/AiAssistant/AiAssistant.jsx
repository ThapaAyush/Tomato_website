import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { assets, menu_list } from '../../assets/assets';
import './AiAssistant.css';

const AiAssistant = ({ setShowLogin }) => {
    const context = useContext(StoreContext) || {};
    const {
        food_list = [],
        fetchFoodList,
        cartItems = {},
        addToCart = () => {},
        removeFromCart = () => {},
        url = (import.meta.env.VITE_BACKEND_URL || 'https://food-backend-1-bnbm.onrender.com').replace(/\/+$/, ''),
        token = ''
    } = context;
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(() => {
        return typeof window !== 'undefined' && window.location.search.includes('assistant=open');
    });
    const [isTyping, setIsTyping] = useState(false);
    const [soundEnabled] = useState(true);

    const messagesEndRef = useRef(null);
    const handleSendRef = useRef(null);

    // Initial greeting guiding user to the category options
    const [messages, setMessages] = useState([
        {
            id: 'init-1',
            sender: 'ai',
            text: 'Hi! Pick a category below to explore fresh dishes from our kitchen.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            foodItems: [],
        }
    ]);

    // Fetch fresh food list strictly from backend API
    const getBackendFoodList = async () => {
        try {
            const response = await axios.get(`${url}/api/food/list`);
            const items = response.data?.data;
            if (Array.isArray(items) && items.length > 0) {
                return items;
            }
        } catch (err) {
            console.error("Unable to load foods from backend API:", err);
        }
        return Array.isArray(food_list) ? food_list : [];
    };

    // When assistant opens, refresh the backend food list
    useEffect(() => {
        if (isOpen && fetchFoodList) {
            fetchFoodList();
        }
    }, [isOpen, fetchFoodList]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // Handle initial search query parameter if present
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const initialQuery = params.get('q');
        if (initialQuery) {
            const timer = setTimeout(() => {
                if (handleSendRef.current) {
                    handleSendRef.current(initialQuery);
                }
            }, 700);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpen = () => {
        setIsOpen(true);
    };

    // Gentle chime
    const playChime = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch {
            // Audio policy blocked
        }
    };

    // Smart AI processing engine - fetches and searches ONLY backend data
    const processAiQuery = async (queryText) => {
        const q = queryText.toLowerCase().trim();

        // 1. Order tracking query
        const orderKeywords = ['track', 'order', 'status', 'delivery', 'where is my food', 'my order'];
        if (orderKeywords.some(keyword => q.includes(keyword))) {
            if (!token) {
                return {
                    text: "To track your latest order, please log in first! Click below to sign in or view your profile.",
                    showLoginBtn: true,
                    foodItems: []
                };
            }

            try {
                const userEmail = localStorage.getItem('userEmail') || '';
                const response = await axios.get(`${url}/api/order/my-orders`, {
                    headers: { token },
                    params: userEmail ? { email: userEmail } : {},
                });
                const userOrders = response.data?.data || [];
                if (userOrders.length > 0) {
                    const latest = userOrders[0];
                    const summary = latest.items?.map(it => `${it.name} (x${it.quantity || 1})`).join(', ') || 'Delicious food';
                    return {
                        text: `Here is your latest order details:\n📦 Status: ${latest.status || 'Food Processing'}\n🍲 Items: ${summary}\n💰 Total: ₹${latest.amount || 0}`,
                        orderData: latest,
                        foodItems: []
                    };
                } else {
                    return {
                        text: "You don't have any past orders yet. Select a category below to explore our fresh menu!",
                        foodItems: []
                    };
                }
            } catch {
                return {
                    text: "You can view and track all your orders directly on your Orders page.",
                    orderData: { linkOnly: true },
                    foodItems: []
                };
            }
        }

        // Fetch fresh food items strictly from backend API
        const backendFoods = await getBackendFoodList();

        // 2. Check if the user selected/queried a category from ExploreMenu (Image 2)
        const matchedCategory = menu_list.find(cat => {
            const catName = cat.menu_name.toLowerCase();
            return q === catName || q === `show ${catName}` || q === `show me ${catName}` || q.includes(catName);
        });

        if (matchedCategory) {
            const catName = matchedCategory.menu_name;
            const categoryDishes = backendFoods.filter(
                item => item.category?.toLowerCase() === catName.toLowerCase()
            );

            if (categoryDishes.length > 0) {
                return {
                    text: `Here are our freshly prepared ${catName} dishes from our kitchen: 🍽️`,
                    foodItems: categoryDishes
                };
            } else {
                return {
                    text: `Currently no dishes found under ${catName} in the kitchen. Here are other fresh dishes for you:`,
                    foodItems: backendFoods.slice(0, 4)
                };
            }
        }

        // 3. Price / Budget filter
        const budgetMatch = q.match(/under\s*\$?(\d+)/i) || q.match(/less\s*than\s*\$?(\d+)/i);
        let maxPrice = null;
        if (budgetMatch) {
            maxPrice = parseFloat(budgetMatch[1]);
        }

        // 4. Keyword / name / description matching across backend food data
        let matches = backendFoods.filter(item => {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            return name.includes(q) || desc.includes(q) || cat.includes(q);
        });

        if (matches.length === 0) {
            const tokens = q.split(/\s+/).filter(t => t.length > 2);
            matches = backendFoods.filter(item => {
                const name = (item.name || '').toLowerCase();
                const desc = (item.description || '').toLowerCase();
                const cat = (item.category || '').toLowerCase();
                return tokens.some(token => name.includes(token) || desc.includes(token) || cat.includes(token));
            });
        }

        if (maxPrice !== null) {
            const priceFiltered = (matches.length > 0 ? matches : backendFoods).filter(i => i.price <= maxPrice);
            if (priceFiltered.length > 0) matches = priceFiltered;
        }

        if (matches.length > 0) {
            return {
                text: `I found ${matches.length} matching options for you on our menu! ✨`,
                foodItems: matches.slice(0, 6)
            };
        }

        // Polite fallback with backend recommendations
        return {
            text: `We don't have "${queryText}" on our menu right now! 🙏 Here are some favorites freshly made in our kitchen:`,
            foodItems: backendFoods.slice(0, 4)
        };
    };

    const handleSend = async (customText) => {
        const textToSend = (customText || '').trim();
        if (!textToSend) return;

        // Add user message
        const userMsg = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate intelligent AI thinking delay
        setTimeout(async () => {
            const aiResult = await processAiQuery(textToSend);
            setIsTyping(false);

            const aiMsg = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: aiResult.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                foodItems: aiResult.foodItems || [],
                orderData: aiResult.orderData,
                showLoginBtn: aiResult.showLoginBtn
            };

            setMessages(prev => [...prev, aiMsg]);
            playChime();
        }, 500);
    };

    useEffect(() => {
        handleSendRef.current = handleSend;
    });

    const handleCategoryClick = (categoryName) => {
        handleSend(categoryName);
    };

    return (
        <aside className="ai-assistant-wrapper" aria-label="AI Food Assistant">
            {/* Floating Robot Mascot Launcher Button */}
            {!isOpen && (
                <div
                    className="ai-mascot-launcher"
                    onClick={handleOpen}
                    title="Open AI Food Assistant"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
                >
                    <div className="ai-robot-figure-wrap">
                        <img
                            src={assets.robot || "/robot.png"}
                            alt="AI Food Assistant Robot Mascot"
                            className="ai-robot-mascot-img"
                        />
                        <div className="ai-robot-shadow"></div>
                    </div>
                </div>
            )}

            {/* Food Assistant Modal Window */}
            {isOpen && (
                <div className="ai-assistant-card" role="dialog" aria-modal="true" aria-label="Food assistant">
                    {/* Header */}
                    <div className="ai-card-header">
                        <div className="ai-header-left">
                            <div className="ai-header-avatar">
                                <img src={assets.robot || "/robot.png"} alt="Food Assistant" />
                                <span className="ai-online-indicator" title="Online"></span>
                            </div>
                            <div className="ai-header-titles">
                                <h2 className="ai-header-name">Food assistant</h2>
                                <p className="ai-header-subtitle">Here to help you choose</p>
                            </div>
                        </div>

                        <div className="ai-header-actions">
                            <button
                                type="button"
                                className="ai-close-btn"
                                onClick={() => setIsOpen(false)}
                                title="Close Food Assistant"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="ai-messages-body">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
                            >
                                {msg.sender === 'ai' && (
                                    <div className="ai-bubble-avatar">
                                        <img src={assets.robot || "/robot.png"} alt="Robo" />
                                    </div>
                                )}

                                <div className="ai-bubble-content">
                                    <div className={`ai-chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                                        <p className="ai-bubble-text">{msg.text}</p>
                                        <span className="ai-bubble-timestamp">{msg.time}</span>
                                    </div>

                                    {/* Action button if login needed */}
                                    {msg.showLoginBtn && setShowLogin && (
                                        <div className="ai-special-action">
                                            <button
                                                type="button"
                                                className="ai-action-primary-btn"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    setShowLogin(true);
                                                }}
                                            >
                                                Sign In to View Orders
                                            </button>
                                        </div>
                                    )}

                                    {/* Order Tracking Card */}
                                    {msg.orderData && (
                                        <div className="ai-order-summary-card">
                                            <div className="ai-order-card-header">
                                                <span>📦 Order #{String(msg.orderData._id || 'Latest').slice(-6)}</span>
                                                <span className="ai-status-tag">{msg.orderData.status || 'Food Processing'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="ai-view-orders-btn"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    navigate('/orders');
                                                }}
                                            >
                                                Go to Orders Page →
                                            </button>
                                        </div>
                                    )}

                                    {/* Interactive Food Results Cards from Backend Data Only */}
                                    {msg.foodItems && msg.foodItems.length > 0 && (
                                        <div className="ai-food-cards-grid">
                                            {msg.foodItems.map((item) => {
                                                const foodImg = !item.image
                                                    ? assets.parcel_icon
                                                    : item.image.startsWith('http://') || item.image.startsWith('https://') || item.image.startsWith('blob:')
                                                        ? item.image
                                                        : item.image.startsWith('/')
                                                            ? `${url}${item.image}`
                                                            : `${url}/images/${item.image}`;
                                                const inCart = cartItems[item._id] || 0;

                                                return (
                                                    <div key={item._id} className="ai-food-result-card">
                                                        <div className="ai-card-img-wrap">
                                                            <img 
                                                                src={foodImg} 
                                                                alt={item.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = assets.parcel_icon;
                                                                }}
                                                            />
                                                            <span className="ai-category-badge">{item.category}</span>
                                                        </div>
                                                        <div className="ai-card-info">
                                                            <h3 className="ai-card-title">{item.name}</h3>
                                                            <p className="ai-card-desc">{item.description}</p>
                                                            <div className="ai-card-footer">
                                                                <span className="ai-card-price">₹{item.price}</span>
                                                                <div className="ai-card-actions">
                                                                    {inCart === 0 ? (
                                                                        <button
                                                                            type="button"
                                                                            className="ai-add-cart-btn"
                                                                            onClick={() => addToCart(item._id)}
                                                                        >
                                                                            + Add
                                                                        </button>
                                                                    ) : (
                                                                        <div className="ai-food-counter">
                                                                            <img
                                                                                src={assets.remove_icon_red}
                                                                                alt="Remove"
                                                                                onClick={() => removeFromCart(item._id)}
                                                                            />
                                                                            <p>{inCart}</p>
                                                                            <img
                                                                                src={assets.add_icon_green}
                                                                                alt="Add"
                                                                                onClick={() => addToCart(item._id)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Animated AI Thinking / Typing Bubble */}
                        {isTyping && (
                            <div className="ai-message-row assistant-row">
                                <div className="ai-bubble-avatar">
                                    <img src={assets.robot || "/robot.png"} alt="Robo" />
                                </div>
                                <div className="ai-typing-indicator">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Category Option Suggestions Bar (Matching Reference Image 2) */}
                    <div className="ai-category-suggestions-bar">
                        <div className="ai-categories-scroll">
                            {menu_list.map((cat, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="ai-category-chip-btn"
                                    onClick={() => handleCategoryClick(cat.menu_name)}
                                    title={`Explore ${cat.menu_name}`}
                                >
                                    <div className="ai-category-avatar-wrap">
                                        <img src={cat.menu_image} alt={cat.menu_name} className="ai-category-img" />
                                    </div>
                                    <span className="ai-category-name">{cat.menu_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default AiAssistant;
