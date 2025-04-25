import React, { useState, useEffect } from 'react';
import logo from './image.png'; // Import the image
import './styles/WorkLogger.css'; // Import the consolidated styles

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
    const [selectedJob, setSelectedJob] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // New state for edit mode
    const [editFormData, setEditFormData] = useState({}); // New state for edit form data

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
    
    // Function to truncate text
    function truncateText(text, sentenceCount = 2) {
        if (!text) return "";
        
        // Split by sentence endings (period followed by a space or end of string)
        const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [];
        
        if (sentences.length <= sentenceCount) {
            return text;
        }
        
        return sentences.slice(0, sentenceCount).join('') + '...';
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

    // Effect to manage body class when popup is open/closed
    useEffect(() => {
        const mainContent = document.getElementById('mainContent');
        if (showPopup) {
            // Add blur effect to main content when popup is open
            document.body.style.overflow = 'hidden';
            if (mainContent) {
                mainContent.style.filter = 'blur(5px)';
                mainContent.style.transition = 'filter 0.3s ease';
            }
        } else {
            // Remove blur effect when popup is closed
            document.body.style.overflow = 'auto';
            if (mainContent) {
                mainContent.style.filter = 'none';
            }
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = 'auto';
            if (mainContent) {
                mainContent.style.filter = 'none';
            }
        };
    }, [showPopup]);

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

    // Function to open job details popup
    const openJobDetails = (job) => {
        setSelectedJob(job);
        setEditFormData({
            jobName: job.jobName,
            jobDescription: job.jobDescription,
            time: formatDateTimeForInput(new Date(job.time)),
            duration: job.duration
        });
        setShowPopup(true);
        setIsEditMode(false); // Reset to view mode when opening
    };

    // Function to close job details popup
    const closeJobDetails = () => {
        setShowPopup(false);
        setIsEditMode(false); // Reset edit mode
        setTimeout(() => {
            setSelectedJob(null);
            setEditFormData({});
        }, 300); // Delay clearing the selected job until after animation
    };

    // Handle edit form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Enter edit mode
    const enterEditMode = () => {
        setIsEditMode(true);
    };

    // Save edited job
    const saveEditedJob = () => {
        // Validate edit form data
        if (!editFormData.jobName.trim()) {
            setError('Job name is required');
            return;
        }

        // Update the log
        setLogs(prev => prev.map(log => 
            log.id === selectedJob.id 
                ? { ...log, ...editFormData } 
                : log
        ));

        setIsEditMode(false);
        setError('');
        
        // Update the selected job to see the changes in view mode
        setSelectedJob({
            ...selectedJob,
            ...editFormData
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        // Reset form data to original values
        setEditFormData({
            jobName: selectedJob.jobName,
            jobDescription: selectedJob.jobDescription,
            time: formatDateTimeForInput(new Date(selectedJob.time)),
            duration: selectedJob.duration
        });
        setIsEditMode(false);
        setError('');
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
        <div id="appContainer">
            <div id="mainContent">
                {/* Add the logo above the title */}
                <img src={logo} alt="Work Logger Logo" className="logo" />
                <h1 className="app-title">Work Logger</h1>

                {/* Add new work log form */}
                <div className="card">
                    <h2 className="card-title">Add New Work Log</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Job Name *</label>
                                <input
                                    type="text"
                                    name="jobName"
                                    value={formData.jobName}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Enter job name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="datetime-local"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleInputChange}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Job Description</label>
                                <textarea
                                    name="jobDescription"
                                    value={formData.jobDescription}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Enter job description"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Duration (hours)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    min="0.25"
                                    step="0.25"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Add Work Log
                        </button>
                    </form>
                </div>

                {/* Display today's logs */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="card-title">Today's Work Logs</h2>

                        {logs.length > 0 && (
                            <button onClick={exportToCSV} className="btn btn-success">
                                Export to CSV
                            </button>
                        )}
                    </div>

                    {todayLogs.length > 0 ? (
                        <div className="logs-container">
                            {todayLogs.map(log => (
                                <div key={log.id} className="log-card">
                                    <div className="log-header" onClick={() => openJobDetails(log)}>
                                        <h3 className="job-name">{log.jobName}</h3>
                                        <div className="log-time-duration">
                                            <span className="log-time">{formatDate(log.time)}</span>
                                            <span className="log-duration">{log.duration} hr{log.duration !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    
                                    {log.jobDescription && (
                                        <div className="log-description">
                                            {truncateText(log.jobDescription)}
                                        </div>
                                    )}
                                    
                                    <div className="log-actions">
                                        <button onClick={() => openJobDetails(log)} className="btn btn-info">
                                            View Details
                                        </button>
                                        <button onClick={() => handleDelete(log.id)} className="btn btn-danger">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-message">No work logs for today. Add your first log above.</p>
                    )}
                </div>

                <footer className="footer">
                    <p>Work Logger App {new Date().getFullYear()} | <a href="https://github.com/willzjc/workloggerdemo">GitHub Repository</a></p>
                </footer>
            </div>

            {/* Full-screen popup for job details with blur effect and animations */}
            {showPopup && selectedJob && (
                <div className={`popup-overlay ${showPopup ? 'show' : ''}`}>
                    <div className="popup-container">
                        <div className="popup-header">
                            <h2 className="popup-title">{isEditMode ? "Edit Job" : "Job Details"}</h2>
                            <button
                                onClick={closeJobDetails}
                                className="popup-close"
                            >
                                ×
                            </button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="popup-body">
                            {isEditMode ? (
                                <div>
                                    <div className="field-group">
                                        <h3 className="field-label">Job Name</h3>
                                        <input
                                            type="text"
                                            name="jobName"
                                            value={editFormData.jobName}
                                            onChange={handleEditChange}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Time</h3>
                                        <input
                                            type="datetime-local"
                                            name="time"
                                            value={editFormData.time}
                                            onChange={handleEditChange}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Duration (hours)</h3>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={editFormData.duration}
                                            onChange={handleEditChange}
                                            className="form-control"
                                            min="0.25"
                                            step="0.25"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Description</h3>
                                        <textarea
                                            name="jobDescription"
                                            value={editFormData.jobDescription}
                                            onChange={handleEditChange}
                                            className="form-control"
                                            rows="4"
                                        ></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="field-group">
                                        <h3 className="field-label">Job Name</h3>
                                        <p className="field-value">{selectedJob.jobName}</p>
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Time</h3>
                                        <p className="field-value">{formatDate(selectedJob.time)}</p>
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Duration</h3>
                                        <p className="field-value">{selectedJob.duration} hours</p>
                                    </div>
                                    <div className="field-group">
                                        <h3 className="field-label">Description</h3>
                                        <div className="field-value pre-wrap">
                                            {selectedJob.jobDescription || "No description provided."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="popup-footer">
                            {isEditMode ? (
                                <div className="button-group">
                                    <button
                                        onClick={saveEditedJob}
                                        className="popup-btn btn-primary"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="popup-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="button-group">
                                    <button
                                        onClick={enterEditMode}
                                        className="popup-btn btn-primary"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={closeJobDetails}
                                        className="popup-btn"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}