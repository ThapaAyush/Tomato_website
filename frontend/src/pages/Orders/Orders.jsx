import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Orders.css';

const Orders = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${url}/api/order/my-orders`, {
          headers: { token },
        });

        if (response.data.success) {
          setOrders(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, url, navigate]);

  const formatItemSummary = (items = []) => {
    return items
      .map((item) => `${item.name} x ${item.quantity || 1}`)
      .join(', ');
  };

  return (
    <div className='orders-page'>
      <h1 className='orders-title'>My Orders</h1>

      {loading ? (
        <p className='orders-empty'>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className='orders-empty'>No orders yet.</p>
      ) : (
        <div className='orders-list'>
          {orders.map((order) => (
            <div className='order-card' key={order._id || order.date}>
              <div className='order-icon'>🧾</div>

              <div className='order-main'>
                <p className='order-items'>
                  {formatItemSummary(order.items || [])}
                </p>

                <div className='order-meta'>
                  <span>₹{Number(order.amount || 0)}</span>
                  <span>Items: {order.items?.length || 0}</span>
                  <span className='order-status'>• {order.status || 'Food Processing'}</span>
                </div>
              </div>

              <button type='button' className='track-order-btn'>Track Order</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
