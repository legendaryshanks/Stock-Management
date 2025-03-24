import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://legendaryshashankgupta:WyyHrgPLwBc8TIj0@cluster0.dcjcz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
    orderNumber: String,
    partyName: String,
    items: [{
        itemName: String,
        quantity: Number
    }],
    status: { type: String, enum: ['Reserved', 'Executed'], default: 'Reserved' }
});

const itemSchema = new mongoose.Schema({
    itemName: String,
    quantity: Number,
    reserved: { type: Number, default: 0 }
});

const Item = mongoose.model('Item', itemSchema);
const Order = mongoose.model('Order', orderSchema);

app.get('/stock', async (req, res) => {
    const stock = await Item.find();
    res.json(stock);
});

app.post('/stock/add', async (req, res) => {
    const { itemName, quantity } = req.body;
    const item = await Item.findOneAndUpdate(
        { itemName },
        { $inc: { quantity } },
        { upsert: true, new: true }
    );
    res.json({ message: 'Stock added', item });
});

app.post('/stock/remove', async (req, res) => {
    const { itemName, quantity } = req.body;
    const item = await Item.findOne({ itemName });
    if (!item || item.quantity < quantity) {
        return res.status(400).json({ message: 'Not enough stock' });
    }
    item.quantity -= quantity;
    await item.save();
    res.json({ message: 'Stock removed', item });
});

app.get('/orders', async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
});

app.post('/orders/reserve', async (req, res) => {
    const { orderNumber, partyName, items } = req.body;
    let reservedItems = [];
    let partiallyReserved = [];
    let shortages = [];

    for (const { itemName, quantity } of items) {
        const item = await Item.findOne({ itemName });
        if (!item) {
            shortages.push({ itemName, shortfall: quantity });
            continue;
        }

        let availableQuantity = item.quantity - item.reserved;
        if (availableQuantity >= quantity) {
            item.reserved += quantity;
            await item.save();
            reservedItems.push({ itemName, reserved: quantity });
        } else if (availableQuantity > 0) {
            item.reserved += availableQuantity;
            await item.save();
            partiallyReserved.push({ itemName, reserved: availableQuantity, shortfall: quantity - availableQuantity });
        } else {
            shortages.push({ itemName, shortfall: quantity });
        }
    }

    const newOrder = new Order({ orderNumber, partyName, items, status: 'Reserved' });
    await newOrder.save();

    res.json({
        message: 'Order reservation processed',
        reservedItems,
        partiallyReserved,
        shortages,
        order: newOrder
    });
});

app.post('/orders/execute', async (req, res) => {
    const { orderNumber } = req.body;
    const order = await Order.findOne({ orderNumber });

    if (!order || order.status !== 'Reserved') {
        return res.status(400).json({ message: 'Order not found or already executed' });
    }

    for (const { itemName, quantity } of order.items) {
        await Item.findOneAndUpdate(
            { itemName },
            { $inc: { quantity: -quantity, reserved: -quantity } },
            { new: true }
        );
    }

    order.status = 'Executed';
    await order.save();
    res.json({ message: 'Order executed successfully', order });
});

app.get('/orders/reserved', async (req, res) => {
    const reservedOrders = await Order.find({ status: 'Reserved' });
    res.json(reservedOrders);
});

app.get('/orders/executed', async (req, res) => {
    const executedOrders = await Order.find({ status: 'Executed' });
    res.json(executedOrders);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
