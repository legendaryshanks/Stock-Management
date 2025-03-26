import React, { useState, useEffect, useRef } from "react";
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
    const [orderCheckData, setOrderCheckData] = useState("");
    const [orderReport, setOrderReport] = useState([]);
    const stockContainerRef = useRef(null);

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

    const handleStockOperation = async (type) => {
        await axios.post(`${BACKEND_URL}/stock/${type}`, { itemName, quantity: Number(quantity) });
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

    const handleOrderCheck = () => {
        const orders = orderCheckData.split("\n").map(line => {
            const [name, qty] = line.split(",");
            return { itemName: name.trim(), quantity: Number(qty.trim()) };
        });

        const report = orders.map(order => {
            const stockItem = stock.find(item => item.itemName === order.itemName);
            if (stockItem) {
                return {
                    itemName: order.itemName,
                    requested: order.quantity,
                    available: stockItem.quantity,
                    status: order.quantity <= stockItem.quantity ? "Available" : "Insufficient"
                };
            } else {
                return { itemName: order.itemName, requested: order.quantity, available: 0, status: "Not in stock" };
            }
        });
        setOrderReport(report);
    };

    return (
        <div className="container">
            <h1>Stock Management</h1>
            
            <div className="card">
                <h2>Manage Stock</h2>
                <input type="text" list="items-list" placeholder="Select or Type Item" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <datalist id="items-list">
                    {items.map(item => <option key={item} value={item} />)}
                </datalist>
                <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                <div className="button-group">
                    <button onClick={() => handleStockOperation("add")}>Add Stock</button>
                    <button className="red-button" onClick={() => handleStockOperation("remove")}>Remove Stock</button>
                </div>
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
                <h2>Order Check</h2>
                <textarea placeholder="Enter orders in format: Name, Quantity" value={orderCheckData} onChange={(e) => setOrderCheckData(e.target.value)} />
                <button onClick={handleOrderCheck}>Check Order</button>
                {orderReport.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Requested</th>
                                <th>Available</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderReport.map((report, index) => (
                                <tr key={index}>
                                    <td>{report.itemName}</td>
                                    <td>{report.requested}</td>
                                    <td>{report.available}</td>
                                    <td className={report.status === "Available" ? "green-text" : "red-text"}>{report.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card">
                <h2>Stock Overview</h2>
                <div className="stock-container" ref={stockContainerRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
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
        </div>
    );
};

export default App;
