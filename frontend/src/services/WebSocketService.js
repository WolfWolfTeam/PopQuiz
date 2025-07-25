import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getAuthToken } from '../utils/auth';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  init() {
    if (this.connected || this.stompClient?.connected) return;

    try {
      const socket = new SockJS('/ws');
      this.stompClient = Stomp.over(socket);
      this.stompClient.debug = () => {};
      const token = getAuthToken();

      this.stompClient.connect(
          { 'Authorization': `Bearer ${token}` },
          this.onConnect.bind(this),
          this.onError.bind(this)
      );
    } catch (error) {
      console.error('WebSocket初始化失败:', error);
      this.scheduleReconnect();
    }
  }

  onConnect() {
    console.log('✅ WebSocket连接成功');
    this.connected = true;
    this.reconnectAttempts = 0;

    // 恢复所有订阅
    for (const [topic, callback] of this.subscriptions.entries()) {
      this._safeSubscribe(topic, callback);
    }

    this.subscribeToUserNotifications();
  }

  onError(error) {
    console.error('❌ WebSocket连接错误:', error);
    this.connected = false;
    this.stompClient = null;
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('⚠️ 已达到最大重连次数，停止尝试连接');
      return;
    }

    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`🔁 尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.init();
    }, delay);
  }

  subscribe(topic, callback) {
    this.subscriptions.set(topic, callback);

    // 延迟订阅，等连接建立好
    if (this.connected && this.stompClient?.connected) {
      return this._safeSubscribe(topic, callback);
    } else {
      this.init(); // 触发连接
      return null;
    }
  }

  _safeSubscribe(topic, callback) {
    try {
      return this.stompClient.subscribe(topic, (message) => {
        try {
          const parsed = JSON.parse(message.body);
          callback(parsed);
        } catch (e) {
          console.error('解析消息失败:', e);
        }
      });
    } catch (err) {
      console.error(`订阅 ${topic} 失败:`, err);
      return null;
    }
  }

  unsubscribe(topic) {
    if (this.connected && this.stompClient?.connected) {
      const sub = this.stompClient.subscription(topic);
      if (sub) sub.unsubscribe();
    }
    this.subscriptions.delete(topic);
  }

  unsubscribeAll() {
    if (this.connected && this.stompClient?.connected) {
      for (const topic of this.subscriptions.keys()) {
        const sub = this.stompClient.subscription(topic);
        if (sub) sub.unsubscribe();
      }
    }
    this.subscriptions.clear();
  }

  disconnect() {
    if (this.stompClient?.connected) {
      this.unsubscribeAll();
      this.stompClient.disconnect(() => {
        this.connected = false;
        this.stompClient = null;
        console.log('WebSocket已断开连接');
      });
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  subscribeToUserNotifications() {
    const topic = '/user/queue/notifications';
    this.subscribe(topic, (message) => {
      const event = new CustomEvent('userNotification', { detail: message });
      window.dispatchEvent(event);
      this.showDesktopNotification(message);
    });
  }

  subscribeQuizStats(quizId) {
    const topic = `/topic/quizzes/${quizId}/stats`;
    this.subscribe(topic, (message) => {
      const event = new CustomEvent('quizStatsUpdated', {
        detail: { quizId, stats: message }
      });
      window.dispatchEvent(event);
    });
  }

  subscribeLectureQuizzes(lectureId) {
    const topic = `/topic/lectures/${lectureId}/quizzes`;
    this.subscribe(topic, (message) => {
      const event = new CustomEvent('lectureQuizzesUpdated', {
        detail: { lectureId, quiz: message }
      });
      window.dispatchEvent(event);
    });
  }

  subscribeLecture(lectureId, callback = () => {}) {
    const topic = `/topic/lectures/${lectureId}`;
    return this.subscribe(topic, callback);
  }

  showDesktopNotification(message) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      this.createNotification(message);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          this.createNotification(message);
        }
      });
    }
  }

  createNotification(message) {
    const { title, body, icon } = message;
    const n = new Notification(title || 'PopQuiz 通知', {
      body: body || '您有一个新通知',
      icon: icon || '/logo192.png',
      badge: '/logo192.png'
    });

    n.onclick = () => {
      window.focus();
      n.close();
      if (message.redirectUrl) window.location.href = message.redirectUrl;
    };

    setTimeout(() => n.close(), 10000);
  }

  isConnected() {
    return this.connected && this.stompClient?.connected;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
