const { exec, execSync } = require('child_process');

// 检测 Python 可执行命令
let pythonCommand;
try {
    execSync('python3 --version', { stdio: 'ignore' }); // 尝试运行 python3
    pythonCommand = 'python3';
} catch {
    try {
        execSync('python --version', { stdio: 'ignore' }); // 尝试运行 python
        pythonCommand = 'python';
    } catch {
        console.error('Error: Neither "python3" nor "python" was found on this system.');
        process.exit(1); // 退出程序
    }
}

// 启动 Flask 后端
const flask = exec(`${pythonCommand} ../src/flaskAPI/api.py`);
flask.stdout.on('data', (data) => console.log(`[Flask] ${data}`));
flask.stderr.on('data', (data) => console.error(`[Flask Error] ${data}`));
