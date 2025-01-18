import subprocess
import os


def check_python_version():
    try:
        # 检查 python3 是否可用
        result = subprocess.run(["python3", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "python3"
    except FileNotFoundError:
        pass  # python3 不存在

    try:
        # 如果 python3 不可用，检查 python 是否可用
        result = subprocess.run(["python", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "python"
    except FileNotFoundError:
        pass  # python 不存在

    return None  # 如果两者都不可用

def start_backend():
    python_command = check_python_version()
    if python_command:
        # 使用找到的 python 命令启动 Flask 后端
        subprocess.run([python_command, "../src/flaskAPI/api.py"])
    else:
        print("Python is not installed or cannot be found!")

if __name__ == "__main__":
    start_backend()