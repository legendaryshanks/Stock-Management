import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = "https://stock-management-9v8g.onrender.com";

const App = () => {
    const [stock, setStock] = useState([]);
    const [orderNumber, setOrderNumber] = useState('');
    const [partyName, setPartyName] = useState('');
    const [items, setItems] = useState([]);
    const [reservedOrders, setReservedOrders] = useState([]);
    const [executedOrders, setExecutedOrders] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    
    useEffect(() => {
        fetchStock();
        fetchReservedOrders();
        fetchExecutedOrders();
    }, []);

    const fetchStock = async () => {
        const response = await axios.get(`${BACKEND_URL}/stock`);
        setStock(response.data);
    };

    const fetchReservedOrders = async () => {
        const response = await axios.get(`${BACKEND_URL}/orders/reserved`);
        setReservedOrders(response.data);
    };

    const fetchExecutedOrders = async () => {
        const response = await axios.get(`${BACKEND_URL}/orders/executed`);
        setExecutedOrders(response.data);
    };

    const addItemToOrder = () => {
        if (newItem && newQuantity) {
            setItems([...items, { itemName: newItem, quantity: parseInt(newQuantity) }]);
            setNewItem('');
            setNewQuantity('');
        }
    };

    const reserveOrder = async () => {
        const response = await axios.post(`${BACKEND_URL}/orders/reserve`, {
            orderNumber,
            partyName,
            items
        });
        alert(response.data.message);
        fetchStock();
        fetchReservedOrders();
    };

    const executeOrder = async (orderNum) => {
        const response = await axios.post(`${BACKEND_URL}/orders/execute`, { orderNumber: orderNum });
        alert(response.data.message);
        fetchStock();
        fetchReservedOrders();
        fetchExecutedOrders();
    };

    return (
        <div className="container">
            <h1>Stock Management System</h1>
            <h2>Current Stock</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>Reserved</th>
                    </tr>
                </thead>
                <tbody>
                    {stock.map((item, index) => (
                        <tr key={index}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.reserved}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <h2>Reserve Order</h2>
            <input type="text" placeholder="Order Number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            <input type="text" placeholder="Party Name" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
            <input type="text" placeholder="Item Name" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <input type="number" placeholder="Quantity" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
            <button onClick={addItemToOrder}>Add Item</button>
            <button onClick={reserveOrder}>Reserve Order</button>
            
            <h2>Reserved Orders</h2>
            <ul>
                {reservedOrders.map((order, index) => (
                    <li key={index}>
                        {order.orderNumber} - {order.partyName}
                        <button onClick={() => executeOrder(order.orderNumber)}>Execute</button>
                    </li>
                ))}
            </ul>
            
            <h2>Executed Orders</h2>
            <ul>
                {executedOrders.map((order, index) => (
                    <li key={index}>{order.orderNumber} - {order.partyName}</li>
                ))}
            </ul>
        </div>
    );
};

export default App;
