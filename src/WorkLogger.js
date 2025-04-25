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
    const [selectedJob, setSelectedJob] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

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
        setShowPopup(true);
    };

    // Function to close job details popup
    const closeJobDetails = () => {
        setShowPopup(false);
        setTimeout(() => {
            setSelectedJob(null);
        }, 300); // Delay clearing the selected job until after animation
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

    // Popup styling with animation and glassmorphism
    const popupStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', // For Safari
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            opacity: showPopup ? 1 : 0,
            transition: 'opacity 0.3s ease',
        },
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '0.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '32rem',
            margin: '0 auto',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            transform: showPopup ? 'translateY(0)' : 'translateY(20px)',
            transition: 'transform 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.18)'
        },
        header: {
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(248, 250, 252, 0.8)'
        },
        headerTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '1.5rem',
            padding: '0.25rem',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
            ':hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
            }
        },
        body: {
            padding: '1.5rem',
            overflowY: 'auto',
            flexGrow: 1
        },
        footer: {
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(229, 231, 235, 0.5)',
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            textAlign: 'right'
        },
        footerButton: {
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        fieldGroup: {
            marginBottom: '1.25rem'
        },
        fieldLabel: {
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#64748b',
            marginBottom: '0.25rem',
            display: 'block'
        },
        fieldValue: {
            fontSize: '1rem',
            color: '#0f172a',
            marginTop: '0.25rem',
            lineHeight: '1.5'
        }
    };

    return (
        <div id="appContainer" style={{ position: 'relative' }}>
            <div id="mainContent" style={{ padding: '1.5rem', maxWidth: '64rem', margin: '0 auto', transition: 'filter 0.3s ease' }}>
                {/* Add the logo above the title */}
                <img src={logo} alt="Work Logger Logo" style={{ margin: '0 auto', marginBottom: '1rem', height: '3rem', display: 'block' }} />
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Work Logger</h1>

                {/* Add new work log form */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Add New Work Log</h2>

                    {error && <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '1rem', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Job Name *</label>
                                <input
                                    type="text"
                                    name="jobName"
                                    value={formData.jobName}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    placeholder="Enter job name"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Time</label>
                                <input
                                    type="datetime-local"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Job Description</label>
                                <textarea
                                    name="jobDescription"
                                    value={formData.jobDescription}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    placeholder="Enter job description"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Duration (hours)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    min="0.25"
                                    step="0.25"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{
                                marginTop: '1rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                transition: 'background-color 0.2s ease'
                            }}
                        >
                            Add Work Log
                        </button>
                    </form>
                </div>

                {/* Display today's logs */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Today's Work Logs</h2>

                        {logs.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                style={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                    transition: 'background-color 0.2s ease'
                                }}
                            >
                                Export to CSV
                            </button>
                        )}
                    </div>

                    {todayLogs.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                        <th style={{ border: '1px solid #e5e7eb', padding: '0.5rem', textAlign: 'left' }}>Job Name</th>
                                        <th style={{ border: '1px solid #e5e7eb', padding: '0.5rem', textAlign: 'left' }}>Description</th>
                                        <th style={{ border: '1px solid #e5e7eb', padding: '0.5rem', textAlign: 'left' }}>Time</th>
                                        <th style={{ border: '1px solid #e5e7eb', padding: '0.5rem', textAlign: 'left' }}>Duration (hrs)</th>
                                        <th style={{ border: '1px solid #e5e7eb', padding: '0.5rem', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ border: '1px solid #e5e7eb', padding: '0.5rem' }}>
                                                <button
                                                    onClick={() => openJobDetails(log)}
                                                    style={{
                                                        color: '#2563eb',
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        textDecoration: 'none',
                                                        fontWeight: '500',
                                                        position: 'relative',
                                                        display: 'inline-block'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.textDecoration = 'underline';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.textDecoration = 'none';
                                                    }}
                                                >
                                                    {log.jobName}
                                                </button>
                                            </td>
                                            <td style={{ border: '1px solid #e5e7eb', padding: '0.5rem' }}>{log.jobDescription}</td>
                                            <td style={{ border: '1px solid #e5e7eb', padding: '0.5rem' }}>{formatDate(log.time)}</td>
                                            <td style={{ border: '1px solid #e5e7eb', padding: '0.5rem' }}>{log.duration}</td>
                                            <td style={{ border: '1px solid #e5e7eb', padding: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleDelete(log.id)}
                                                    style={{
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.375rem',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
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
                        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No work logs for today. Add your first log above.</p>
                    )}
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    <p>Work Logger App {new Date().getFullYear()} | <a href="https://github.com/willzjc/workloggerdemo" style={{ textDecoration: 'underline' }}>GitHub Repository</a></p>
                </footer>
            </div>

            {/* Full-screen popup for job details with blur effect and animations */}
            {showPopup && selectedJob && (
                <div style={popupStyles.overlay}>
                    <div style={popupStyles.container}>
                        <div style={popupStyles.header}>
                            <h2 style={popupStyles.headerTitle}>Job Details</h2>
                            <button
                                onClick={closeJobDetails}
                                style={popupStyles.closeButton}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={popupStyles.body}>
                            <div>
                                <div style={popupStyles.fieldGroup}>
                                    <h3 style={popupStyles.fieldLabel}>Job Name</h3>
                                    <p style={popupStyles.fieldValue}>{selectedJob.jobName}</p>
                                </div>
                                <div style={popupStyles.fieldGroup}>
                                    <h3 style={popupStyles.fieldLabel}>Time</h3>
                                    <p style={popupStyles.fieldValue}>{formatDate(selectedJob.time)}</p>
                                </div>
                                <div style={popupStyles.fieldGroup}>
                                    <h3 style={popupStyles.fieldLabel}>Duration</h3>
                                    <p style={popupStyles.fieldValue}>{selectedJob.duration} hours</p>
                                </div>
                                <div style={popupStyles.fieldGroup}>
                                    <h3 style={popupStyles.fieldLabel}>Description</h3>
                                    <div style={{ ...popupStyles.fieldValue, whiteSpace: 'pre-wrap' }}>
                                        {selectedJob.jobDescription || "No description provided."}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={popupStyles.footer}>
                            <button
                                onClick={closeJobDetails}
                                style={popupStyles.footerButton}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#3b82f6';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}