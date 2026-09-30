import './Orders.css'
import axios from 'axios'
import { useEffect, useState } from 'react'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${url}/api/order/list`)
        if (response.data.success) {
          setOrders(response.data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }

    fetchOrders()
  }, [url])

  const formatItemSummary = (items = []) => {
    return items.map((item) => `${item.name} x ${item.quantity || 1}`).join(', ')
  }

  return (
    <div className='admin-orders'>
      <h2>Orders</h2>

      <div className='admin-orders-list'>
        {orders.length === 0 ? (
          <p className='empty-orders'>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div className='admin-order-card' key={order._id || order.date}>
              <div className='admin-order-header'>
                <span>Order #{String(order._id || '').slice(-6)}</span>
                <span className='admin-order-status'>{order.status || 'Food Processing'}</span>
              </div>

              <p className='admin-order-items'>{formatItemSummary(order.items || [])}</p>

              <div className='admin-order-footer'>
                <span>{order.address?.city || 'N/A'}</span>
                <span>₹{Number(order.amount || 0)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Orders