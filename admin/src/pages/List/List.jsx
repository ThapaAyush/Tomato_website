import './List.css'
import axios from "axios"
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const List = ({ url }) => {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchList = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${url}/api/food/list`)
            if (response.data.success) {
                setList(response.data.data || [])
            } else {
                toast.error("Error fetching food list")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error fetching food list")
        } finally {
            setLoading(false)
        }
    }

    const removeFood = async (foodId) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this item from the menu?")
        if (!confirmDelete) return

        try {
            const response = await axios.post(`${url}/api/food/remove`, { id: foodId })
            if (response.data.success) {
                toast.success("Food item removed successfully")
                await fetchList()
            } else {
                toast.error("Error removing food item")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error removing food item")
        }
    }

    useEffect(() => {
        fetchList()
    }, [url])

    return (
        <div className="list-page">
            <div className="list-card">
                <div className="list-card-header">
                    <div>
                        <h2>All Food Items</h2>
                        <p>View, manage, or remove items from your live restaurant menu.</p>
                    </div>
                    <span className="items-badge">{list.length} Items</span>
                </div>

                {loading ? (
                    <div className="list-loading">Loading food list...</div>
                ) : list.length === 0 ? (
                    <div className="list-empty">No food items added yet. Click 'Add Items' to add your first dish.</div>
                ) : (
                    <div className="list-table">
                        <div className="list-table-header">
                            <span>Image</span>
                            <span>Name</span>
                            <span>Category</span>
                            <span>Price</span>
                            <span>Action</span>
                        </div>

                        {list.map((item) => {
                            const imageUrl = item.image?.startsWith("/")
                                ? item.image
                                : `${url}/images/${item.image}`

                            return (
                                <div key={item._id} className="list-table-row">
                                    <div className="food-img-wrap">
                                        <img src={imageUrl} alt={item.name} />
                                    </div>
                                    <p className="food-name">{item.name}</p>
                                    <div>
                                        <span className="food-category-pill">{item.category}</span>
                                    </div>
                                    <p className="food-price">₹{item.price}</p>
                                    <button
                                        type="button"
                                        onClick={() => removeFood(item._id)}
                                        className="delete-btn"
                                        title="Delete item"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default List