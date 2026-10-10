import React, { useContext } from 'react'
import './Fooditem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext';


const FoodItem = ({ id, name, price, description, image }) => {

    const { cartItems, addToCart, removeFromCart, url, token, openSignUpModal } = useContext(StoreContext);
    const imageUrl = image.startsWith("/") ? image : `${url}/images/${image}`;

    const handleAdd = () => {
        if (!token) {
            if (openSignUpModal) {
                openSignUpModal("Please sign up to add items to your cart");
            }
            return;
        }
        addToCart(id);
    };

    return (
        <div className='food-item' id={`food-item-${id}`}>
            <div className="food-item-img-container">
                <img className='food-item-image' src={imageUrl} alt={name} />
                {!token || !cartItems[id]
                    ? <img
                        className='add'
                        onClick={handleAdd}
                        src={assets.add_icon_white}
                        alt="Add food item"
                        title={token ? "Add to cart" : "Sign up to add food"}
                      />
                    : <div className='food-item-counter'>
                        <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="Remove" />
                        <p>{cartItems[id]}</p>
                        <img onClick={handleAdd} src={assets.add_icon_green} alt="Add more" />
                    </div>
                }
            </div>
            <div className='food-item-name-rating'>
                <p>{name}</p>
                <img src={assets.rating_starts} alt="" />
            </div>
            <p className="food-item-desc">{description}</p>
            <p className="food-item-price">{price}</p>

        </div>
    )
}

export default FoodItem
