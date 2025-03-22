const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://legendaryshashankgupta:WyyHrgPLwBc8TIj0@cluster0.dcjcz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const stockSchema = new mongoose.Schema({
    itemName: String,
    quantity: Number
});

const Stock = mongoose.model("Stock", stockSchema);

// Add stock
app.post("/stock/add", async (req, res) => {
    const { itemName, quantity } = req.body;
    let item = await Stock.findOne({ itemName });
    if (item) {
        item.quantity += quantity;
    } else {
        item = new Stock({ itemName, quantity });
    }
    await item.save();
    res.json({ message: "Stock added successfully" });
});

// Remove stock
app.post("/stock/remove", async (req, res) => {
    const { itemName, quantity } = req.body;
    const item = await Stock.findOne({ itemName });
    if (!item) {
        return res.status(400).json({ message: "Item not found" });
    }
    if (item.quantity < quantity) {
        return res.status(400).json({ message: "Not enough stock" });
    }
    item.quantity -= quantity;
    await item.save();
    res.json({ message: "Stock removed successfully" });
});

// Check stock
app.get("/stock", async (req, res) => {
    const stock = await Stock.find();
    res.json(stock);
});

// Check stock of a particular item
app.get("/stock/:itemName", async (req, res) => {
    const { itemName } = req.params;
    const item = await Stock.findOne({ itemName });
    if (!item) {
        return res.status(400).json({ message: "Item not found" });
    }
    res.json(item);
});

// Get list of item names for dropdown
app.get("/items", async (req, res) => {
    const stock = await Stock.find().select("itemName -_id");
    res.json(stock.map(item => item.itemName));
});

app.listen(5000, () => console.log("Server started on port 5000"));
