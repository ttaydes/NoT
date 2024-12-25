import logging
import os
import subprocess
import signal

global node_process

node_process = None
node_process_ef = None
def start_nodeserve(li,lp):
    global node_process
    global node_process_ef
    if not node_process and not node_process_ef:
        try:        
            node_process = subprocess.Popen(['node', '../wscf/wsControl.js',li,lp])  # 启动一个新的 Node.js 进程
        except Exception as e:
            logging.warning(e)


def close_nodeserve():     
            # 终止正在运行的 Node.js 进程
    global node_process
    global node_process_ef
    if node_process and node_process_ef:
        os.kill(node_process.pid, signal.SIGINT)  # 发送 SIGINT 信号终止进程
        node_process = None  # 清空进程引用
        os.kill(node_process_ef.pid,signal.SIGINT)
        node_process_ef = None
    
