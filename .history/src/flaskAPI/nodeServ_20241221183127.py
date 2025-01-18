import logging
import os
import subprocess
import signal

def start_nodeserve():
    global node_process
    if not node_process:

        try:        
            node_process = subprocess.Popen(['node', '../wscf/wsReceiver.js'])  # 启动一个新的 Node.js 进程
        
        except Exception as e:
            logging.warning(e)


def close_nodeserve():     
            # 终止正在运行的 Node.js 进程

    if node_process:
        os.kill(node_process.pid, signal.SIGINT)  # 发送 SIGINT 信号终止进程
        node_process = None  # 清空进程引用
