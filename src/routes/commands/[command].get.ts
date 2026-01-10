import { Route } from '@sapphire/plugin-api';
import { type Subcommand } from '@sapphire/plugin-subcommands';

export class UserRoute extends Route {
	public run(request: Route.Request, response: Route.Response) {
		const { command } = request.params;
		const commandStore = this.container.stores.get('commands');
		const fetchedCommand = commandStore.get(command);

		if (!fetchedCommand) {
			response.status(404).json({ message: 'Command not found' });
			return;
		}

		const subcommand = fetchedCommand as unknown as Subcommand;
		const options: Options = {
			name: subcommand.name,
			description: subcommand.description,
			category: subcommand.category,
			subcommands: null,
		};
		if (subcommand.options.subcommands)
			options.subcommands = subcommand.options.subcommands.map(subcommand => {
				return {
					name: subcommand.name,
				};
			});
		response.json(options);
	}
}

interface Options {
	category: string | null;
	description: string;
	name: string;
	subcommands?: { name: string }[] | null;
}
