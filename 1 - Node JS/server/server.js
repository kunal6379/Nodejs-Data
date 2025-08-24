const express = require('express');
const { exec } = require('child_process');
const os = require('os');
const app = express();
const PORT = 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Helper function to execute Windows commands
const executeCommand = (command, callback) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return callback(error, null);
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Output: ${stdout}`);
        callback(null, stdout);
    });
};

// Helper function to broadcast message using Windows msg command
const broadcastMessage = (message, callback) => {
    // Use msg command to send message to all sessions
    const command = `msg * "${message}"`;
    executeCommand(command, callback);
};

// Status endpoint - check if machine is online
app.get('/status', (req, res) => {
    const systemInfo = {
        status: 'online',
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        timestamp: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'System is online',
        data: systemInfo
    });
});

// Shutdown endpoint
app.get('/shutdown', (req, res) => {
    const { message, delay = 30 } = req.query;
    
    // Broadcast message if provided
    if (message) {
        broadcastMessage(`SYSTEM SHUTDOWN: ${message}`, (err) => {
            if (err) console.error('Failed to broadcast message:', err);
        });
    }
    
    // Send response before shutdown
    res.json({
        success: true,
        message: `System will shutdown in ${delay} seconds`,
        broadcastMessage: message || 'No message',
        timestamp: new Date().toISOString()
    });
    
    // Execute shutdown command with delay
    const shutdownCommand = `shutdown /s /t ${delay} /c "System shutdown requested via API"`;
    
    setTimeout(() => {
        executeCommand(shutdownCommand, (error, output) => {
            if (error) {
                console.error('Shutdown failed:', error);
            } else {
                console.log('Shutdown initiated:', output);
            }
        });
    }, 1000);
});

// Restart endpoint
app.get('/restart', (req, res) => {
    const { message, delay = 30 } = req.query;
    
    // Broadcast message if provided
    if (message) {
        broadcastMessage(`SYSTEM RESTART: ${message}`, (err) => {
            if (err) console.error('Failed to broadcast message:', err);
        });
    }
    
    // Send response before restart
    res.json({
        success: true,
        message: `System will restart in ${delay} seconds`,
        broadcastMessage: message || 'No message',
        timestamp: new Date().toISOString()
    });
    
    // Execute restart command with delay
    const restartCommand = `shutdown /r /t ${delay} /c "System restart requested via API"`;
    
    setTimeout(() => {
        executeCommand(restartCommand, (error, output) => {
            if (error) {
                console.error('Restart failed:', error);
            } else {
                console.log('Restart initiated:', output);
            }
        });
    }, 1000);
});

// Cancel shutdown/restart endpoint
app.get('/cancel', (req, res) => {
    const cancelCommand = 'shutdown /a';
    
    executeCommand(cancelCommand, (error, output) => {
        if (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to cancel shutdown/restart',
                error: error.message
            });
        } else {
            res.json({
                success: true,
                message: 'Shutdown/restart cancelled successfully',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Broadcast message endpoint
app.get('/broadcast', (req, res) => {
    const { message } = req.query;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Message parameter is required. Use: /broadcast?message=your_message'
        });
    }
    
    broadcastMessage(message, (error, output) => {
        if (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to broadcast message',
                error: error.message
            });
        } else {
            res.json({
                success: true,
                message: 'Message broadcasted successfully',
                broadcastMessage: message,
                timestamp: new Date().toISOString()
            });
        }
    });
});

// System info endpoint
app.get('/info', (req, res) => {
    const systemInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        networkInterfaces: Object.keys(os.networkInterfaces()),
        timestamp: new Date().toISOString()
    };
    
    res.json({
        success: true,
        data: systemInfo
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Windows Control API Server running on port ${PORT}`);
    console.log(`Available endpoints (all GET requests for browser usage):`);
    console.log(`  GET  http://localhost:${PORT}/status - Check system status`);
    console.log(`  GET  http://localhost:${PORT}/info - Get system information`);
    console.log(`  GET  http://localhost:${PORT}/health - Health check`);
    console.log(`  GET  http://localhost:${PORT}/shutdown?delay=30&message=text - Shutdown system`);
    console.log(`  GET  http://localhost:${PORT}/restart?delay=30&message=text - Restart system`);
    console.log(`  GET  http://localhost:${PORT}/cancel - Cancel shutdown/restart`);
    console.log(`  GET  http://localhost:${PORT}/broadcast?message=text - Broadcast message`);
});