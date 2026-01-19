import { Route } from '@sapphire/plugin-api';
import { type Subcommand } from '@sapphire/plugin-subcommands';

export class UserRoute extends Route {
	public run(_request: Route.Request, response: Route.Response) {
		const commandStore = this.container.stores.get('commands');
		const categories = Array.from(new Set(commandStore.map(command => command.category)));

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

		const result = categories.map(category => ({
			name: category,
			commands: commands.filter(command => command.category === category),
		}));
		response.json(result);
	}
}

interface Options {
	category: string | null;
	description: string;
	name: string;
	subcommands?: { name: string }[] | null;
}
