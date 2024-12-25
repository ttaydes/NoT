import logging
import os
import subprocess
import signal

global node_process

node_process = None
 
node_process = subprocess.Popen(['node', '../wscf/wsReceiver.js',li,lp])  # 启动一个新的 Node.js 进程
    


print(node_process)
    
