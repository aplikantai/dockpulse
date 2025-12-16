import { PrismaClient, Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';

/**
 * Middleware do ustawiania tenant context dla RLS
 * Musi byc wywolany PO resolveTenant
 */
export const withTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenant?.tenantId) {
    // Brak tenant context - uzyj globalnego klienta
    req.db = prisma;
    return next();
  }

  const tenantId = req.tenant.tenantId;

  // Stwórz proxy dla request-scoped tenant context
  req.db = createTenantPrismaProxy(tenantId);

  next();
};

/**
 * Tworzy proxy Prisma client ktory automatycznie ustawia tenant context
 * przed kazdym zapytaniem do bazy
 */
function createTenantPrismaProxy(tenantId: string): PrismaClient {
  return new Proxy(prisma, {
    get(target, prop: string) {
      // Dla $transaction - wrap w SET LOCAL
      if (prop === '$transaction') {
        return async (
          arg:
            | ((tx: Prisma.TransactionClient) => Promise<unknown>)
            | Prisma.PrismaPromise<unknown>[]
        ) => {
          if (typeof arg === 'function') {
            return target.$transaction(async (tx) => {
              await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
              return arg(tx);
            });
          }
          // Array of promises
          return target.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
            return Promise.all(arg);
          });
        };
      }

      // Dla innych operacji (models) - wrap w transakcje
      const value = (target as Record<string, unknown>)[prop];

      if (typeof value === 'object' && value !== null && !prop.startsWith('$')) {
        return new Proxy(value as Record<string, unknown>, {
          get(modelTarget, modelProp: string) {
            const modelMethod = modelTarget[modelProp];

            if (typeof modelMethod === 'function') {
              return async (...args: unknown[]) => {
                return target.$transaction(async (tx) => {
                  await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
                  const model = (tx as Record<string, unknown>)[prop] as Record<string, Function>;
                  return model[modelProp](...args);
                });
              };
            }
            return modelMethod;
          },
        });
      }

      return value;
    },
  }) as PrismaClient;
}

/**
 * Helper do wykonywania zapytan z tenant context poza request scope
 * Uzyj do background jobs, seeds, etc.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (db: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    return fn(tx as unknown as PrismaClient);
  });
}
