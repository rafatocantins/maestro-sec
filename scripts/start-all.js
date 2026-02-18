const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'orchestrator', cwd: 'services/orchestrator', command: 'npm', args: ['run', 'start'] }, // Assumes build first or ts-node
    { name: 'agent', cwd: 'agents/fleet-agent', command: 'npm', args: ['run', 'dev'] },
    { name: 'ui', cwd: 'apps/ui', command: 'npm', args: ['run', 'dev'] }
];

services.forEach(service => {
    const child = spawn(service.command, service.args, {
        cwd: path.resolve(__dirname, '..', service.cwd),
        shell: true,
        stdio: 'inherit'
    });

    child.on('error', (err) => {
        console.error(`[${service.name}] Error:`, err);
    });

    child.on('close', (code) => {
        console.log(`[${service.name}] Exited with code ${code}`);
    });
});
