import React, { useContext, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom';

const Cart = () => {

  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    promoCode,
    applyPromoCode,
    removePromoCode,
    getDiscountAmount,
    url
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState('');
  const [promoMsg, setPromoMsg] = useState({ text: '', type: '' });

  const totalAmount = getTotalCartAmount();
  const isCartEmpty = totalAmount === 0;
  const discount = getDiscountAmount();
  const finalTotal = isCartEmpty ? 0 : Math.max(0, totalAmount - discount) + 2;

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    if (isCartEmpty) {
      setPromoMsg({ text: 'Please add items to your cart before applying a promo code.', type: 'error' });
      return;
    }
    if (!inputCode.trim()) {
      setPromoMsg({ text: 'Please enter a promo code.', type: 'error' });
      return;
    }
    const res = applyPromoCode(inputCode);
    if (res.success) {
      setInputCode('');
      setPromoMsg({ text: res.message, type: 'success' });
    } else {
      setPromoMsg({ text: res.message, type: 'error' });
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setInputCode('');
    setPromoMsg({ text: 'Promo code removed.', type: 'info' });
  };

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
        {food_list.map((item) => {
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
          return null;
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

            {discount > 0 && (
              <div className='cart-total-details cart-discount-row'>
                <p className='cart-discount-label'>
                  <span>🎁 Promo Discount ({promoCode})</span>
                  <span className='discount-badge'>50% OFF</span>
                </p>
                <b className='cart-discount-amount'>-₹{discount}</b>
              </div>
            )}

            <div className='cart-total-details'>
              <p>Delivery Fee</p>
              <p>₹{isCartEmpty ? 0 : 2}</p>
            </div>

            <hr />

            <div className='cart-total-details'>
              <b>Total</b>
              <b>₹{finalTotal}</b>
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

            {promoCode ? (
              <div className='cart-promocode-applied'>
                <div className='applied-badge-card'>
                  <span className='applied-badge-icon'>🎉</span>
                  <div className='applied-badge-text'>
                    <b>{promoCode} applied!</b>
                    <span>50% has been reduced from your total</span>
                  </div>
                </div>
                <button
                  type='button'
                  className='remove-promo-btn'
                  onClick={handleRemovePromo}
                >
                  Remove
                </button>
              </div>
            ) : (
              <form className='cart-promocode-input' onSubmit={handlePromoSubmit}>
                <input
                  type='text'
                  placeholder='promo code'
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                />
                <button type='submit'>Submit</button>
              </form>
            )}

            {promoMsg.text && (
              <div className={`promo-message ${promoMsg.type}`}>
                {promoMsg.type === 'success' && '✅ '}
                {promoMsg.type === 'error' && '❌ '}
                {promoMsg.type === 'info' && 'ℹ️ '}
                {promoMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
