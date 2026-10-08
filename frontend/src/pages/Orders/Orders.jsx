import React, { useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Orders.css';

const Orders = ({ setShowLogin }) => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      if (setShowLogin) setShowLogin(true);
      navigate('/');
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await axios.get(`${url}/api/order/my-orders`, {
        headers: { token: activeToken },
      });

      if (response.data?.success) {
        const activeOrders = (response.data.data || []).filter(
          (order) => order.status !== 'Cancelled'
        );
        setOrders(activeOrders);
      } else {
        console.warn('Orders fetch warning:', response.data?.message);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, url, navigate, setShowLogin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const cancelCustomerOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await axios.post(`${url}/api/order/cancel`, { orderId });
        if (response.data?.success) {
          setOrders((prev) => prev.filter((order) => order._id !== orderId));
          if (activeTrackingId === orderId) {
            setActiveTrackingId(null);
          }
        } else {
          alert(response.data?.message || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Failed to cancel order:', error);
        alert('Failed to cancel order. Please check your connection.');
      }
    }
  };

  const toggleTracking = (orderId) => {
    setActiveTrackingId((prev) => (prev === orderId ? null : orderId));
    fetchOrders(true);
  };

  const formatItemSummary = (items = []) => {
    return items
      .map((item) => `${item.name} x ${item.quantity || 1}`)
      .join(', ');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getStatusStep = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('out for delivery')) return 3;
    if (s.includes('preparing')) return 2;
    if (s.includes('confirmed') || s.includes('food processing')) return 1;
    return 1;
  };

  return (
    <div className='orders-page'>
      <div className='orders-header-row'>
        <div>
          <h1 className='orders-title'>My Orders</h1>
          <p className='orders-subtitle'>View, track, and manage all your live and past food orders</p>
        </div>
        <button
          type='button'
          className='orders-refresh-btn'
          onClick={() => fetchOrders(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Orders'}
        </button>
      </div>

      {loading ? (
        <div className='orders-loading-box'>
          <div className='orders-spinner'></div>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className='orders-empty-card'>
          <div className='orders-empty-icon'>🛍️</div>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet, or all your recent orders have completed.</p>
          <Link to='/' className='orders-explore-btn'>Browse Menu & Order</Link>
        </div>
      ) : (
        <div className='orders-list'>
          {orders.map((order) => {
            const currentStep = getStatusStep(order.status);
            const isTracking = activeTrackingId === order._id;

            return (
              <div className='order-card-wrapper' key={order._id || order.date}>
                <div className='order-card'>
                  <div className='order-icon'>🧾</div>

                  <div className='order-main'>
                    <div className='order-header-info'>
                      <span className='order-id-tag'>#{String(order._id || '').slice(-6).toUpperCase() || 'ORDER'}</span>
                      {order.date && <span className='order-date'>{formatDate(order.date)}</span>}
                    </div>

                    <p className='order-items'>
                      {formatItemSummary(order.items || [])}
                    </p>

                    <div className='order-meta'>
                      <span className='order-amount'>₹{Number(order.amount || 0)}</span>
                      <span className='order-item-count'>{order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}</span>
                      <span className={`order-status-badge status-step-${currentStep}`}>
                        ● {order.status || 'Food Processing'}
                      </span>
                    </div>
                  </div>

                  <div className='order-actions'>
                    <button
                      type='button'
                      className={`track-order-btn ${isTracking ? 'active' : ''}`}
                      onClick={() => toggleTracking(order._id)}
                    >
                      {isTracking ? 'Hide Tracking' : 'Track Order'}
                    </button>
                    <button
                      type='button'
                      className='order-cancel-btn'
                      onClick={() => cancelCustomerOrder(order._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {isTracking && (
                  <div className='order-tracking-panel'>
                    <div className='tracking-header'>
                      <h4>Live Order Tracking</h4>
                      <span className='tracking-current-status'>Status: <b>{order.status || 'Food Processing'}</b></span>
                    </div>

                    <div className='tracking-stepper'>
                      <div className={`step-item ${currentStep >= 1 ? 'completed' : ''}`}>
                        <div className='step-dot'>{currentStep >= 1 ? '✓' : '1'}</div>
                        <p className='step-label'>Order Placed</p>
                      </div>
                      <div className={`step-line ${currentStep >= 2 ? 'filled' : ''}`}></div>

                      <div className={`step-item ${currentStep >= 2 ? 'completed' : ''}`}>
                        <div className='step-dot'>{currentStep >= 2 ? '✓' : '2'}</div>
                        <p className='step-label'>Kitchen Preparing</p>
                      </div>
                      <div className={`step-line ${currentStep >= 3 ? 'filled' : ''}`}></div>

                      <div className={`step-item ${currentStep >= 3 ? 'completed' : ''}`}>
                        <div className='step-dot'>{currentStep >= 3 ? '✓' : '3'}</div>
                        <p className='step-label'>Out for Delivery</p>
                      </div>
                      <div className={`step-line ${currentStep >= 4 ? 'filled' : ''}`}></div>

                      <div className={`step-item ${currentStep >= 4 ? 'completed' : ''}`}>
                        <div className='step-dot'>{currentStep >= 4 ? '✓' : '4'}</div>
                        <p className='step-label'>Delivered</p>
                      </div>
                    </div>

                    {order.address && (
                      <div className='tracking-delivery-address'>
                        <span className='address-label'>Delivering to:</span>
                        <span>
                          {[order.address.street, order.address.city, order.address.state, order.address.zipcode]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
