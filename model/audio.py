

    
    
def Audio_generate(msg) :
    import ChatTTS

    params_infer_code = ChatTTS.Chat.InferCodeParams()
    
    chat = ChatTTS.Chat()
    chat.load()
    wavs = chat.infer(msg, use_decoder=True,params_infer_code=params_infer_code)
    return wavs





if __name__ == "__main__": 
    Audio_generate("test")