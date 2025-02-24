import * as vscode from "vscode";
import { registerChatTools } from "./tools";
import { registerToolUserChatParticipant } from "./toolParticipant";

export async function activate(context: vscode.ExtensionContext) {
  registerToolUserChatParticipant(context);
  registerChatTools(context);
}

export function deactivate() {}
