import React, { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../Fooditem/Fooditem'

const FoodDisplay = ({ category }) => {

    const context = useContext(StoreContext);
    const food_list = context?.food_list || [];

    return (
        <div className='food-display' id='food-display'>
            <h2>Top dishes near you</h2>

            <div className="food-display-list">
                {food_list.map((item, index) => {
                    if(category==="All" || category===item.category){
                    return (
                        <FoodItem
                            key={index}
                            id={item._id}
                            name={item.name}
                            description={item.description}
                            price={`$${item.price}`}
                            image={item.image}
                        />
                    )
                    }

                })}
            </div>
        </div>
    )
}

export default FoodDisplay