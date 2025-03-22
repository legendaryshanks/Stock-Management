import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";

const App = () => {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState("");
    const [bulkData, setBulkData] = useState("");
    const [stock, setStock] = useState([]);
    const [operation, setOperation] = useState("add");

    useEffect(() => {
        fetchItems();
        fetchStock();
    }, []);

    const fetchItems = async () => {
        const response = await axios.get("http://localhost:5000/items");
        setItems(response.data);
    };

    const fetchStock = async () => {
        const response = await axios.get("http://localhost:5000/stock");
        setStock(response.data);
    };

    const handleStockChange = async (type) => {
        if (!selectedItem || !quantity) return;
        const url = `http://localhost:5000/stock/${type}`;
        await axios.post(url, { itemName: selectedItem, quantity: Number(quantity) });
        fetchStock();
        setQuantity("");
    };

    const handleBulkOperation = async () => {
        if (!bulkData) return;
        const url = `http://localhost:5000/stock/bulk-${operation}`;
        const itemsArray = bulkData.split("\n").map(line => {
            const [itemName, quantity] = line.split(",").map(s => s.trim());
            return { itemName, quantity: Number(quantity) };
        });
        await axios.post(url, { items: itemsArray });
        fetchStock();
        setBulkData("");
    };

    return (
        <div className="container">
            <h1>Stock Management</h1>
            <div className="stock-view">
                <h2>Current Stock</h2>
                <ul>
                    {stock.map((item, index) => (
                        <li key={index}>{item.itemName}: {item.quantity}</li>
                    ))}
                </ul>
            </div>
            <div className="controls">
                <h2>Update Stock</h2>
                <select onChange={(e) => setSelectedItem(e.target.value)}>
                    <option value="">Select Item</option>
                    {items.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                <button className="add" onClick={() => handleStockChange("add")}>+ Add Stock</button>
                <button className="remove" onClick={() => handleStockChange("remove")}>- Remove Stock</button>
            </div>
            <div className="bulk-controls">
                <h2>Bulk Operations</h2>
                <select onChange={(e) => setOperation(e.target.value)}>
                    <option value="add">Bulk Add</option>
                    <option value="remove">Bulk Remove</option>
                </select>
                <textarea
                    placeholder="Enter items in format: item,quantity (one per line)"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                />
                <button className="bulk" onClick={handleBulkOperation}>Execute Bulk Operation</button>
            </div>
        </div>
    );
};

export default App;
