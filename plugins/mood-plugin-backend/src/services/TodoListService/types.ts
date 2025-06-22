import { LoggerService } from '@backstage/backend-plugin-api';

export interface PluginEnvironment {
  logger: LoggerService;
}

// 👇 ADD THESE TWO — they were missing earlier
export type TodoItem = {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
};

export interface TodoListService {
  createTodo(
    input: { title: string; entityRef?: string },
    options: { credentials: { principal: { userEntityRef: string } } },
  ): Promise<TodoItem>;

  listTodos(): Promise<{ items: TodoItem[] }>;

  getTodo(request: { id: string }): Promise<TodoItem>;
}
