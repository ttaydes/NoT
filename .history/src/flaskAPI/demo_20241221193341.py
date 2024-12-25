import logging
import os
import subprocess
import signal

global node_process

node_process = None
 
node_process = subprocess.Popen(['node', '../wscf/wsReceiver.js',"192.168.1.127","1234"])  # 启动一个新的 Node.js 进程
    


print(node_process)
    
