import { Logger } from '@nestjs/common';
import { extractText } from '@voltagent/core';
import { UIMessage } from 'ai';

const logger = new Logger();

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
