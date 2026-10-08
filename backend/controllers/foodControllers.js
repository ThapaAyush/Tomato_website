import foodModel from "../models/foodModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// add food item
const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    const image_filename = req.file.filename;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price),
      category: req.body.category || "General",
      image: image_filename,
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.error("Error adding food:", error);
    res.status(500).json({ success: false, message: "Error adding food" });
  }
};

// all food list 
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error listing food:", error);
    res.status(500).json({ success: false, message: "Error fetching food list" });
  }
};

// search food item
const searchFood = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(query, "i");

    const foods = await foodModel.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
      ],
    });

    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("Error searching food:", error);
    res.status(500).json({ success: false, message: "Error searching food" });
  }
};

// Remove food item
const removeFood = async (req, res) => {
  try {
    const id = req.body.id || req.query.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Food ID is required" });
    }

    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    if (food.image) {
      const filePath = path.join(__dirname, "../uploads", food.image);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error removing food image file:", err);
        });
      }
    }

    await foodModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.error("Error removing food:", error);
    res.status(500).json({ success: false, message: "Error removing food" });
  }
};

export { addFood, listFood, searchFood, removeFood };