// Missive API Utilities
export class MissiveAPI {
  static checkAvailability() {
    return typeof window !== 'undefined' && window.Missive;
  }

  static async getSelectedConversation() {
    if (!this.checkAvailability()) {
      throw new Error('Missive API not available');
    }

    try {
      return await window.Missive.getSelectedConversation();
    } catch (error) {
      console.log('No conversation selected');
      return null;
    }
  }

  static async getConversationMessages(conversationId) {
    if (!this.checkAvailability()) {
      throw new Error('Missive API not available');
    }

    try {
      const messages = await window.Missive.getConversationMessages(conversationId);
      return messages || [];
    } catch (error) {
      throw new Error(`Failed to fetch conversation messages: ${error.message}`);
    }
  }

  static addEventListener(event, callback) {
    if (!this.checkAvailability()) {
      return () => {}; // Return empty cleanup function
    }

    window.Missive.on(event, callback);
    
    // Return cleanup function
    return () => {
      window.Missive.off(event, callback);
    };
  }

  static formatMessageForAnalysis(message) {
    const from = message.from_field?.name || message.from_field?.address || 'Unknown';
    const subject = message.subject || 'No subject';
    const content = message.body || message.preview || '';
    const timestamp = message.created_at ? new Date(message.created_at).toLocaleString() : '';

    return {
      from,
      subject,
      content,
      timestamp,
      formatted: `From: ${from}\nSubject: ${subject}\nTime: ${timestamp}\nContent: ${content}\n\n`
    };
  }

  static formatConversationForAnalysis(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return 'No messages found in conversation.';
    }

    const formattedMessages = messages
      .map(msg => this.formatMessageForAnalysis(msg))
      .map(msg => msg.formatted)
      .join('---\n\n');

    return formattedMessages;
  }
} 