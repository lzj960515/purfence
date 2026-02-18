import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';

export async function setupAxiosCurlirize(
  http: HttpService | AxiosInstance,
  logger: Logger = new Logger(),
) {
  const { default: curlirize } = await eval(`import('axios-curlirize')`);

  curlirize(
    http instanceof HttpService ? http.axiosRef : http,
    (result, error) => {
      if (error) {
        logger.error(error.message, error.stack);
      } else {
        logger.debug(result.command);
      }
    },
  );
}
