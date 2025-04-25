import React, { useState, useEffect } from 'react';
import logo from './image.png'; // Import the image

export default function WorkLogger() {
    const [logs, setLogs] = useState(() => {
        const savedLogs = localStorage.getItem('workLogs');
        return savedLogs ? JSON.parse(savedLogs) : [];
    });

    const [formData, setFormData] = useState({
        jobName: '',
        jobDescription: '',
        time: formatDateTimeForInput(new Date()),
        duration: 1
    });

    const [error, setError] = useState('');

    // Date formatting functions to replace date-fns
    function formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(date).toLocaleString('en-US', options);
    }

    function formatDateTimeForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    function getCurrentDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // Filter logs for today
    const todayLogs = logs.filter(log => {
        const logDate = new Date(log.time).toDateString();
        const today = new Date().toDateString();
        return logDate === today;
    });

    // Save logs to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('workLogs', JSON.stringify(logs));
    }, [logs]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form data
        if (!formData.jobName.trim()) {
            setError('Job name is required');
            return;
        }

        // Create new log entry
        const newLog = {
            id: Date.now(),
            ...formData,
            time: formData.time
        };

        // Add to logs
        setLogs(prev => [...prev, newLog]);

        // Reset form
        setFormData({
            jobName: '',
            jobDescription: '',
            time: formatDateTimeForInput(new Date()),
            duration: 1
        });

        setError('');
    };

    const handleDelete = (id) => {
        setLogs(prev => prev.filter(log => log.id !== id));
    };

    // Custom CSV export function to replace react-csv
    const exportToCSV = () => {
        const headers = ['Job Name', 'Job Description', 'Time', 'Duration (hours)'];

        // Convert logs to CSV format
        const csvData = logs.map(log => [
            log.jobName,
            log.jobDescription,
            log.time,
            log.duration
        ]);

        // Add headers to the beginning
        csvData.unshift(headers);

        // Convert to CSV string
        const csvString = csvData.map(row =>
            row.map(cell =>
                cell !== null && cell !== undefined
                    ? `"${String(cell).replace(/"/g, '""')}"`
                    : '""'
            ).join(',')
        ).join('\n');

        // Create a blob and download link
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `work-logs-${getCurrentDateString()}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Add the logo above the title */}
            <img src={logo} alt="Work Logger Logo" className="mx-auto mb-4 h-12" />
            <h1 className="text-3xl font-bold mb-6 text-center">Work Logger</h1>

            {/* Add new work log form */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8 container-border">
                <h2 className="text-xl font-semibold mb-4">Add New Work Log</h2>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Job Name *</label>
                            <input
                                type="text"
                                name="jobName"
                                value={formData.jobName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Enter job name"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Time</label>
                            <input
                                type="datetime-local"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Job Description</label>
                            <textarea
                                name="jobDescription"
                                value={formData.jobDescription}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Enter job description"
                                rows="3"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Duration (hours)</label>
                            <input
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0.25"
                                step="0.25"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Add Work Log
                    </button>
                </form>
            </div>

            {/* Display today's logs */}
            <div className="bg-white p-6 rounded-lg shadow-lg container-border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Today's Work Logs</h2>

                    {logs.length > 0 && (
                        <button
                            onClick={exportToCSV}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition flex items-center"
                        >
                            Export to CSV
                        </button>
                    )}
                </div>

                {todayLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Job Name</th>
                                    <th className="border p-2 text-left">Description</th>
                                    <th className="border p-2 text-left">Time</th>
                                    <th className="border p-2 text-left">Duration (hrs)</th>
                                    <th className="border p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="border p-2">{log.jobName}</td>
                                        <td className="border p-2">{log.jobDescription}</td>
                                        <td className="border p-2">{formatDate(log.time)}</td>
                                        <td className="border p-2">{log.duration}</td>
                                        <td className="border p-2">
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No work logs for today. Add your first log above.</p>
                )}
            </div>

            <footer className="mt-8 text-center text-gray-500">
                <p>Work Logger App {new Date().getFullYear()} | <a href="https://github.com/willzjc/workloggerdemo" className="underline">GitHub Repository</a></p>
            </footer>
        </div>
    );
}