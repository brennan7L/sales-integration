// Missive API Utilities
export class MissiveAPI {
  static checkAvailability() {
    return typeof window !== 'undefined' && window.Missive;
  }

  static async getCurrentConversations() {
    if (!this.checkAvailability()) {
      throw new Error('Missive API not available');
    }

    // The current conversation IDs are passed to the change:conversations callback
    // We'll store them when the callback is triggered
    return this.currentConversationIds || [];
  }

  static async fetchConversationData(conversationIds) {
    if (!this.checkAvailability()) {
      throw new Error('Missive API not available');
    }

    if (!conversationIds || conversationIds.length === 0) {
      return [];
    }

    try {
      const conversations = await window.Missive.fetchConversations(conversationIds);
      return conversations || [];
    } catch (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }

  static async fetchMessageData(messageIds) {
    if (!this.checkAvailability()) {
      throw new Error('Missive API not available');
    }

    if (!messageIds || messageIds.length === 0) {
      return [];
    }

    try {
      const messages = await window.Missive.fetchMessages(messageIds);
      return messages || [];
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  static onConversationChange(callback) {
    if (!this.checkAvailability()) {
      console.warn('Missive API not available for conversation change listener');
      return () => {}; // Return empty cleanup function
    }

    const wrappedCallback = async (conversationIds) => {
      console.log('🔄 Conversation changed, IDs:', conversationIds);
      
      // Store current conversation IDs
      this.currentConversationIds = conversationIds;

      if (!conversationIds || conversationIds.length === 0) {
        callback(null);
        return;
      }

      // For now, handle single conversation selection
      if (conversationIds.length === 1) {
        try {
          const conversations = await this.fetchConversationData(conversationIds);
          if (conversations && conversations.length > 0) {
            callback(conversations[0]);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching conversation data:', error);
          callback(null);
        }
      } else {
        // Multiple conversations selected - handle as needed
        callback(null);
      }
    };

    window.Missive.on('change:conversations', wrappedCallback);
    
    // Return cleanup function
    return () => {
      // Note: The Missive API doesn't seem to have an 'off' method in the docs
      // This is a placeholder for when cleanup is needed
      console.log('Conversation change listener cleanup called');
    };
  }

  static async getConversationMessages(conversation) {
    if (!conversation || !conversation.messages) {
      return [];
    }

    // If conversation already has messages, return them
    if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      return conversation.messages;
    }

    // If we have message IDs, fetch the full message data
    if (conversation.latest_message) {
      try {
        const messageIds = [conversation.latest_message.id];
        return await this.fetchMessageData(messageIds);
      } catch (error) {
        console.error('Error fetching message data:', error);
        return [];
      }
    }

    return [];
  }

  static formatMessageForAnalysis(message) {
    const from = message.from_field?.name || message.from_field?.address || 'Unknown';
    const subject = message.subject || 'No subject';
    const content = message.body || message.preview || '';
    const timestamp = message.delivered_at ? new Date(message.delivered_at * 1000).toLocaleString() : '';

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