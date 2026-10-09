import { useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Add = ({ url }) => {
  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error("Please upload an image for the food item.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("image", image);

    try {
      const response = await axios.post(`${url}/api/food/add`, formData);

      if (!response.data.success) {
        toast.error(response.data.message || "Unable to add food item.");
        return;
      }

      setData({
        name: "",
        description: "",
        price: "",
        category: "Salad",
      });

      setImage(false);
      toast.success("Food item added successfully!");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to reach the server. Make sure the backend is running.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-page">
      <div className="add-card">
        <div className="add-card-header">
          <h2>Add Food Item</h2>
          <p>Upload image and fill details to add a new dish to the menu.</p>
        </div>

        <form onSubmit={onSubmitHandler}>
          {/* Image Upload Area */}
          <div className="form-group">
            <label className="form-label">Upload Food Image</label>
            <label htmlFor="image" className="upload-box">
              <img
                src={image ? URL.createObjectURL(image) : assets.upload_area}
                alt="Upload preview"
                className={image ? "uploaded-preview" : "upload-icon"}
              />
              {!image && <span className="upload-hint">Click to choose image</span>}
            </label>

            <input
              type="file"
              id="image"
              hidden
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Greek Salad"
              value={data.name}
              onChange={onChangeHandler}
              required
            />
          </div>

          {/* Product Description */}
          <div className="form-group">
            <label className="form-label">Product Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder="Write a brief description of the ingredients and taste..."
              value={data.description}
              onChange={onChangeHandler}
              required
            />
          </div>

          {/* Category & Price */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={data.category}
                onChange={onChangeHandler}
                required
              >
                <option value="Salad">Salad</option>
                <option value="Rolls">Rolls</option>
                <option value="Deserts">Deserts</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Cake">Cake</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Pasta">Pasta</option>
                <option value="Noodles">Noodles</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                name="price"
                placeholder="₹ 150"
                value={data.price}
                onChange={onChangeHandler}
                min="1"
                required
              />
            </div>
          </div>

          <button type="submit" className="add-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Food Item"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add;
