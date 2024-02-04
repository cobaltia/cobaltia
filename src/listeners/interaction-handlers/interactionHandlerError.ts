import { Events, type InteractionHandlerError, Listener } from '@sapphire/framework';
import { handleInteractionError } from '#util/functions/interactionErrorHandler';

export class InteractionHandlerErrorListener extends Listener<typeof Events.InteractionHandlerError> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.InteractionHandlerError,
		});
	}

	public async run(error: Error, payload: InteractionHandlerError) {
		return handleInteractionError(error, payload);
	}
}
