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

const itemSchema = new mongoose.Schema({
    itemName: String,
    quantity: Number,
});

const Item = mongoose.model("Item", itemSchema);

// Fetch paginated stock details
//app.get("/stock", async (req, res) => {
//    const { page = 1, limit = 50 } = req.query;
//    try {
//        const stock = await Item.find()
//            .skip((page - 1) * limit)
//            .limit(Number(limit));
//        const totalItems = await Item.countDocuments();
//        res.json({ stock, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) });
//    } catch (error) {
//        res.status(500).json({ message: "Error fetching stock", error });
//    }
//});

app.get("/stock", async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    try {
        const totalItems = await Item.countDocuments();
        
        if (totalItems === 0) {
            return res.json({ stock: [], totalItems: 0, totalPages: 0, currentPage: 1 });
        }

        const stock = await Item.find()
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ stock, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: Number(page) });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stock", error });
    }
});

// Fetch all items
app.get("/items", async (req, res) => {
    const items = await Item.find({}, "itemName");
    res.json(items.map(item => item.itemName));
});

// Add stock
app.post("/stock/add", async (req, res) => {
    const { itemName, quantity } = req.body;
    const item = await Item.findOneAndUpdate(
        { itemName },
        { $inc: { quantity } },
        { upsert: true, new: true }
    );
    res.json(item);
});

// Remove stock
app.post("/stock/remove", async (req, res) => {
    const { itemName, quantity } = req.body;
    const item = await Item.findOne({ itemName });
    if (!item || item.quantity < quantity) {
        return res.status(400).json({ message: "Not enough stock" });
    }
    item.quantity -= quantity;
    await item.save();
    res.json(item);
});

// Bulk Add Stock
app.post("/stock/bulk-add", async (req, res) => {
    const { items } = req.body;
    try {
        const bulkOperations = items.map(({ itemName, quantity }) => ({
            updateOne: {
                filter: { itemName },
                update: { $inc: { quantity } },
                upsert: true,
            },
        }));
        await Item.bulkWrite(bulkOperations);
        res.json({ message: "Bulk add successful" });
    } catch (error) {
        res.status(500).json({ message: "Error processing bulk add", error });
    }
});

// Bulk Remove Stock
app.post("/stock/bulk-remove", async (req, res) => {
    const { items } = req.body;
    try {
        for (const { itemName, quantity } of items) {
            const item = await Item.findOne({ itemName });
            if (!item || item.quantity < quantity) {
                return res.status(400).json({ message: `Not enough stock for ${itemName}` });
            }
            item.quantity -= quantity;
            await item.save();
        }
        res.json({ message: "Bulk remove successful" });
    } catch (error) {
        res.status(500).json({ message: "Error processing bulk remove", error });
    }
});

// Order Check
app.post("/stock/order-check", async (req, res) => {
    const { items } = req.body;
    try {
        const stock = await Item.find();
        const stockMap = stock.reduce((map, item) => {
            map[item.itemName] = item.quantity;
            return map;
        }, {});

        const report = items.map(({ itemName, quantity }) => {
            if (!stockMap[itemName] || stockMap[itemName] < quantity) {
                return { itemName, quantity, status: "Insufficient" };
            }
            return { itemName, quantity, status: "Available" };
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: "Error processing order check", error });
    }
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});
