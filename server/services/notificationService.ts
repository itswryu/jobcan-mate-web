import { logInfo, logError, logWarning } from '../utils/logger';

export class TelegramNotificationService {
  private botToken: string;
  private chatId: string;
  private enabled: boolean;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = Boolean(botToken && chatId);

    if (this.enabled) {
      logInfo('Telegram notification service initialized successfully.');
    } else {
      logInfo('Telegram notifications are disabled due to missing configuration.');
    }
  }

  async sendNotification(message: string, isError: boolean = false): Promise<boolean> {
    if (!this.enabled) {
      logWarning('Cannot send notification: Telegram bot is not configured.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
      }

      logInfo('Telegram notification sent successfully.');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('Failed to send Telegram notification:', errorMessage);
      return false;
    }
  }
}

export class ConsoleNotificationService {
  async sendNotification(message: string, isError: boolean = false): Promise<boolean> {
    if (isError) {
      logError(message);
    } else {
      logInfo(message);
    }
    return true;
  }
}
