import React, { useState, useEffect, useRef } from 'react';
import logo from './images/logo.png';
import './styles/WorkLogger.css';
import * as d3 from 'd3';
import { 
  addLog, 
  deleteLog, 
  updateLog, 
  subscribeToLogs, 
  getTodayLogs,
  handleFirebaseConnectionStatus,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged 
} from './services/dbService';

export default function WorkLogger() {
    const [logs, setLogs] = useState([]);
    const [todayLogs, setTodayLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        jobName: '',
        jobDescription: '',
        time: formatDateTimeForInput(new Date()),
        duration: 1
    });

    const [error, setError] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    const logoRef = useRef(null);
    const mainFormRef = useRef(null);
    const workLogsRef = useRef(null);

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
        
        const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [];
        
        if (sentences.length <= sentenceCount) {
            return text;
        }
        
        return sentences.slice(0, sentenceCount).join('') + '...';
    }

    // Handle Firebase connection errors
    const handleFirebaseError = (error) => {
        console.error("Firebase connection error:", error);
        setConnectionError(true);
        setError("Connection error. Check your internet connection and try again.");
    };

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(user => {
            setCurrentUser(user);
            if (user) {
                setFormData(prev => ({ ...prev, name: user.displayName || '' }));
            } else {
                setFormData(prev => ({ ...prev, name: '' }));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Attempt to reconnect when app comes online
    useEffect(() => {
        const handleOnline = () => {
            console.log("App is online. Attempting to reconnect to Firebase...");
            handleFirebaseConnectionStatus(true)
                .then(() => {
                    setConnectionError(false);
                    setError('');
                })
                .catch(err => {
                    console.error("Failed to reconnect:", err);
                });
        };

        const handleOffline = () => {
            console.log("App is offline. Disabling Firebase network...");
            handleFirebaseConnectionStatus(false);
            setConnectionError(true);
            setError("You are offline. Please check your internet connection.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            handleFirebaseConnectionStatus(true).catch(console.error);
        };
    }, []);

    // Subscribe to logs
    useEffect(() => {
        let unsubscribeAll = () => {};
        let unsubscribeToday = () => {};

        if (!connectionError) {
            try {
                unsubscribeAll = subscribeToLogs(
                    (fetchedLogs) => {
                        setLogs(fetchedLogs);
                        setLoading(false);
                    }, 
                    handleFirebaseError
                );
                
                unsubscribeToday = getTodayLogs(
                    (fetchedTodayLogs) => {
                        setTodayLogs(fetchedTodayLogs);
                    },
                    handleFirebaseError
                );
            } catch (err) {
                console.error("Error setting up subscriptions:", err);
                handleFirebaseError(err);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
        
        return () => {
            if (typeof unsubscribeAll === 'function') {
                unsubscribeAll();
            }
            if (typeof unsubscribeToday === 'function') {
                unsubscribeToday();
            }
        };
    }, [connectionError]);

    // Animate elements on mount
    useEffect(() => {
        if (logoRef.current) {
            d3.select(logoRef.current)
                .style("opacity", 0)
                .style("transform", "translateY(-20px)")
                .transition()
                .duration(800)
                .style("opacity", 1)
                .style("transform", "translateY(0)");
        }
        
        if (mainFormRef.current) {
            d3.select(mainFormRef.current)
                .style("opacity", 0)
                .style("transform", "translateY(20px)")
                .transition()
                .delay(300)
                .duration(800)
                .style("opacity", 1)
                .style("transform", "translateY(0)");
        }
        
        if (workLogsRef.current) {
            d3.select(workLogsRef.current)
                .style("opacity", 0)
                .style("transform", "translateY(20px)")
                .transition()
                .delay(600)
                .duration(800)
                .style("opacity", 1)
                .style("transform", "translateY(0)");
        }
    }, []);

    // Animate log cards when they appear or change
    useEffect(() => {
        d3.selectAll(".log-card")
            .style("opacity", 0)
            .style("transform", "translateX(-20px)")
            .transition()
            .duration(500)
            .delay((d, i) => i * 100)
            .style("opacity", 1)
            .style("transform", "translateX(0)");
    }, [todayLogs]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name' && currentUser) return;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.jobName.trim()) {
            setError('Job name is required');
            return;
        }

        const nameToSave = currentUser ? currentUser.displayName : formData.name;

        try {
            await addLog({
                ...formData,
                name: nameToSave,
                time: formData.time
            });

            setFormData({
                name: currentUser ? currentUser.displayName : '',
                jobName: '',
                jobDescription: '',
                time: formatDateTimeForInput(new Date()),
                duration: 1
            });

            setError('');
        } catch (err) {
            console.error("Error adding document: ", err);
            setError('Failed to add log. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteLog(id);
        } catch (err) {
            console.error("Error deleting document: ", err);
            setError('Failed to delete log. Please try again.');
        }
    };

    const openJobDetails = (job) => {
        setSelectedJob(job);
        setEditFormData({
            name: job.name || '',
            jobName: job.jobName,
            jobDescription: job.jobDescription,
            time: formatDateTimeForInput(new Date(job.time)),
            duration: job.duration
        });
        setIsEditMode(false);
        setShowPopup(true);
    };

    const closeJobDetails = () => {
        setShowPopup(false);
        setIsEditMode(false);
        setTimeout(() => {
            setSelectedJob(null);
            setEditFormData({});
        }, 300);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name' && currentUser && selectedJob?.name === currentUser.displayName) return;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const enterEditMode = () => {
        setIsEditMode(true);
    };

    const saveEditedJob = async () => {
        if (!editFormData.jobName.trim()) {
            setError('Job name is required');
            return;
        }

        const nameToUpdate = currentUser ? currentUser.displayName : editFormData.name;

        try {
            await updateLog(selectedJob.id, {
                ...editFormData,
                name: nameToUpdate,
                time: editFormData.time
            });
            setError('');
            setIsEditMode(false);
            
            setSelectedJob({
                ...selectedJob,
                ...editFormData,
                name: nameToUpdate
            });
        } catch (err) {
            console.error("Error updating document: ", err);
            setError('Failed to update log. Please try again.');
        }
    };

    const cancelEdit = () => {
        setEditFormData({
            name: selectedJob.name || '',
            jobName: selectedJob.jobName,
            jobDescription: selectedJob.jobDescription,
            time: formatDateTimeForInput(new Date(selectedJob.time)),
            duration: selectedJob.duration
        });
        setIsEditMode(false);
        setError('');
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Job Name', 'Job Description', 'Time', 'Duration (hours)'];
        
        const csvData = logs.map(log => [
            log.name,
            log.jobName,
            log.jobDescription,
            log.time,
            log.duration
        ]);

        csvData.unshift(headers);
        
        const csvString = csvData.map(row =>
            row.map(cell =>
                cell !== null && cell !== undefined
                    ? `"${String(cell).replace(/"/g, '""')}"`
                    : '""'
            ).join(',')
        ).join('\n');

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
        <div id="appContainer" className="modern-theme" style={{ backgroundColor: 'white' }}>
            {/* --- Top Banner for Auth --- */}
            <div className="top-banner">
                <div className="auth-controls">
                    {currentUser ? (
                        <>
                            <span className="user-greeting">Hi, {currentUser.displayName}!</span>
                            <button onClick={signOutUser} className="btn btn-secondary btn-sm">Logout</button>
                        </>
                    ) : (
                        <button onClick={signInWithGoogle} className="btn btn-primary btn-sm">Login with Google</button>
                    )}
                </div>
            </div>

            <div id="mainContent">
                <div className="header-section" ref={logoRef}>
                    <div className="logo-title-container">
                        <img src={logo} alt="Work Logger Logo" className="logo animated-logo" />
                        <h1 className="app-title">Work Logger</h1>
                    </div>
                </div>
                
                <div id="mainform" className="card glass-effect" ref={mainFormRef}>
                    <h2 className="card-title">Add New Work Log</h2>

                    {error && <div className="error-message animated-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Person Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder={currentUser ? "Using Google account name" : "Enter person name"}
                                    readOnly={!!currentUser}
                                />
                            </div>

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
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Add Work Log
                        </button>
                    </form>
                </div>

                <div id="worklogs" className="card glass-effect" ref={workLogsRef}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="card-title">Today's Work Logs</h2>

                        {logs.length > 0 && (
                            <button onClick={exportToCSV} className="btn btn-success pulse-animation">
                                Export to CSV
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Loading your logs...</p>
                        </div>
                    ) : todayLogs.length > 0 ? (
                        <div className="logs-container">
                            {todayLogs.map(log => (
                                <div key={log.id} className="log-card">
                                    <div className="log-header" onClick={() => openJobDetails(log)}>
                                        <h3 className="job-name">{log.jobName}</h3>
                                        {log.name && <div className="log-person">By: {log.name}</div>}
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

                <footer className="footer glass-effect">
                    <p>Work Logger App {new Date().getFullYear()} | <a href="https://github.com/willzjc/workloggerdemo">GitHub Repository</a></p>
                </footer>
            </div>

            {connectionError && (
                <div className="connection-error-banner">
                    <p>
                        <strong>Connection Error:</strong> Unable to connect to the database. 
                        Some features may be unavailable. 
                        <button 
                            onClick={() => {
                                handleFirebaseConnectionStatus(true)
                                    .then(() => {
                                        setConnectionError(false);
                                        setError('');
                                    })
                                    .catch(err => console.error("Reconnection failed:", err));
                            }}
                            className="btn btn-sm btn-primary ml-2"
                        >
                            Try Again
                        </button>
                    </p>
                </div>
            )}

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
                                        <h3 className="field-label">Person Name</h3>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditChange}
                                            className="form-control"
                                            readOnly={!!currentUser && selectedJob?.name === currentUser.displayName}
                                        />
                                    </div>
                                    
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
                                    {selectedJob.name && (
                                        <div className="field-group">
                                            <h3 className="field-label">Person Name</h3>
                                            <p className="field-value">{selectedJob.name}</p>
                                        </div>
                                    )}
                                    
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
                                        style={{ marginRight: '3px' }}
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
                                        style={{ marginRight: '3px' }}
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