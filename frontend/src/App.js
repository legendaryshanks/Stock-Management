import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const BACKEND_URL = "https://stock-management-9v8g.onrender.com"; // Update if running locally

const App = () => {
    const [items, setItems] = useState([]);
    const [stock, setStock] = useState([]);
    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [bulkItems, setBulkItems] = useState("");
    const [operation, setOperation] = useState("bulk-add");
    const [orderCheckData, setOrderCheckData] = useState("");
    const [orderReport, setOrderReport] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState("");
    const [skippedItems, setSkippedItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState("");
    const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
    const [stockAction, setStockAction] = useState("");
    const [isStockButtonHidden, setIsStockButtonHidden] = useState(false);
    
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
        setIsProcessing(true);
        setMessage("Processing request...");
        setSkippedItems([]);

        const bulkData = bulkItems.split("\n").map(line => {
            const [name, qty] = line.split(",");
            return { itemName: name.trim(), quantity: Number(qty.trim()) };
        });

        if (operation === "bulk-add") {
            try {
                const response = await axios.post(`${BACKEND_URL}/stock/bulk-add`, { items: bulkData });
                if (response.data.invalidItems && response.data.invalidItems.length > 0) {
                    setSkippedItems(response.data.invalidItems.map(name => ({ itemName: name, quantity: 0 })));
                    setMessage(`Bulk add completed with some invalid items: ${response.data.invalidItems.join(", ")}`);
                } else {
                    setMessage("Bulk add operation completed successfully");
                }
            } catch (error) {
                setMessage("Error processing bulk add operation");
            }
        } else {
             const response= await axios.post(`${BACKEND_URL}/stock/bulk-remove`, { items: bulkData });

             if (response.data.skippedItems) {
            setSkippedItems(response.data.skippedItems);
            } else{
            setMessage("Bulk operation completed successfully");
        	}

        }

        setBulkItems("");
        setIsProcessing(false);
        fetchStock();
    };



    const handleOrderCheck = async () => {
        const orders = orderCheckData.split("\n").map(line => {
            const [name, qty] = line.split(",");
            return { itemName: name.trim(), quantity: Number(qty.trim()) };
        });

        try {
            const response = await axios.post(`${BACKEND_URL}/stock/order-check`, { items: orders });
            setOrderReport(response.data);
            setIsOrderSubmitted(false);
        } catch (error) {
            console.error("Error fetching order check report:", error);
        }
    };

    const handleSubmitOrder = async () => {
        if (orderReport.length === 0) {
            setSubmissionMessage("No valid orders to submit");
            return;
        }

        setIsSubmitting(true);
        setSubmissionMessage("Submitting order...");

        const validOrders = orderReport.filter(item => item.balance >= 0).map(item => ({
            itemName: item.itemName,
            quantity: item.requested
        }));

        if (validOrders.length === 0) {
            setSubmissionMessage("All requested items have insufficient stock.");
            setIsSubmitting(false);
            return;
        }

        try {
            await axios.post(`${BACKEND_URL}/stock/submit-order`, { items: validOrders });
            setSubmissionMessage("Order submitted successfully");
            setIsOrderSubmitted(true);
            fetchStock();
        } catch (error) {
            setSubmissionMessage("Error submitting order");
        }

        setIsSubmitting(false);
    };

  const handlePrintReport = () => {
        const newWindow = window.open("", "_blank");
        const reportHTML = `
            <html>
            <head>
                <title>Order Check Report</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h2>Order Check Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Order</th>
                            <th>Warehouse</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderReport.map(item => `
                            <tr>
                                <td>${item.itemName}</td>
                                <td>${item.requested}</td>
                                <td>${item.available}</td>
                                <td>${item.balance}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    };
                </script>
            </body>
            </html>
        `;
        newWindow.document.write(reportHTML);
        newWindow.document.close();
    };

    return (
        <div className="container">
            <h1>Stock Management</h1>
            
       	    <div className="card">
                <h2>Manage Stock</h2>
                <input 
                    type="text" 
                    list="items-list" 
                    placeholder="Select or Type Item" 
                    value={itemName} 
                    onChange={(e) => setItemName(e.target.value)} 
                />
                <datalist id="items-list">
                    {items.map(item => <option key={item} value={item} />)}
                </datalist>
                <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                />
                {!isStockButtonHidden && (
                    <>
                        <button onClick={() => handleStockOperation("add")}>Add Stock</button>
                        <button onClick={() => handleStockOperation("remove")}>Remove Stock</button>
                    </>
                )}

            </div>

	   <div className="card">
                <h2>Bulk Operations</h2>
                <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                    <option value="bulk-add">Bulk Add</option>
                    <option value="bulk-remove">Bulk Remove</option>
                </select>
                <textarea 
                    placeholder="Enter items in format: Name, Quantity" 
                    value={bulkItems} 
                    onChange={(e) => setBulkItems(e.target.value)} 
                />
                <button onClick={handleBulkOperation} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Submit"}
                </button>
                {message && <p className="message">{message}</p>}
                {skippedItems.length > 0 && (
                    <div className="skipped-items">
                        <h3>Skipped Items (Insufficient Stock)</h3>
                        <ul>
                            {skippedItems.map((item, index) => (
                                <li key={index}>{item.itemName} - Requested: {item.quantity}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="card">
                <h2>Order Check</h2>
                <textarea 
                    placeholder="Enter orders in format: Name, Quantity" 
                    value={orderCheckData} 
                    onChange={(e) => setOrderCheckData(e.target.value)} 
                />
                <button onClick={handleOrderCheck}>Check Order</button>
                {orderReport.length > 0 && (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Order</th>
                                    <th>Warehouse</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderReport.map((report, index) => (
                                    <tr key={index}>
                                        <td>{report.itemName}</td>
                                        <td>{report.requested}</td>
                                        <td>{report.available}</td>
                                        <td className={report.balance < 0 ? "negative-balance" : ""}>{report.balance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={handlePrintReport}>Print Report</button>
                        {!isOrderSubmitted && (
                            <button 
                                className="submit-button" 
                                onClick={handleSubmitOrder} 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting order..." : "Submit Order"}
                            </button>
                        )}
                        {submissionMessage && <p className="submission-message">{submissionMessage}</p>}
                    </>
                )}
            </div>

            <div className="container">
                 
            <div className="card">
                <h2>Stock Overview</h2>
                <div className="stock-overview">
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
        </div>
    );
};

export default App;