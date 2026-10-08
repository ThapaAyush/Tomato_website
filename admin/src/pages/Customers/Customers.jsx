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
        const token = localStorage.getItem("token") || ""
        const adminEmail = localStorage.getItem("userEmail") || ""
        const [usersRes, ordersRes] = await Promise.all([
          axios.get(`${url}/api/user/list`, {
            headers: {
              token: token,
              adminemail: adminEmail
            }
          }),
          axios.get(`${url}/api/order/list`)
        ])

        if (usersRes.data?.success) {
          setUsers(usersRes.data.data || [])
        } else {
          setUsers([])
        }
        if (ordersRes.data?.success) {
          setOrders(ordersRes.data.data || [])
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

  // Map orders to customers (strictly for matched users)
  const customersWithOrders = useMemo(() => {
    // If no matching customer returned by backend, do NOT show any customer data
    if (!users || users.length === 0) {
      return []
    }

    const customerMap = new Map()

    users.forEach((u) => {
      customerMap.set(u.email.toLowerCase(), {
        id: u._id,
        name: u.name,
        email: u.email,
        allOrders: []
      })
    })

    // Attach ONLY orders that belong to the matched customer(s)
    orders.forEach((order) => {
      if (order.status === 'Cancelled') return
      const orderEmail = (order.address?.email || '').toLowerCase()
      if (orderEmail && customerMap.has(orderEmail)) {
        customerMap.get(orderEmail).allOrders.push(order)
      } else {
        // Fallback match by userId
        for (const customer of customerMap.values()) {
          if (customer.id && String(customer.id) === String(order.userId)) {
            customer.allOrders.push(order)
            break
          }
        }
      }
    })

    return Array.from(customerMap.values())
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
            Review customers and the orders placed by each one.
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
            <p>No matching customer data found.</p>
            <span style={{ fontSize: '13px', color: '#888', marginTop: '6px', display: 'block', maxWidth: '460px', margin: '6px auto 0', lineHeight: '1.4' }}>
              Customer data is displayed here only when your Admin credentials (ID/email, name, and password) match a registered Frontend Customer account.
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
                    <p className='customer-email'>{customer.email}</p>
                  </div>
                  <div className='customer-order-count'>
                    {count} {count === 1 ? 'order' : 'orders'}
                  </div>
                </div>

                <div className='customer-card-body'>
                  {count === 0 ? (
                    <p className='no-orders-message'>No orders in this view.</p>
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
                              {order.status || 'Food Processing'}
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
