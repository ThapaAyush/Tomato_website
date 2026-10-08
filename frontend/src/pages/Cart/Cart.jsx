import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom';

const cart = () => {

  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url  } = useContext(StoreContext);
  const navigate = useNavigate();
  const totalAmount = getTotalCartAmount();
  const isCartEmpty = totalAmount === 0;

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            const imageUrl = item.image.startsWith("/")
              ? item.image
              : `${url}/images/${item.image}`;

            return (

              <div
                key={item._id}
                className='cart-items-title cart-items-item'
              >
                <img src={imageUrl} alt={item.name} />
                <p>{item.name}</p>
                <p><span className='cart-mobile-label'>Price: </span>₹{item.price}</p>
                <p><span className='cart-mobile-label'>Quantity: </span>{cartItems[item._id]}</p>
                <p><span className='cart-mobile-label'>Total: </span>₹{item.price * cartItems[item._id]}</p>
                <p onClick={() => removeFromCart(item._id)}>x</p>
              </div>
            )
          }
        })}
      </div>
      <div className="cart-buttom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className='cart-total-details'>
              <p>Subtotal</p>
              <p>₹{totalAmount}</p>
            </div>
            <div className='cart-total-details'>
              <p>Delivery Fee</p>
              <p>₹{isCartEmpty ? 0 : 2}</p>
            </div>
            <div className='cart-total-details'>
              <b>Total</b>
              <b>₹{isCartEmpty ? 0 : totalAmount + 2}</b>
            </div>

          </div>
          <button
            onClick={() => !isCartEmpty && navigate('/order')}
            disabled={isCartEmpty}
            style={{ opacity: isCartEmpty ? 0.5 : 1, cursor: isCartEmpty ? 'not-allowed' : 'pointer' }}
          >
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className='cart-promocode-input'>
              <input type='text' placeholder='promo code' />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default cart
