import * as vscode from 'vscode';

export function registerChatTools(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.lm.registerTool('migration-guideline', new IMigrateGuidelineTool()));
	context.subscriptions.push(vscode.lm.registerTool('migrate-file-edit-knowledge', new EditFileKnowledgeTool()));
}

interface IMigrateGuidelineParameters {
	migrateScenario: string;
	from: string;
	to: string;
}

export class IMigrateGuidelineTool implements vscode.LanguageModelTool<IMigrateGuidelineParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<IMigrateGuidelineParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input as IMigrateGuidelineParameters;
		const scenario = params.migrateScenario;
		const from = params.from;
		const to = params.to;
		const guideline =
		`There are several steps to complete scenario ${scenario} \n` +
		`1) Update the dependency files: Find the java dependency file in the project, include the pom.xml or gradle settings, update the dependency for scenario ${scenario} from ${from} to ${to}\n ` +
		`2) Update the Java Code: Search the java code in the whole project if any code is using the API from ${from}, if yes, replace it with ${to} \n ` +
		`3) Update the configuration code:  Check the configuration files in the project, normally it is properties/yaml/yml files, check if it is still using the configuration of ${from}, if yes, replace it with the configuration of ${to}  \n ` +
		`4) Before you use edit_file tool to change a file, using migrate-file-edit-knowledge tool to get additional knowledge for the code change \n ` +
		`5) Try the above steps multiple time and make sure all the code related with  ${from} \n  is changed to ${to}` +
		`6) Compile the code and fix the build error \n `;
		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(guideline)]);
	}
}

interface EditFileKnowledgeParameters {
	filepath: string;
	migrationScenario: string;
	codeSummary: string;
}

export class EditFileKnowledgeTool implements vscode.LanguageModelTool<EditFileKnowledgeParameters> {
	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<EditFileKnowledgeParameters>,
		_token: vscode.CancellationToken
	) {
		const params = options.input as EditFileKnowledgeParameters;
		const fileName = params.filepath;
		const scenario = params.migrationScenario;
		const codeSummary = params.codeSummary;
		console.log(`fileName: ${fileName}, scenario: ${scenario}, codeSummary: ${codeSummary}`);
		//TODO use above three parameters to generate the knowledge
		if(fileName.toLowerCase().endsWith('pom.xml')){
			if(scenario.toLowerCase().includes('storage')){
				return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(`azure-storage-blob version is 12.29.0 and azure-identity version is 1.14.2`)]);
			}
		}
		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(`No Additional knowledge found for the scenario ${scenario} when ${codeSummary}`)]);
	}
}
