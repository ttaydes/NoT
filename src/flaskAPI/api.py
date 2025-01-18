from flask import Flask,request,jsonify,send_from_directory
from flask_cors import *
from flask_socketio import SocketIO, emit
import zeroconfLocal
import socket
import psutil
import threading
import logging
import nodeServ
import os


app = Flask(__name__, static_folder="../pages/NoT-web/dist")
CORS(app, supports_credentials=True)


socketio = SocketIO(app,cors_allowed_origins="*") # socketio持续通信更新设备列表

global IFSTART
IFSTART = False


node_process = None  #存储node进程
#register a zeroconf instance



@app.route('/')
def serve_index():
    
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/getlocalip", methods=["GET"])

def getlocalip():
    
    # 获取所有网络接口的 IP 地址
    ip_addresses = []

    # 获取本机的网络接口信息
    try:

        for iface, addrs in psutil.net_if_addrs().items():
            has_ipv4 = False

            for addr in addrs: 

                temp_addr = ""

                if addr.family == socket.AF_INET  and not addr.address.startswith("127"):
                    temp_addr  += addr.address

                    has_ipv4 = True
  
                if addr.family == socket.AF_INET6:
                    if has_ipv4 and not addr.address.startswith("fe80"):  # 如果当前接口已经有 IPv4 地址 并且监测可通信的ipv6   
                        temp_addr += addr.address

                ip_addresses.append(temp_addr)# 查找对应的 IPv6 地址
                        


    except Exception as e:
        return e
                
    return jsonify({'localIPs':ip_addresses})


@app.route('/api/serv', methods=['GET'])
def serv():
    global IFSTART
    global node_process
    local_ip = request.args.get("ip")
    local_port = request.args.get("port")  #node服务开启的端口
    isopen = request.args.get("isopen")
    ipv4 = True

    if ":" in local_ip:  # 如果包含冒号，说明是 IPv6 地址
        ipv4 = False

    else:  # 否则是 IPv4 地址
        ipv4 = True
    if not local_ip:    
        return jsonify({'message': 'IP address is required', 'status': 'error'}), 400

    desc = {'version': '0.1', 'name': 'NoT0.1', "node_port":local_port}

    prot = [socket.inet_pton(socket.AF_INET,local_ip)] if ipv4 else [socket.inet_pton(socket.AF_INET6,local_ip)]

    info = zeroconfLocal.ServiceInfo(
        "_http._tcp.local.",
        f"_{socket.gethostname()}._http._tcp.local.",
        addresses=prot,  # 本地 IP 地址
        port=5000,    #指的是发布服务所在端口
        properties=desc,
        server="NoT0.1.local."
       
    )

 
    # 开启服务
    if isopen == '1' and not IFSTART:
        IFSTART = True
    

        th_node_start = threading.Thread(target=nodeServ.start_nodeserve,args=(local_ip,local_port))
        th_node_start.start()
        th_node_start.join()
        
        th_start = threading.Thread(target=zeroconfLocal.start_service, args=(info,))
        th_start.start()
        th_start.join()

        return jsonify({
            'message': 'Service started successfully',
            'status_id': 1
        })

    # 关闭服务
    elif isopen == '0' and IFSTART:
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
    elif isopen == '0' and not IFSTART:
        return jsonify({
            'message': 'Service is already stopped',
            'status_id': 3
        })

    #服务开启 多次调用
    elif isopen == '1' and IFSTART:
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
        zeroconfLocal.browser        
        socketio.sleep(4) #加事件缓冲

        while LISTEN_IFSTART:
            try:
            
                logging.warning(f"Sending device list: {zeroconfLocal.listener.local_online_device}")  # 打印发送的数据
                """
                    这里没做判读即与上一次发生变换做对比 不一样才会发送
                    现在是一直发送比较消耗资源
                    bug后面再改现在能跑
                """
                socketio.emit('device_list', {'online_device': zeroconfLocal.listener.local_online_device})
                last_flash_list = zeroconfLocal.listener.local_online_device  # 更新最后一次的设备列表
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

        return jsonify({
        'online_devices': zeroconfLocal.listener.local_online_device,
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


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)




if __name__ == "__main__":
    socketio.run(app,host="0.0.0.0", port=5001)