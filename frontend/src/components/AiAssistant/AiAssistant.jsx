import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import './AiAssistant.css';

const AiAssistant = ({ setShowLogin }) => {
    const context = useContext(StoreContext) || {};
    const {
        food_list = [],
        cartItems = {},
        addToCart = () => {},
        removeFromCart = () => {},
        url = 'http://localhost:4000',
        token = ''
    } = context;
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(() => {
        return typeof window !== 'undefined' && window.location.search.includes('assistant=open');
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);
    const handleSendRef = useRef(null);

    // Initial conversation matching user's reference image
    const [messages, setMessages] = useState([
        {
            id: 'init-1',
            sender: 'ai',
            text: 'Hi! I can help you find food or check your latest order.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            foodItems: [],
        }
    ]);

    // Quick suggestion pills matching user's reference image
    const quickPills = [
        "Find vegetarian food",
        "Show food under 500",
        "Track my latest order",
        "Delicious pasta & noodles",
        "Crispy rolls & sandwiches",
        "Sweet desserts & cakes",
        "Healthy fresh salads",
        "Surprise me with chef picks"
    ];

    // Speech recognition setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                if (handleSendRef.current) {
                    handleSendRef.current(transcript);
                }
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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

    // Gentle robot sound chime
    const playChime = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch {
            // Audio context failed or blocked by autoplay policy
        }
    };

    // Toggle speech input
    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch {
                setIsListening(false);
            }
        }
    };

    // Smart AI processing engine
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
                const response = await axios.get(`${url}/api/order/my-orders`, { headers: { token } });
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
                        text: "You don't have any past orders yet. Browse our menu to place your first delicious meal!",
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

        // 2. Budget / price filtering
        const budgetMatch = q.match(/under\s*\$?(\d+)/i) || q.match(/less\s*than\s*\$?(\d+)/i);
        let maxPrice = null;
        if (budgetMatch) {
            maxPrice = parseFloat(budgetMatch[1]);
        } else if (q.includes('cheap') || q.includes('budget') || q.includes('affordable')) {
            maxPrice = 14;
        }

        // Filter out non-veg items for default recommendations
        const isNonVegItem = (item) => {
            const text = `${item.name} ${item.description}`.toLowerCase();
            return text.includes('chicken') || text.includes('meat') || text.includes('fish') || text.includes('prawn');
        };

        const vegFoodList = food_list.filter(item => !isNonVegItem(item));

        // Check if user explicitly asks for non-veg or chicken
        const nonVegKeywords = ['chicken', 'non veg', 'non-veg', 'nonveg', 'meat', 'mutton', 'beef', 'pork', 'fish', 'prawn', 'shrimp', 'seafood', 'egg', 'lamb', 'bacon', 'ham'];
        const isExplicitNonVegQuery = nonVegKeywords.some(keyword => q.includes(keyword));

        if (isExplicitNonVegQuery) {
            // If user specifically asked for chicken:
            if (q.includes('chicken')) {
                const chickenMatches = food_list.filter(item => isNonVegItem(item) && item.name.toLowerCase().includes('chicken'));

                // If user asked for a chicken dish we don't serve (e.g. chicken biryani, chicken pizza, etc.)
                const unhandledChickenDishes = ['biryani', 'pizza', 'burger', 'curry', 'tikka', 'soup', 'rice'];
                if (unhandledChickenDishes.some(d => q.includes(d))) {
                    return {
                        text: `We're so sorry, we don't have "${queryText}" on our menu! 🙏 We currently only offer our signature Chicken Sandwich for non-veg, alongside our gourmet vegetarian pastas, rolls, and salads. Would you like to try one of these favorites instead? 💛`,
                        foodItems: [...chickenMatches, ...vegFoodList.slice(0, 2)]
                    };
                }

                if (chickenMatches.length > 0) {
                    return {
                        text: "Since you asked, we have our signature Chicken Sandwich on our menu! Freshly prepared, seasoned to perfection: 🥪",
                        foodItems: chickenMatches
                    };
                }
            }

            // User asked for non-veg items we do NOT have (mutton, fish, beef, egg, etc.)
            return {
                text: `We're truly sorry, we don't serve "${queryText}" on our menu! 🙏 Almost our entire kitchen is dedicated to fresh, delicious vegetarian cuisine, handmade pastas, wholesome salads, and gourmet desserts. May we recommend these chef-special vegetarian favorites for you instead? 💛`,
                foodItems: vegFoodList.slice(0, 3)
            };
        }

        // 3. Dietary & keyword matching (purely vegetarian by default)
        let matches = [];

        // Vegetarian / Veg / Pure Veg
        if (q.includes('vegetarian') || q.includes('pure veg') || q.includes('veg ') || q === 'veg') {
            matches = vegFoodList.filter(item =>
                item.category === 'Pure Veg' ||
                item.category === 'Salad' ||
                item.name.toLowerCase().includes('veg')
            );
        }
        // Vegan
        else if (q.includes('vegan')) {
            matches = vegFoodList.filter(item =>
                item.name.toLowerCase().includes('vegan') ||
                item.description.toLowerCase().includes('vegan')
            );
        }
        // Sweet / Desserts / Cake / Ice Cream
        else if (q.includes('sweet') || q.includes('dessert') || q.includes('ice cream') || q.includes('cake')) {
            matches = vegFoodList.filter(item =>
                item.category === 'Deserts' || item.category === 'Cake'
            );
        }
        // Pasta
        else if (q.includes('pasta')) {
            matches = vegFoodList.filter(item => item.category === 'Pasta');
        }
        // Noodles
        else if (q.includes('noodle') || q.includes('noodles')) {
            matches = vegFoodList.filter(item => item.category === 'Noodles');
        }
        // Rolls
        else if (q.includes('roll') || q.includes('rolls')) {
            matches = vegFoodList.filter(item => item.category === 'Rolls');
        }
        // Salad / Healthy
        else if (q.includes('salad') || q.includes('healthy') || q.includes('diet')) {
            matches = vegFoodList.filter(item =>
                item.category === 'Salad' || item.name.toLowerCase().includes('salad')
            );
        }
        // Sandwich (vegetarian sandwiches only)
        else if (q.includes('sandwich')) {
            matches = vegFoodList.filter(item => item.category === 'Sandwich');
        }
        // Surprise me / Best / Recommend / Popular (curated vegetarian highlights)
        else if (q.includes('surprise') || q.includes('recommend') || q.includes('best') || q.includes('popular')) {
            matches = [
                vegFoodList.find(i => i.category === 'Pasta'),
                vegFoodList.find(i => i.category === 'Rolls'),
                vegFoodList.find(i => i.category === 'Deserts'),
                vegFoodList.find(i => i.category === 'Pure Veg'),
            ].filter(Boolean);
        }
        // General text search on name, description, and category across vegetarian items
        else {
            const tokens = q.split(/\s+/).filter(t => t.length > 2);
            matches = vegFoodList.filter(item => {
                const name = item.name.toLowerCase();
                const desc = item.description.toLowerCase();
                const cat = item.category.toLowerCase();
                return tokens.some(token => name.includes(token) || desc.includes(token) || cat.includes(token));
            });
        }

        // Apply price constraint if specified
        if (maxPrice !== null) {
            // If user typed 'under 500' in a dollar menu ($10-$24), handle gracefully
            if (maxPrice > 100) {
                maxPrice = 18;
            }
            if (matches.length > 0) {
                const filtered = matches.filter(i => i.price <= maxPrice);
                if (filtered.length > 0) matches = filtered;
            } else {
                matches = vegFoodList.filter(i => i.price <= maxPrice);
            }
        }

        // Format AI conversational response
        if (matches.length > 0) {
            const topDishes = matches.slice(0, 4);
            let intro = `I found ${topDishes.length} mouth-watering options for you! ✨`;
            if (q.includes('veg') || q.includes('vegetarian')) {
                intro = `Here are vibrant vegetarian favorites made with fresh ingredients: 🥗`;
            } else if (q.includes('sweet') || q.includes('dessert') || q.includes('cake')) {
                intro = `Craving something sweet? Here are irresistible treats: 🍰`;
            } else if (maxPrice !== null) {
                intro = `Great vegetarian picks matching your budget (under $${maxPrice}): 💰`;
            }
            return {
                text: intro,
                foodItems: topDishes
            };
        }

        // Very pleasing, polite response when an item is NOT available on the menu:
        return {
            text: `We're so sorry, we don't have "${queryText}" on our menu right now! 🙏 Our chef prepares wonderful freshly-made dishes you'll love. Would you like to try one of these delicious favorites instead? 😊`,
            foodItems: vegFoodList.slice(0, 3)
        };
    };

    const handleSend = async (customText) => {
        const textToSend = (typeof customText === 'string' ? customText : input).trim();
        if (!textToSend) return;

        // Add user message
        const userMsg = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
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
        }, 650);
    };

    useEffect(() => {
        handleSendRef.current = handleSend;
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSend();
    };

    const handlePillClick = (pill) => {
        handleSend(pill);
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


                    {/* Robot 3D Figure */}
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

            {/* Food Assistant Modal Window (Matching Reference Image 2) */}
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
                                className="ai-icon-btn"
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                                aria-label="Toggle sound"
                            >
                                {soundEnabled ? '🔔' : '🔕'}
                            </button>
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

                                    {/* Interactive Food Results Cards */}
                                    {msg.foodItems && msg.foodItems.length > 0 && (
                                        <div className="ai-food-cards-grid">
                                            {msg.foodItems.map((item) => {
                                                const foodImg = item.image.startsWith('/')
                                                    ? item.image
                                                    : `${url}/images/${item.image}`;
                                                const inCart = cartItems[item._id] || 0;

                                                return (
                                                    <div key={item._id} className="ai-food-result-card">
                                                        <div className="ai-card-img-wrap">
                                                            <img src={foodImg} alt={item.name} />
                                                            <span className="ai-category-badge">{item.category}</span>
                                                        </div>
                                                        <div className="ai-card-info">
                                                            <h3 className="ai-card-title">{item.name}</h3>
                                                            <p className="ai-card-desc">{item.description}</p>
                                                            <div className="ai-card-footer">
                                                                <span className="ai-card-price">${item.price}</span>
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

                    {/* Quick Suggestion Pills Bar (Matching Reference Image 2) */}
                    <div className="ai-pills-bar">
                        <div className="ai-pills-scroll">
                            {quickPills.map((pill, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="ai-pill-btn"
                                    onClick={() => handlePillClick(pill)}
                                >
                                    {pill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Form & Action Controls (Matching Reference Image 2) */}
                    <div className="ai-card-footer-controls">
                        <form className="ai-input-form" onSubmit={handleFormSubmit}>
                            <div className="ai-input-box-wrap">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="ai-text-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask for pasta, rolls, salads, cakes under $15..."
                                />
                                {speechSupported && (
                                    <button
                                        type="button"
                                        className={`ai-mic-btn ${isListening ? 'listening' : ''}`}
                                        onClick={toggleListening}
                                        title={isListening ? "Listening... click to stop" : "Voice search"}
                                    >
                                        🎙️
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="ai-send-btn">
                                Send
                            </button>
                        </form>

                        {/* Close Pill at the bottom (Matching Reference Image 2) */}
                        <div className="ai-bottom-close-wrap">
                            <button
                                type="button"
                                className="ai-bottom-close-pill"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default AiAssistant;
