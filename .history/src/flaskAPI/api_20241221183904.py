from flask import Flask,request,jsonify
from flask_cors import *
from flask_socketio import SocketIO, emit
import zeroconfLocal
import socket
import psutil
import threading
import logging
import nodeServ

app = Flask(__name__)
CORS(app, supports_credentials=True)


socketio = SocketIO(app,cors_allowed_origins="*") # socketio持续通信更新设备列表

global IFSTART
IFSTART = False
node_process = None  #存储node进程
listener = zeroconfLocal.MyListener()
#register a zeroconf instance





@app.route("/api/getlocalip", methods=["GET"])

def getlocalip():
    
    # 获取所有网络接口的 IP 地址
    ip_addresses = []
    
    # 获取本机的网络接口信息
    try:

        for iface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family == socket.AF_INET and not addr.address.startswith("127"):
                    ip_addresses.append(addr.address)
    
    except Exception as e:
        return e
                
    return jsonify({'localIPs':ip_addresses})


@app.route('/api/serv', methods=['GET'])
def serv():
    global IFSTART

    local_ip = request.args.get("ip")
    isopen = request.args.get("isopen")

    if not local_ip:
        return jsonify({'message': 'IP address is required', 'status': 'error'}), 400

    desc = {'version': '0.1', 'name': 'NoT0.1'}
    info = zeroconfLocal.ServiceInfo(
        "_http._tcp.local.",
        f"_{socket.gethostname()}._http._tcp.local.",
        addresses=[socket.inet_aton(local_ip)],  # 本地 IP 地址
        port=5000,
        properties=desc,
        server="NoT0.1.local."
    )

 
    # 开启服务
    if isopen == '1' and not IFSTART and not node_process:
        IFSTART = True
  
        th_node_start = threading.Thread(target=nodeServ.start_nodeserve)
        th_node_start.start()
        th_node_start.join()
        
        th_start = threading.Thread(target=zeroconfLocal.start_service, args=(info,))
        th_start.start()
        th_start.join()
        return jsonify({
            'message': 'Service started successfully',
            'status_id': 1,
            'ip': local_ip,
            'port': 5000
        })

    # 关闭服务
    elif isopen == '0' and IFSTART and node_process:
        IFSTART = False

        th_node_start = threading.Thread(target=nodeServ.close_nodeserve)
        th_node_start.start()
        th_node_start.join()
        
        th_stop = threading.Thread(target=zeroconfLocal.stop_service, args=(info,))
        th_stop.start()
        th_stop.join()

        return jsonify({
            'message': 'Service stopped successfully',
            'status_id': 2
        })

    #服务关闭 并且已经关闭
    elif isopen == '0' and not IFSTART and not node_process:
        return jsonify({
            'message': 'Service is already stopped',
            'status_id': 3
        })

    #服务开启 多次调用
    elif isopen == '1' and IFSTART and node_process:
        return jsonify({
            'message': 'Service is already started',
            'status_id': 1 
        })

"""
监听路由模块
"""
    


global LISTEN_IFSTART
LISTEN_IFSTART = False

# 启动监听服务
def listen_for_services():
    global LISTEN_IFSTART
    try:
        last_flash_list =  []
        # 创建服务浏览器，监听局域网内的所有 _http._tcp.local. 服务
        browser = zeroconfLocal.ServiceBrowser(zeroconfLocal.zeroconfins, "_http._tcp.local.", listener)
        
        socketio.sleep(4) #加事件缓冲

        while LISTEN_IFSTART:
            try:
            
                logging.warning(f"Sending device list: {listener.local_online_device}")  # 打印发送的数据
                """
                    这里没做判读即与上一次发生变换做对比 不一样才会发送
                    现在是一直发送比较消耗资源
                    bug后面再改现在能跑
                """
                socketio.emit('device_list', {'online_device': listener.local_online_device})
                last_flash_list = listener.local_online_device  # 更新最后一次的设备列表
                socketio.sleep(1)  # 每1秒钟推送一次
            except Exception as e:
                logging.ERROR(e)
                LISTEN_IFSTART = False

    except Exception as e:
        logging.error(f"Error while listening for services: {e}")
  


@app.route("/api/listenserver", methods=["GET"])
def listenserver():
    global LISTEN_IFSTART
   
    listen_start = request.args.get('ls')
    if listen_start == '1' and not LISTEN_IFSTART:
        
        LISTEN_IFSTART = True
     
   
        listen_thread= threading.Thread(target=listen_for_services, daemon=True)
        listen_thread.start()
      
        return jsonify({
            'message': 'Service listener started',
            'status': '1'
        })
       
    
    elif listen_start == '1' and LISTEN_IFSTART:
        LISTEN_IFSTART = False
   
    elif listen_start == '0' and LISTEN_IFSTART:
        LISTEN_IFSTART = False
        listener.local_online_device = []

        return jsonify({
        'online_devices': listener.local_online_device,
        'message': 'Service listener stopped',
        'status': '2'
    })
     
    elif listen_start == '0' and not LISTEN_IFSTART:
        LISTEN_IFSTART = False
        return jsonify({
            'message': 'Service listener is already stopped',
            'status': '2'
        })
    
    else:
        return jsonify({
            'message': 'Invalid parameter',
            'status': 'error'
        })

# WebSocket 路由：向前端推送在线设备列表
@socketio.on('connect')
def handle_connect():
    logging.warning("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    logging.warning("Client disconnected")


 


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)