import { Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import myAgentConfig from '@src/common/configs/my-agent.config';
import typeormBiConfig from '@src/common/configs/typeorm-ai.config';
import { z } from 'zod';
import { MyAgentModule, MyAgentService, Tool } from '../src';

const logger = new Logger();

@Injectable()
class Tools {
  @Tool({
    name: 'getWeather',
    description: 'Get the current weather for a specific location',
    parameters: z.object({
      location: z.string().describe('The city or location to get weather for'),
    }),
    outputSchema: z.object({
      weather: z.object({
        location: z.string(),
        temperature: z.number(),
        condition: z.string(),
        humidity: z.number(),
        windSpeed: z.number(),
      }),
      message: z.string(),
    }),
    tags: ['test'],
  })
  async getWeather({ location }) {
    const mockWeatherData = {
      location,
      temperature: Math.floor(Math.random() * 30) + 5, // Random temp between 5-35°C
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Partly Cloudy'][
        Math.floor(Math.random() * 5)
      ],
      humidity: Math.floor(Math.random() * 60) + 30, // Random humidity between 30-90%
      windSpeed: Math.floor(Math.random() * 30), // Random wind speed between 0-30 km/h
    };

    return {
      weather: mockWeatherData,
      message: `Current weather in ${location}: ${mockWeatherData.temperature}°C and ${mockWeatherData.condition.toLowerCase()} with ${mockWeatherData.humidity}% humidity and wind speed of ${mockWeatherData.windSpeed} km/h.`,
    };
  }
}

describe('Agent With Tools', () => {
  let module: TestingModule;
  let service: MyAgentService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConfigModule.forFeature(typeormBiConfig),
        ConfigModule.forFeature(myAgentConfig),
        MyAgentModule,
      ],
      providers: [Tools],
    })
      .setLogger(logger)
      .compile();

    await module.init();

    service = module.get<MyAgentService>(MyAgentService);
  });

  it('create agent', async () => {
    const agent = service.createAgent({
      name: 'basic-agent-test',
      prompt: '',
      tools: ['getWeather'],
      memory: 'in-memory',
    });

    const result = await agent.generateText(
      'How do I dress for the weather in Beijing?',
    );
    logger.log(`Successfully created agent: ${result.text}`);
  });
});
