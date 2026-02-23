import { Logger } from '@nestjs/common';
import { UIMessage } from 'ai';

const logger = new Logger();

/**
 * 从 UIMessage 中提取文本内容
 * 替代 @voltagent/core 的 extractText 函数
 */
function extractText(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }

  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

describe('Message Helper', () => {
  it('extract text from message', async () => {
    const message: UIMessage = {
      id: 'msg-123',
      role: 'user',
      parts: [
        { type: 'text', text: 'Hello, ' },
        { type: 'file', url: 'image.png', mediaType: 'image/png' },
        { type: 'text', text: 'what is this?' },
      ],
      metadata: { source: 'mobile' },
    };

    logger.log(extractText(message));
  });
});
