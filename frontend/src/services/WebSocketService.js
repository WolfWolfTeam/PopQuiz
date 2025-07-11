import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getAuthToken } from '../utils/auth';

/**
 * WebSocket服务
 * 用于实时通知和消息传递
 */
class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  /**
   * 初始化WebSocket连接
   */
  init() {
    // 如果已连接，则不再重新连接
    if (this.connected) return;
    
    try {
      // 创建SockJS对象
      const socket = new SockJS('/api/ws');
      
      // 创建Stomp客户端
      this.stompClient = Stomp.over(socket);
      
      // 禁用控制台日志
      this.stompClient.debug = () => {};
      
      // 获取认证令牌
      const token = getAuthToken();
      
      // 连接到WebSocket服务器
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
  
  /**
   * 连接成功的回调
   * @param {Object} frame 连接帧
   */
  onConnect(frame) {
    console.log('WebSocket连接成功');
    this.connected = true;
    this.reconnectAttempts = 0;
    
    // 重新订阅之前的主题
    for (const [topic, callback] of this.subscriptions.entries()) {
      this.subscribe(topic, callback);
    }
    
    // 订阅用户特定的通知
    this.subscribeToUserNotifications();
  }
  
  /**
   * 连接错误的回调
   * @param {Object} error 错误对象
   */
  onError(error) {
    console.error('WebSocket连接错误:', error);
    this.connected = false;
    this.stompClient = null;
    
    // 尝试重新连接
    this.scheduleReconnect();
  }
  
  /**
   * 安排重新连接
   */
  scheduleReconnect() {
    // 清除之前的重连计时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // 如果超过最大重连次数，不再重连
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`已达到最大重连次数(${this.maxReconnectAttempts})，停止重连`);
      return;
    }
    
    // 指数退避重连
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`尝试重新连接(${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.init();
    }, delay);
  }
  
  /**
   * 订阅主题
   * @param {string} topic 主题
   * @param {Function} callback 接收消息的回调
   * @returns {string} 订阅ID
   */
  subscribe(topic, callback) {
    if (!this.connected || !this.stompClient) {
      // 保存订阅信息，等连接后再订阅
      this.subscriptions.set(topic, callback);
      this.init();
      return null;
    }
    
    const subscription = this.stompClient.subscribe(topic, (message) => {
      try {
        const parsedBody = JSON.parse(message.body);
        callback(parsedBody);
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });
    
    // 保存订阅
    this.subscriptions.set(topic, callback);
    
    return subscription.id;
  }
  
  /**
   * 取消订阅
   * @param {string} topic 主题
   */
  unsubscribe(topic) {
    if (this.connected && this.stompClient) {
      const subscription = this.stompClient.subscription(topic);
      if (subscription) {
        subscription.unsubscribe();
      }
    }
    
    // 从订阅映射中删除
    this.subscriptions.delete(topic);
  }
  
  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    if (this.connected && this.stompClient) {
      for (const topic of this.subscriptions.keys()) {
        const subscription = this.stompClient.subscription(topic);
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    }
    
    // 清空订阅映射
    this.subscriptions.clear();
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.connected && this.stompClient) {
      // 取消所有订阅
      this.unsubscribeAll();
      
      // 断开连接
      this.stompClient.disconnect(() => {
        this.connected = false;
        this.stompClient = null;
        console.log('WebSocket已断开连接');
      });
    }
    
    // 清除重连计时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  /**
   * 订阅用户特定的通知
   */
  subscribeToUserNotifications() {
    // 用户通知主题，格式为: /user/queue/notifications
    const userNotificationTopic = '/user/queue/notifications';
    
    this.subscribe(userNotificationTopic, (message) => {
      // 触发自定义事件，传递通知消息
      const notificationEvent = new CustomEvent('userNotification', {
        detail: message
      });
      
      window.dispatchEvent(notificationEvent);
      
      // 显示桌面通知(如果允许)
      this.showDesktopNotification(message);
    });
  }
  
  /**
   * 订阅测验状态更新
   * @param {number} quizId 测验ID
   */
  subscribeQuizStats(quizId) {
    const topic = `/topic/quizzes/${quizId}/stats`;
    
    return this.subscribe(topic, (message) => {
      // 触发测验统计更新事件
      const event = new CustomEvent('quizStatsUpdated', {
        detail: { quizId, stats: message }
      });
      
      window.dispatchEvent(event);
    });
  }
  
  /**
   * 订阅讲座测验更新
   * @param {number} lectureId 讲座ID
   */
  subscribeLectureQuizzes(lectureId) {
    const topic = `/topic/lectures/${lectureId}/quizzes`;
    
    return this.subscribe(topic, (message) => {
      // 触发讲座测验更新事件
      const event = new CustomEvent('lectureQuizzesUpdated', {
        detail: { lectureId, quiz: message }
      });
      
      window.dispatchEvent(event);
    });
  }
  
  /**
   * 显示桌面通知
   * @param {Object} message 通知消息
   */
  showDesktopNotification(message) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) return;
    
    // 检查是否已授权
    if (Notification.permission === 'granted') {
      this.createNotification(message);
    }
    // 如果未决定权限，请求权限
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(message);
        }
      });
    }
  }
  
  /**
   * 创建通知
   * @param {Object} message 通知消息
   */
  createNotification(message) {
    const { title, body, icon } = message;
    
    const notification = new Notification(title || 'PopQuiz通知', {
      body: body || '您有一个新的通知',
      icon: icon || '/logo192.png',
      badge: '/logo192.png'
    });
    
    // 点击通知时的动作
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // 如果有重定向URL，则跳转
      if (message.redirectUrl) {
        window.location.href = message.redirectUrl;
      }
    };
    
    // 自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
  
  /**
   * 检查是否已连接
   * @returns {boolean} 是否已连接
   */
  isConnected() {
    return this.connected && this.stompClient !== null;
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

// 导出单例
export default webSocketService; 