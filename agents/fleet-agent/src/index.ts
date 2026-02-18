import axios from 'axios';
import * as si from 'systeminformation';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Configuration
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3001';
const AGENT_ID_FILE = path.join(process.cwd(), 'agent-id.txt');
const POLL_INTERVAL = 5000; // 5 seconds

// State
let agentId: string | null = null;

// Utils
function getOrGenerateAgentId(): string {
    if (fs.existsSync(AGENT_ID_FILE)) {
        return fs.readFileSync(AGENT_ID_FILE, 'utf-8').trim();
    }
    const newId = `agent-${Math.random().toString(36).substr(2, 9)}`;
    fs.writeFileSync(AGENT_ID_FILE, newId);
    return newId;
}

async function registerAgent() {
    try {
        const osInfo = await si.osInfo();
        const networkInterfaces = await si.networkInterfaces();

        // safe cast or extraction
        const ip = Array.isArray(networkInterfaces)
            ? networkInterfaces.find(i => !i.internal && i.ip4)?.ip4
            : 'unknown';

        console.log(`Registering agent ${agentId} with ${ORCHESTRATOR_URL}...`);

        await axios.post(`${ORCHESTRATOR_URL}/agent/register`, {
            id: agentId,
            hostname: osInfo.hostname,
            platform: osInfo.platform,
            arch: osInfo.arch,
            distro: osInfo.distro,
            ip: ip
        });

        console.log('Registration successful');
    } catch (error) {
        console.error('Registration failed:', error instanceof Error ? error.message : error);
    }
}

async function sendHeartbeat() {
    if (!agentId) return;

    try {
        await axios.post(`${ORCHESTRATOR_URL}/agent/heartbeat`, {
            id: agentId,
            timestamp: new Date().toISOString()
        });
        // console.log('Heartbeat sent');
    } catch (error) {
        console.error('Heartbeat failed:', error instanceof Error ? error.message : error);
    }
}

async function main() {
    agentId = getOrGenerateAgentId();
    console.log(`Agent starting. ID: ${agentId}`);

    // Initial Registration
    await registerAgent();

    // Heartbeat Loop
    setInterval(sendHeartbeat, POLL_INTERVAL);
}

main().catch(console.error);
