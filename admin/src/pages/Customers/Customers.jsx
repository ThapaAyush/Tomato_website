import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import './Customers.css'

const Customers = ({ url }) => {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [usersRes, ordersRes] = await Promise.allSettled([
          axios.get(`${url}/api/user/list`),
          axios.get(`${url}/api/order/list`)
        ])

        if (usersRes.status === 'fulfilled' && usersRes.value?.data?.success) {
          setUsers(usersRes.value.data.data || [])
        } else {
          setUsers([])
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.success) {
          setOrders(ordersRes.value.data.data || [])
        } else {
          setOrders([])
        }
      } catch (error) {
        console.error('Failed to fetch customers/orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  // Helper to format item summary like "Chicken Rolls x 1, Veg Rolls x 1, Vanilla Ice Cream x 1"
  const formatItemSummary = (items = []) => {
    if (!items || items.length === 0) return 'Custom Order'
    return items
      .map((item) => `${item.name} x ${item.quantity || 1}`)
      .join(', ')
  }

  // Format date to "D/M/YYYY" or "DD/MM/YYYY" as shown in screenshot (e.g., "18/9/2026")
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Recent'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Recent'
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  // Map orders to customers (strictly for delivered orders from the database)
  const customersWithOrders = useMemo(() => {
    const customerMap = new Map()

    // 1. Populate from users returned by backend listUsers (delivered orders from DB)
    if (Array.isArray(users)) {
      users.forEach((u) => {
        const emailKey = (u.email || '').toLowerCase().trim()
        if (!emailKey) return

        customerMap.set(emailKey, {
          id: u._id,
          name: u.name || 'Customer',
          email: u.email,
          phone: u.phone || u.address?.phone || '',
          allOrders: Array.isArray(u.orders) ? [...u.orders] : []
        })
      })
    }

    // 2. Cross-reference with all orders from database to ensure all delivered orders are counted
    if (Array.isArray(orders)) {
      orders.forEach((order) => {
        const status = (order.status || '').toLowerCase().trim()
        if (status !== 'delivered') return // Only delivered orders qualify as completed customer purchases

        const orderEmail = (order.address?.email || '').toLowerCase().trim()
        const fullName = [order.address?.firstName, order.address?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Customer'

        const key = orderEmail || String(order.userId || order._id)

        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: order.userId || order._id,
            name: fullName,
            email: order.address?.email || 'customer@example.com',
            phone: order.address?.phone || '',
            allOrders: [order]
          })
        } else {
          const cust = customerMap.get(key)
          const alreadyExists = cust.allOrders.some(
            (o) => String(o._id) === String(order._id)
          )
          if (!alreadyExists) {
            cust.allOrders.push(order)
          }
          if (!cust.phone && order.address?.phone) {
            cust.phone = order.address.phone
          }
          if (cust.name === 'Customer' && fullName !== 'Customer') {
            cust.name = fullName
          }
        }
      })
    }

    // Filter to customers who actually have delivered orders
    return Array.from(customerMap.values()).filter(
      (c) => c.allOrders && c.allOrders.length > 0
    )
  }, [users, orders])

  // Filter orders according to date picker
  const processedCustomers = useMemo(() => {
    return customersWithOrders.map((customer) => {
      const matchingOrders = customer.allOrders.filter((order) => {
        if (!selectedDate) return true
        if (!order.date) return false
        const orderDateStr = new Date(order.date).toISOString().split('T')[0]
        return orderDateStr === selectedDate
      })

      return {
        ...customer,
        displayedOrders: matchingOrders
      }
    })
  }, [customersWithOrders, selectedDate])

  // Aggregate metrics
  const totalCustomers = customersWithOrders.length
  const ordersShown = processedCustomers.reduce(
    (sum, c) => sum + c.displayedOrders.length,
    0
  )
  const orderValue = processedCustomers.reduce(
    (sum, c) =>
      sum +
      c.displayedOrders.reduce((ordSum, o) => ordSum + Number(o.amount || 0), 0),
    0
  )

  return (
    <div className='customers-page'>
      {/* Header section */}
      <div className='customers-header'>
        <div className='customers-title-wrap'>
          <p className='customers-kicker'>CUSTOMER ACTIVITY</p>
          <h1 className='customers-title'>Customers</h1>
          <p className='customers-subtitle'>
            Review verified customers with delivered food orders.
          </p>
        </div>

        <div className='customers-date-filter'>
          <label htmlFor='orders-date-picker' className='date-label'>
            Orders on
          </label>
          <div className='date-input-wrap'>
            <input
              id='orders-date-picker'
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className='date-input'
            />
            {selectedDate && (
              <button
                type='button'
                onClick={() => setSelectedDate('')}
                className='date-clear-btn'
                title='Clear filter'
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className='customers-metrics-row'>
        <div className='metric-card'>
          <span className='metric-title'>Customers</span>
          <span className='metric-number'>{totalCustomers}</span>
        </div>

        <div className='metric-card'>
          <span className='metric-title'>Orders shown</span>
          <span className='metric-number'>{ordersShown}</span>
        </div>

        <div className='metric-card'>
          <span className='metric-title'>Order value</span>
          <span className='metric-number'>₹{orderValue.toFixed(2)}</span>
        </div>
      </div>

      {/* Customers List Cards */}
      <div className='customers-list'>
        {loading ? (
          <div className='customers-loading'>
            <p>Loading customer activity...</p>
          </div>
        ) : processedCustomers.length === 0 ? (
          <div className='customers-empty'>
            <p>No delivered customer orders found.</p>
            <span style={{ fontSize: '13.5px', color: '#777', marginTop: '6px', display: 'block', maxWidth: '480px', margin: '6px auto 0', lineHeight: '1.4' }}>
              When an order is marked as "delivered" in the Orders section, that customer and their completed order details will appear here.
            </span>
          </div>
        ) : (
          processedCustomers.map((customer, index) => {
            const count = customer.displayedOrders.length
            return (
              <div className='customer-card' key={customer.email || `customer-${index}`}>
                <div className='customer-card-header'>
                  <div className='customer-info'>
                    <h3 className='customer-name'>{customer.name}</h3>
                    <p className='customer-email'>
                      {customer.email}{customer.phone ? ` • ${customer.phone}` : ''}
                    </p>
                  </div>
                  <div className='customer-order-count'>
                    {count} {count === 1 ? 'delivered order' : 'delivered orders'}
                  </div>
                </div>

                <div className='customer-card-body'>
                  {count === 0 ? (
                    <p className='no-orders-message'>No delivered orders on this selected date.</p>
                  ) : (
                    <div className='customer-orders'>
                      {customer.displayedOrders.map((order) => (
                        <div className='customer-order-row' key={order._id}>
                          <div className='order-row-left'>
                            <p className='order-items-summary'>
                              {formatItemSummary(order.items)}
                            </p>
                            <p className='order-meta'>
                              {formatDateDisplay(order.date)} &bull;{' '}
                              <span className='order-status-tag'>Delivered</span>
                              {order.address?.city ? ` &bull; 📍 ${order.address.city}, ${order.address.state || ''}` : ''}
                            </p>
                          </div>
                          <div className='order-row-right'>
                            <span className='order-amount'>
                              ₹{Number(order.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Customers
