export interface DjangoFile {
  filename: string;
  path: string;
  content: string;
}

export interface DjangoBlueprint {
  projectName: string;
  description: string;
  files: DjangoFile[];
  explanations: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CommandItem {
  command: string;
  description: string;
  category: "Setup" | "Migrations" | "Database" | "Server" | "Auth & Security";
  explanation: string;
}

export type DatabaseType = "sqlite" | "postgresql" | "mysql";
