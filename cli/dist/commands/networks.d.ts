import { Command } from "commander";
export declare function determineDefaultDomain(): string;
export declare function checkServiceStatus(serviceName: string, port?: number, url?: string): Promise<"running" | "stopped" | "unknown">;
export declare const networksCommand: Command;
