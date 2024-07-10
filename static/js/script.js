let isRecording = false;
let mediaRecorder;
let audioChunks = [];

function scrollDown(box) {
    box.scrollTop = box.scrollHeight;
}

function adjustInputHeight(input) {
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) - 20 + 'px';
    if (input.scrollHeight <= 100) {
        input.style.overflowY = 'hidden';
    } else {
        input.style.overflowY = 'scroll';
    }
    scrollDown(document.getElementById("chat-window"));
}

function sendMessage() {
    let messageInput = document.getElementById('message-input');
    let fileInput = document.getElementById('file-input');
    let message = messageInput.value;
    let attachment = '';
    let attachmentType = '';

    if (fileInput.files.length > 0) {
        let file = fileInput.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            attachment = reader.result;
            if (file.type.startsWith('image/')) {
                attachmentType = 'image';
            } else if (file.type.startsWith('audio/')) {
                attachmentType = 'audio';
            } else if (file.type.startsWith('video/')) {
                attachmentType = 'video';
            }  else {
                attachmentType = 'file';
            }
            sendToServer(message, attachment, attachmentType);
        };
    } else {
        sendToServer(message, attachment, attachmentType);
    }
    scrollDown(document.getElementById("chat-window"));
}

let allBotAudioControls = []; // 全局数组存储所有音频控件
function pause_audio(audioControl, playButton) {
    audioControl.pause();
    audioControl.currentTime = 0;
    playButton.textContent = ' ▶️';     
}
function start_audio(audioControl, playButton) {
    pause_all_audio();
    audioControl.play();
    playButton.textContent = ' ⏸';
}
function pause_all_audio() {
    allBotAudioControls.forEach(audio => {
        pause_audio(audio[0], audio[1]);
    });
}
function click_audio_button(audioControl, playButton) {
    if (audioControl.paused) {
        start_audio(audioControl, playButton);
    } else {
        pause_audio(audioControl, playButton);
    }
}
function sendToServer(message, attachment, attachmentType) {
    fetch('/send_message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message, attachment: attachment, attachment_type: attachmentType })
    })
    .then(response => response.json())
    .then(data => {
        // allBotAudioControls = [];
        pause_all_audio();
        let chatWindow = document.getElementById('chat-window');
        chatWindow.innerHTML = '';
        data.chat_history.forEach(chat => {
            let chatMessage = document.createElement('div');
            chatMessage.classList.add('chat-message');
            chatMessage.classList.add(chat.sender.toLowerCase());

            let avatar = document.createElement('img');
            avatar.classList.add('avatar');
            avatar.src = chat.sender === 'User' ? './static/images/user_avatar.png' : './static/images/bot_avatar.png'; // 请替换为实际头像路径
            chatMessage.appendChild(avatar);

            let content = document.createElement('div');
            content.classList.add('chat-message');
            content.classList.add('content');
            if (chat.type === 'image') {
                let img = document.createElement('img');
                img.src = chat.content;
                img.style.maxWidth = '100%';
                content.appendChild(img);
            } else if (chat.type === 'audio') {
                let audio = document.createElement('audio');
                audio.controls = true;
                let source = document.createElement('source');
                source.src = chat.content;
                source.type = 'audio/mpeg';
                audio.appendChild(source);
                content.appendChild(audio);
            } else if (chat.type === 'video') {
                let video = document.createElement('video');
                video.controls = true;
                let source = document.createElement('source');
                source.src = chat.content;
                source.type = 'video/mp4';
                video.appendChild(source);
                content.appendChild(video);
            } else if (chat.type === 'text') {
                content.textContent = chat.content;

                if (chat.audio) {
                    let playButton = document.createElement('span');
                    playButton.textContent = ' ▶';
                    playButton.style.cursor = 'pointer';
                    playButton.style.color = '#3498db';
                    playButton.style.marginLeft = '10px';

                    let audioControl = document.createElement('audio');
                    audioControl.src = chat.audio;
                    allBotAudioControls.push([audioControl, playButton]); // 将音频控件添加到全局数组
                    // console.log(allBotAudioControls.length);

                    playButton.onclick = () => {
                        click_audio_button(audioControl, playButton);
                    };
                    audioControl.addEventListener("ended", pause_all_audio);
                    content.appendChild(playButton);
                }
            } else {
                content.textContent = "received" + chat.type;
            }
            chatMessage.appendChild(content);

            chatWindow.appendChild(chatMessage);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
        document.getElementById('message-input').value = '';
        document.getElementById('file-input').value = '';
        adjustInputHeight(document.getElementById('message-input'));

        let last_answer = allBotAudioControls[allBotAudioControls.length-1];
        click_audio_button(last_answer[0], last_answer[1]);
    });
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    pause_all_audio();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                let audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                let reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onload = () => {
                    sendToServer('', reader.result, 'audio');
                };
                audioChunks = [];
            };  
            mediaRecorder.start();
            isRecording = true;
            document.querySelector('.record-button').style.backgroundColor = '#e74c3c';
        }).catch(error => {
            console.error("Error accessing microphone", error);
        });
    }else{
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.querySelector('.record-button').style.backgroundColor = '#3498db';
    }
}

function selectModel() {
    const model = document.getElementById('model-select').value;
    fetch('/select_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: model })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Model selected:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}