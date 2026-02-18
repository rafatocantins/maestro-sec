import express from 'express';

import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

interface Device {
    id: string;
    hostname: string;
    platform: string;
    arch: string;
    distro: string;
    ip: string;
    lastSeen: string;
    status: 'online' | 'offline';
}

const devices = new Map<string, Device>();

app.get('/health', (req, res) => {
    res.json({ status: 'ok', component: 'orchestrator' });
});

app.post('/agent/register', (req, res) => {
    const { id, hostname, platform, arch, distro, ip } = req.body;
    if (!id) {
        res.status(400).json({ error: 'Missing agent ID' });
        return;
    }

    const device: Device = {
        id,
        hostname,
        platform,
        arch,
        distro,
        ip,
        lastSeen: new Date().toISOString(),
        status: 'online'
    };

    devices.set(id, device);
    console.log(`Agent registered: ${id} (${hostname})`);
    res.json({ status: 'registered', id });
});

app.post('/agent/heartbeat', (req, res) => {
    const { id } = req.body;
    if (!id || !devices.has(id)) {
        res.status(404).json({ error: 'Agent not found or invalid' });
        return;
    }

    const device = devices.get(id)!;
    device.lastSeen = new Date().toISOString();
    device.status = 'online';

    // console.log(`Heartbeat from: ${id}`);
    res.json({ status: 'ok' });
});

app.get('/fleet/devices', (req, res) => {
    const deviceList = Array.from(devices.values());
    res.json(deviceList);
});

app.listen(port, () => {
    console.log(`Orchestrator running on port ${port}`);
});
