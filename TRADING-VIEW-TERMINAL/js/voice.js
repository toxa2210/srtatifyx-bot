/**
 * Voice Module - голосовое управление через Web Speech API
 */

const VoiceControl = {
    recognition: null,
    isListening: false,
    
    /**
     * Инициализация голосового распознавания
     */
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('⚠️ Голосовое управление не поддерживается в этом браузере');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ru-RU';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voiceModal').classList.remove('hidden');
            document.getElementById('voiceText').textContent = 'Слушаю...';
            document.getElementById('voiceBtn').classList.add('recording');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            document.getElementById('voiceText').textContent = transcript;
            
            // Если результат финальный - выполнить команду
            if (event.results[event.results.length - 1].isFinal) {
                this.processCommand(transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Voice error:', event.error);
            this.stop();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            document.getElementById('voiceBtn').classList.remove('recording');
            setTimeout(() => {
                document.getElementById('voiceModal').classList.add('hidden');
            }, 1500);
        };
        
        return true;
    },

    
    /**
     * Запустить запись голоса
     */
    start() {
        if (!this.recognition) {
            const initialized = this.init();
            if (!initialized) {
                alert('Ваш браузер не поддерживает голосовое управление. Используйте Chrome или Edge.');
                return;
            }
        }
        if (this.isListening) {
            this.stop();
            return;
        }
        try {
            this.recognition.start();
        } catch(e) {
            console.error('Error starting recognition:', e);
        }
    },
    
    /**
     * Остановить запись
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    },
    
    /**
     * Обработать голосовую команду
     */
    async processCommand(transcript) {
        console.log('🎤 Команда:', transcript);
        document.getElementById('voiceText').textContent = `"${transcript}"`;
        
        // Передать команду в AI
        const response = await AIAssistant.processCommand(transcript);
        
        // Показать ответ
        App.addAIMessage('user', transcript);
        App.addAIMessage('ai', response);
        
        // Произнести ответ
        this.speak(response.replace(/<[^>]*>/g, '').substring(0, 100));
    },
    
    /**
     * Озвучить текст
     */
    speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 1;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
    }
};
