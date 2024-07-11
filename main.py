from flask import Flask, render_template, request, jsonify
from model.audio import Audio_generate
import os, time
import base64
import soundfile

app = Flask(__name__, static_folder="./static")

# 存储对话内容的列表
chat_history = []
selected_model = "7B"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/select_model', methods=['POST'])
def select_model():
    global selected_model
    data = request.get_json()
    selected_model = data.get('model', '')
    print(f"change model to {selected_model}")
    return jsonify({'selected_model': selected_model})

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    message = data.get('message', '')
    attachment = data.get('attachment', '')
    attachment_type = data.get('attachment_type', '')

    if message:
        chat_history.append({'sender': 'User', 'content': message, 'type': 'text'})
    if attachment:
        chat_history.append({'sender': 'User', 'content': attachment, 'type': attachment_type})

    # 将消息和附件添加到对话历史中
    if message or attachment:
        response_message = ""
        if message:
            response_message += f"Echo: {message}"
        if attachment:
            response_message += f"response_attachment"

        # 生成音频
        audio_filename = f"audio_response-{len(chat_history)}-{int(time.time()*10)}"
        audio_url = f"/static/audio/{audio_filename}.wav"
        audio_data = Audio_generate([response_message])[0]
        soundfile.write(f".{audio_url}", audio_data[0], 24000)
    
        
        chat_history.append({'sender': 'Bot', 'content': response_message, 'type': 'text', 'audio': audio_url})

    return jsonify(chat_history=chat_history)

import argparse
from gevent import pywsgi  
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', type=str, default="127.0.0.1")

    args = parser.parse_args()
    
    app.run(debug=True, host=args.host)
    
    # server = pywsgi.WSGIServer((args.host, 5000), app, )  
    # server.serve_forever()