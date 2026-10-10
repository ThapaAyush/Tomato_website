import React, { useEffect, useState } from 'react'
import './Orders.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${url}/api/order/list`)
      if (response.data.success) {
        const activeOrders = (response.data.data || []).filter((o) => o.status !== 'Cancelled')
        setOrders(activeOrders)
      } else {
        toast.error('Error fetching orders')
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value
    if (newStatus === 'Cancelled') {
      const confirmCancel = window.confirm('Are you sure you want to cancel and remove this order?')
      if (!confirmCancel) {
        return
      }
    }
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: newStatus
      })
      if (response.data.success) {
        if (newStatus === 'Cancelled') {
          toast.success('Order cancelled and removed')
          setOrders((prev) => prev.filter((o) => o._id !== orderId))
        } else {
          toast.success(`Order status updated to "${newStatus}"`)
          await fetchAllOrders()
        }
      } else {
        toast.error('Error updating status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Error updating status')
    }
  }

  const cancelOrderHandler = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel and remove this order?')) {
      try {
        const response = await axios.post(`${url}/api/order/cancel`, { orderId })
        if (response.data.success) {
          toast.success('Order cancelled and removed')
          setOrders((prev) => prev.filter((o) => o._id !== orderId))
        } else {
          toast.error('Error cancelling order')
        }
      } catch (error) {
        console.error('Failed to cancel order:', error)
        toast.error('Error cancelling order')
      }
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [url])

  // Format date to DD/M/YYYY (e.g., 22/9/2026)
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  // Format time to 12-hour format (e.g., 10:16 AM)
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className='order add'>
      <h3>Order Page</h3>

      <div className='order-list-scroll-container'>
        <div className='order-list'>
          {loading ? (
            <p className='order-loading'>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className='order-empty'>No orders found.</p>
          ) : (
            orders.map((order) => {
              const address = order.address || {}
              const fullName = [address.firstName, address.lastName]
                .filter(Boolean)
                .join(' ') || 'Customer'

              const addressLine1 = address.street ? `${address.street},` : ''
              const cityPart = [address.city, address.state, address.country]
                .filter(Boolean)
                .join(', ')
              const addressLine2 = cityPart ? `${cityPart},` : ''

              return (
                <div key={order._id} className='order-item'>
                  <img src={assets.parcel_icon} alt='Parcel' className='order-parcel-icon' />

                  <div className='order-item-details'>
                    <p className='order-item-food'>
                      {order.items?.map((item, index) => {
                        const isLast = index === order.items.length - 1
                        return `${item.name} x ${item.quantity || 1}${isLast ? '' : ', '}`
                      })}
                    </p>

                    <p className='order-item-name'>{fullName}</p>

                    <div className='order-item-address'>
                      {addressLine1 && <p>{addressLine1}</p>}
                      {addressLine2 && <p>{addressLine2}</p>}
                    </div>

                    {address.phone && (
                      <p className='order-item-phone'>{address.phone}</p>
                    )}
                  </div>

                  <p className='order-item-count'>Items: {order.items?.length || 0}</p>

                  <div className='order-item-price-date'>
                    <p className='order-item-price'>
                      ₹{Number(order.amount || 0).toFixed(2)}
                    </p>
                    <div className='order-item-timestamp'>
                      <span className='order-item-date'>{formatDate(order.date)}</span>
                      {order.date && <span className='order-item-time'>{formatTime(order.date)}</span>}
                    </div>
                    <div className={`order-status-pill status-${(order.status || 'Food Processing').toLowerCase().replace(/\s+/g, '-')}`}>
                      <span className='status-dot'>●</span>
                      <span className='status-text'>{order.status || 'Food Processing'}</span>
                    </div>
                  </div>

                  <div className='order-status-select-wrap'>
                    <select
                      className={`order-status-select ${order.status === 'Cancelled' ? 'status-cancelled' : ''}`}
                      onChange={(event) => statusHandler(event, order._id)}
                      value={order.status || 'Food Processing'}
                    >
                      <option value='Food Processing'>Food Processing</option>
                      <option value='confirmed'>confirmed</option>
                      <option value='preparing'>preparing</option>
                      <option value='out for delivery'>out for delivery</option>
                      <option value='delivered'>delivered</option>
                      <option value='Cancelled'>Cancelled</option>
                    </select>

                    {order.status !== 'Cancelled' ? (
                      <button
                        type='button'
                        className='order-cancel-btn'
                        onClick={() => cancelOrderHandler(order._id)}
                      >
                        Cancel this order
                      </button>
                    ) : (
                      <span className='order-cancelled-tag'>Order Cancelled</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders