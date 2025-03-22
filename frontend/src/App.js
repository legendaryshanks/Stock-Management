import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";

function App() {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState("");
    const [stockInfo, setStockInfo] = useState(null);
    const [allStock, setAllStock] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/items").then((response) => {
            setItems(response.data);
        });
        fetchAllStock();
    }, []);

    const fetchAllStock = () => {
        axios.get("http://localhost:5000/stock").then((response) => {
            setAllStock(response.data);
        });
    };

    const handleAddStock = () => {
        axios.post("http://localhost:5000/stock/add", { itemName: selectedItem, quantity: Number(quantity) })
            .then(() => {
                alert("Stock added successfully");
                fetchAllStock();
            })
            .catch((err) => alert(err.response.data.message));
    };

    const handleRemoveStock = () => {
        axios.post("http://localhost:5000/stock/remove", { itemName: selectedItem, quantity: Number(quantity) })
            .then(() => {
                alert("Stock removed successfully");
                fetchAllStock();
            })
            .catch((err) => alert(err.response.data.message));
    };

    const handleViewStock = () => {
        axios.get(`http://localhost:5000/stock/${selectedItem}`)
            .then((response) => setStockInfo(response.data))
            .catch(() => setStockInfo(null));
    };

    return (
        <div className="container">
            <h1>Stock Management</h1>
            <div className="stock-controls">
                <select onChange={(e) => setSelectedItem(e.target.value)}>
                    <option value="">Select Item</option>
                    {items.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Enter Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                <button className="add-btn" onClick={handleAddStock}>➕ Add Stock</button>
                <button className="remove-btn" onClick={handleRemoveStock}>➖ Remove Stock</button>
                <button className="view-btn" onClick={handleViewStock}>📦 View Stock</button>
            </div>
            {stockInfo && (
                <div className="stock-info">
                    <h3>Stock Details</h3>
                    <p><strong>Item:</strong> {stockInfo.itemName}</p>
                    <p><strong>Quantity:</strong> {stockInfo.quantity}</p>
                </div>
            )}
            <div className="all-stock">
                <h2>All Stock</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allStock.map((stock, index) => (
                            <tr key={index}>
                                <td>{stock.itemName}</td>
                                <td>{stock.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;
