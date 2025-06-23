export type TodoItem = {
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
};

export interface TodoListService {
  createTodo: (
    input: {
      title: string;
      entityRef?: string;
    },
    options?: {
      credentials?: {
        token?: string;
        principal?: {
          userEntityRef: string;
        };
      };
    }
  ) => Promise<TodoItem>;

  listTodos: () => Promise<{ items: TodoItem[] }>;
  getTodo: (request: { id: string }) => Promise<TodoItem>;
}
