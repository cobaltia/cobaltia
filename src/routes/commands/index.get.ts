import { Route } from '@sapphire/plugin-api';
import { type Subcommand } from '@sapphire/plugin-subcommands';

export class UserRoute extends Route {
	public run(_request: Route.Request, response: Route.Response) {
		const commandStore = this.container.stores.get('commands');
		const commands = commandStore.map(command => {
			const subcommand = command as unknown as Subcommand;
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
			return options;
		});
		response.json(commands);
	}
}

interface Options {
	category: string | null;
	description: string;
	name: string;
	subcommands?: { name: string }[] | null;
}
