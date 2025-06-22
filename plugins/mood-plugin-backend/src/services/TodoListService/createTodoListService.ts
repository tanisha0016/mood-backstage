import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { CatalogApi } from '@backstage/catalog-client';
import crypto from 'node:crypto';
import { TodoItem, TodoListService } from './types';

export async function createTodoListService({
  logger,
  catalog,
}: {
  logger: LoggerService;
  catalog: CatalogApi;
}): Promise<TodoListService> {
  logger.info('Initializing TodoListService');

  const storedTodos = new Array<TodoItem>();

  return {
    async createTodo(input, options) {
      let title = input.title;

      if (input.entityRef) {
        // 👉 Don't pass options directly — pass a token if you have it, or nothing
        const entity = await catalog.getEntityByRef(input.entityRef);
        if (!entity) {
          throw new NotFoundError(
            `No entity found for ref '${input.entityRef}'`,
          );
        }

        const entityDisplay = entity.metadata.title ?? input.entityRef;
        title = `[${entityDisplay}] ${input.title}`;
      }

      const id = crypto.randomUUID();

      // if you still want to simulate a user, you can hardcode or skip this
      const createdBy = options?.credentials?.principal?.userEntityRef ?? 'user:default/guest';

      const newTodo: TodoItem = {
        title,
        id,
        createdBy,
        createdAt: new Date().toISOString(),
      };

      storedTodos.push(newTodo);

      logger.info('Created new todo item', { id, title, createdBy });

      return newTodo;
    },

    async listTodos() {
      return { items: Array.from(storedTodos) };
    },

    async getTodo(request: { id: string }) {
      const todo = storedTodos.find(item => item.id === request.id);
      if (!todo) {
        throw new NotFoundError(`No todo found with id '${request.id}'`);
      }
      return todo;
    },
  };
}
