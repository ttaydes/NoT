from zeroconf import Zeroconf, ServiceInfo
import socket
import psutil




def publish_service():
    desc = {'version': '0.1', 'name': 'NoT0.1'}   
    service_name = f"_demo222._http._tcp.local."

    info = ServiceInfo(
        "_http._tcp.local.",
        service_name,
        addresses=[socket.inet_aton('1.1.2.2')],  # 本地 IP 地址
        port=5000,
        properties=desc,
        server="NoT0.1.local."
    )

    zeroconf = Zeroconf()
    zeroconf.register_service(info)
    print("Service published")

    try:
        input("Press enter to exit...\n\n")
    finally:
        zeroconf.unregister_service(info)
        zeroconf.close()

publish_service()
