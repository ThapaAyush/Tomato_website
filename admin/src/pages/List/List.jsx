import './List.css'
import axios from "axios"
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const List = ({url}) => {

    

    const [list, setList] = useState([])

    const fetchList = async () => {
        try {
            const response = await axios.get(`${url}/api/food/list`)

            console.log(response.data)

            if (response.data.success) {
                setList(response.data.data || [])
            } else {
                toast.error("Error fetching food list")
            }

        } catch (error) {
            console.log(error)
            toast.error("Error fetching food list")
        }
    }

    const removeFood = async (foodId) => {
        try {
            const response = await axios.post(
                `${url}/api/food/remove`,
                { id: foodId }
            )

            if (response.data.success) {
                toast.success("Food removed successfully")
                await fetchList()
            } else {
                toast.error("Error removing food")
            }

        } catch (error) {
            console.log(error)
            toast.error("Error removing food")
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        axios.get(`${url}/api/food/list`, { signal: controller.signal })
            .then((response) => {
                if (response.data.success) {
                    setList(response.data.data || [])
                } else {
                    toast.error("Error fetching food list")
                }
            })
            .catch((error) => {
                if (!axios.isCancel(error)) {
                    toast.error("Error fetching food list")
                }
            })

        return () => controller.abort()
    }, [url])

    return (
        <div className="list add flex-col">

            <h2>All Food List</h2>

            <div className="list-table">

                <div className="list-table-format title">
                    <b>Image</b>
                    <b>Name</b>
                    <b>Category</b>
                    <b>Price</b>
                    <b>Action</b>
                </div>

                {list.map((item, index) => {
                    return (
                        <div
                            key={index}
                            className="list-table-format"
                        >
                            <img
                                src={`${url}/images/` + item.image}
                                alt=""
                            />

                            <p>{item.name}</p>

                            <p>{item.category}</p>

                            <p>₹{item.price}</p>

                            <p
                                onClick={() => removeFood(item._id)}
                                className="cursor"
                            >
                                X
                            </p>
                        </div>
                    )
                })}

            </div>
        </div>
    )
}

export default List