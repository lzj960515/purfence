import { Request } from 'express';
import { RequestContext } from 'nestjs-request-context';

export function currentUserCredential() {
  const req: Request = RequestContext.currentContext?.req;
  if (req && req.headers.authorization) {
    const [type, token] = req.headers.authorization.split(' ', 2);
    return { type, token };
  }
}
