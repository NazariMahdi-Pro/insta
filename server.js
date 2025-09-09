const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server); // اضافه کردن Socket.IO

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(bodyParser.json());
app.use(express.static(__dirname));

// دریافت برنامه‌ها
app.get('/api/plans', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading data file' });
        res.json(JSON.parse(data));
    });
});

// اضافه کردن برنامه جدید (POST هم با Socket.io همزمان)
app.post('/api/plans', (req, res) => {
    const newPlan = req.body;

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading data file' });
        const plans = JSON.parse(data);
        plans.push(newPlan);

        fs.writeFile(DATA_FILE, JSON.stringify(plans, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Error writing data file' });

            // اطلاع‌رسانی به همه کلاینت‌ها
            io.emit('newPlan', newPlan);

            res.json({ message: 'Plan added successfully' });
        });
    });
});

// اتصال Socket.IO
io.on('connection', (socket) => {
    console.log('یک کاربر وصل شد:', socket.id);
    socket.on('disconnect', () => {
        console.log('کاربر قطع شد:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
