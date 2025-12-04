import { Module } from '@nestjs/common';
import { GeminiClient } from './gemini.client';

@Module({
  providers: [
    GeminiClient,
    {
      provide: 'ILlmClient',
      useClass: GeminiClient,
    },
  ],
  exports: ['ILlmClient'],
})
export class LLMModule {}
