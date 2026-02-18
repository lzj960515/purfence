import _ from 'lodash';
import { AgentSseErrorActionType } from './agent-sse-error-action.enum';

export const SSE_ERROR_ACTION_MAPPING: Record<string, AgentSseErrorActionType> =
  {
    'Each `tool_use` block must have a corresponding `tool_result` block in the next message.':
      AgentSseErrorActionType.RESET_SESSION,
    'Too much media': AgentSseErrorActionType.RESET_SESSION,
    Overloaded: AgentSseErrorActionType.RETRY,
    terminated: AgentSseErrorActionType.RETRY,
    'Internal server error': AgentSseErrorActionType.RETRY,
  };

export function getErrorActionType(
  errorMessage: string,
): AgentSseErrorActionType {
  const matchedPattern = _.find(_.keys(SSE_ERROR_ACTION_MAPPING), (pattern) =>
    errorMessage.includes(pattern),
  );

  return matchedPattern
    ? SSE_ERROR_ACTION_MAPPING[matchedPattern]
    : AgentSseErrorActionType.NO_RETRY;
}

export function shouldRetryError(errorMessage: string): boolean {
  const actionType = getErrorActionType(errorMessage);
  return actionType === AgentSseErrorActionType.RETRY;
}
