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


// Get stock for a specific item
app.get("/stock/:itemName", async (req, res) => {
    const { itemName } = req.params;
    try {
        const item = await Item.findOne({ itemName });
        if (!item) return res.status(404).json({ message: "Item not found" });
        res.json({ itemName: item.itemName, quantity: item.quantity });
    } catch (error) {
        res.status(500).json({ message: "Error fetching item stock", error });
    }
});

// Fetch all items
app.get("/items", async (req, res) => {
    const items = await Item.find({}, "itemName");
    res.json(items.map(item => item.itemName));
});

// Fetch stock details- used in stock overview section
app.get("/stock", async (req, res) => {
    const stock = await Item.find().select("itemName quantity");
    res.json(stock);
});

// To search items dynamically
app.get("/stock/search", async (req, res) => {
    const { query } = req.query;
    try {
        const stock = await Item.find({ $text: { $search: query } }) // 🔥 Fast search
            .select("itemName quantity")
            .limit(20); // Prevent large responses
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: "Error fetching stock", error });
    }
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

// Bulk Add Stock (add only valid items, skip invalid ones)
app.post("/stock/bulk-add", async (req, res) => {
    const { items } = req.body;
    try {
        const existingItems = await Item.find({ itemName: { $in: items.map(i => i.itemName) } });
        const existingItemNames = existingItems.map(item => item.itemName);
        const validItems = items.filter(i => existingItemNames.includes(i.itemName));
        const invalidItems = items.filter(i => !existingItemNames.includes(i.itemName)).map(i => i.itemName);
        
        if (validItems.length > 0) {
            const bulkOperations = validItems.map(({ itemName, quantity }) => ({
                updateOne: {
                    filter: { itemName },
                    update: { $inc: { quantity } },
                },
            }));
            await Item.bulkWrite(bulkOperations);
        }
        
        res.json({
            message: "Bulk add completed with some errors", 
            invalidItems,
            success: validItems.length > 0
        });
    } catch (error) {
        res.status(500).json({ message: "Error processing bulk add", error });
    }
});

// Bulk Remove Stock (optimized with filtering)
app.post("/stock/bulk-remove", async (req, res) => {
    const { items } = req.body;
    try {
        const itemNames = items.map(item => item.itemName);
        const stock = await Item.find({ itemName: { $in: itemNames } });
        
        const stockMap = stock.reduce((acc, item) => {
            acc[item.itemName] = item.quantity;
            return acc;
        }, {});
        
        const bulkOperations = [];
        const skippedItems = [];
        
        for (const { itemName, quantity } of items) {
            if (stockMap[itemName] && stockMap[itemName] >= quantity) {
                bulkOperations.push({
                    updateOne: {
                        filter: { itemName },
                        update: { $inc: { quantity: -quantity } },
                    },
                });
            } else {
                skippedItems.push({ itemName, quantity });
            }
        }
        
        if (bulkOperations.length > 0) {
            await Item.bulkWrite(bulkOperations);
        }
        
        res.json({ message: "Bulk remove completed", skippedItems });
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
            const available = stockMap[itemName] || 0; 
            const balance = available - quantity; // Calculate balance

            return { itemName, requested: quantity, available, balance };
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: "Error processing order check", error });
    }
});

// Order Submit
app.post("/stock/submit-order", async (req, res) => {
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "No valid items to deduct" });
    }

    try {
        const stock = await Item.find();
        const stockMap = stock.reduce((map, item) => {
            map[item.itemName] = item.quantity;
            return map;
        }, {});

        // Filter out items with insufficient stock
        const validOrders = items.filter(({ itemName, quantity }) => {
            return stockMap[itemName] !== undefined && stockMap[itemName] >= quantity;
        });

        if (validOrders.length === 0) {
            return res.status(400).json({ message: "No valid items to deduct" });
        }

        const bulkOperations = validOrders.map(({ itemName, quantity }) => ({
            updateOne: {
                filter: { itemName },
                update: { $inc: { quantity: -quantity } },
            },
        }));

        await Item.bulkWrite(bulkOperations);

        res.json({ message: "Order submitted successfully", deductedItems: validOrders });
    } catch (error) {
        console.error("Error processing order submission:", error);
        res.status(500).json({ message: "Error processing order submission", error });
    }
});

//Create new items in Bulk
//app.post("/items/bulk-add", async (req, res) => {
//    const { items } = req.body;
//
 //   if (!items || !Array.isArray(items) || items.length === 0) {
//        return res.status(400).json({ message: "Invalid item data" });
 //   }
//
   // try {
     //   const existingItems = await db.collection("stock").find().toArray();
       // const existingItemNames = existingItems.map(item => item.itemName);
//
    //    let addedItems = [];
    //    let skippedItems = [];
//
    //    for (let { itemName, quantity } of items) {
     //       if (!existingItemNames.includes(itemName)) {
      //          await db.collection("stock").insertOne({ itemName, quantity });
     //           addedItems.push(itemName);
        //    } else {
        //        skippedItems.push(itemName);
         //   }
      //  }
//
        //res.json({
          //  message: "Bulk item addition completed.",
          //  addedItems,
          //  skippedItems
       // });
   // } catch (error) {
   //     res.status(500).json({ message: "Error adding new items" });
   // }
//});



// Bulk Add New Items (Create New Items)
app.post("/items/bulk-add", async (req, res) => {
    const items = req.body.items;
    let bulkOperations = [];

    for (const item of items) {
        bulkOperations.push({
            updateOne: {
                filter: { itemName: item.itemName },
                update: { $inc: { quantity: item.quantity } },
                upsert: true // Creates new items if not present
            }
        });
    }

    await Item.bulkWrite(bulkOperations);
    res.json({ message: "Bulk new items added successfully" });
});





app.listen(5000, () => {
    console.log("Server started on port 5000");
});
