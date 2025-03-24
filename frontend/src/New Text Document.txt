import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = "https://stock-management-9v8g.onrender.com";

const App = () => {
    const [items, setItems] = useState([]);
    const [stock, setStock] = useState([]);
    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [bulkItems, setBulkItems] = useState("");
    const [operation, setOperation] = useState("bulk-add");

    useEffect(() => {
        fetchStock();
        fetchItems();
    }, []);

    const fetchStock = async () => {
        const response = await axios.get(`${BACKEND_URL}/stock`);
        setStock(response.data);
    };

    const fetchItems = async () => {
        const response = await axios.get(`${BACKEND_URL}/items`);
        setItems(response.data);
    };

    const handleAddStock = async () => {
        await axios.post(`${BACKEND_URL}/stock/add`, { itemName, quantity: Number(quantity) });
        fetchStock();
    };

    const handleRemoveStock = async () => {
        await axios.post(`${BACKEND_URL}/stock/remove`, { itemName, quantity: Number(quantity) });
        fetchStock();
    };

    const handleBulkOperation = async () => {
        const bulkData = bulkItems.split("\n").map(line => {
            const [name, qty] = line.split(",");
            return { itemName: name.trim(), quantity: Number(qty.trim()) };
        });

        const url = operation === "bulk-add" ? `${BACKEND_URL}/stock/bulk-add` : `${BACKEND_URL}/stock/bulk-remove`;
        await axios.post(url, { items: bulkData });
        fetchStock();
    };

    return (
        <div className="container">
            <h1>Stock Management</h1>
            
            <div className="card">
                <h2>Manage Stock</h2>
                <select value={itemName} onChange={(e) => setItemName(e.target.value)}>
                    <option value="">Select or Type Item</option>
                    {items.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <input type="text" placeholder="Item Name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <button onClick={handleAddStock}>Add Stock</button>
                <button onClick={handleRemoveStock}>Remove Stock</button>
            </div>

            <div className="card">
                <h2>Bulk Operations</h2>
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                    <option value="bulk-add">Bulk Add</option>
                    <option value="bulk-remove">Bulk Remove</option>
                </select>
                <textarea placeholder="Enter items in format: Name, Quantity" value={bulkItems} onChange={(e) => setBulkItems(e.target.value)} />
                <button onClick={handleBulkOperation}>Submit</button>
            </div>

            <div className="card">
                <h2>Stock Overview</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map(item => (
                            <tr key={item.itemName}>
                                <td>{item.itemName}</td>
                                <td>{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default App;
