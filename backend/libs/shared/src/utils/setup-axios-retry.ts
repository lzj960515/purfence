import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

export function setupAxiosRetry(
  http: HttpService | AxiosInstance,
  logger: Logger = new Logger(),
) {
  axiosRetry(http instanceof HttpService ? http.axiosRef : http, {
    retries: 3,
    retryDelay: (retryCount) => {
      return axiosRetry.exponentialDelay(retryCount) * 10;
    },
    retryCondition: (err) => {
      if (err.response?.status === 429) return true;
      return axiosRetry.isNetworkOrIdempotentRequestError(err);
    },
    onRetry: (retryCount, error, requestConfig) => {
      logger.debug(
        `API retry: ${requestConfig.method} ${requestConfig.url} ${retryCount}`,
      );
    },
  });
}
