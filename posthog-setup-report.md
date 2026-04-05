<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Cobaltia Discord bot. The `posthog-node` SDK was installed and a shared PostHog client was added to the Sapphire framework container via a new setup file (`src/lib/setup/posthog.ts`), following the same pattern as the existing `metrics` and `redis` setup modules. The client is initialized from environment variables and shut down cleanly when the bot exits. Exception autocapture is enabled globally.

User identification calls (`posthog.identify`) were added in the `work_completed` and `member_joined` flows so that Discord user IDs are correlated with their usernames in PostHog. Error tracking via `captureException` was added in the central command error handler.

## Events instrumented

| Event                      | Description                                                                 | File                                                   |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `bank_deposit`             | User deposits money from wallet into bank                                   | `src/commands/economy/bank.ts`                         |
| `bank_withdrawal`          | User withdraws money from bank into wallet                                  | `src/commands/economy/bank.ts`                         |
| `bank_transfer`            | User transfers money to another user                                        | `src/commands/economy/bank.ts`                         |
| `work_completed`           | User completes a work action to earn money (net of tax)                     | `src/commands/economy/work.ts`                         |
| `rob_succeeded`            | User successfully robs another user                                         | `src/commands/economy/rob.ts`                          |
| `rob_failed`               | Rob attempt fails (fought back, caught, killed, or reversed)                | `src/commands/economy/rob.ts`                          |
| `item_purchased`           | User purchases one or more items from the store                             | `src/commands/economy/store.ts`                        |
| `guild_joined`             | Bot joins a new Discord guild                                               | `src/listeners/guilds/guildCreate.ts`                  |
| `member_joined`            | A new member joins a guild the bot is in                                    | `src/listeners/guilds/members/guildMemberAddNotify.ts` |
| `member_left`              | A member leaves a guild the bot is in                                       | `src/listeners/guilds/members/guildmemberRemove.ts`    |
| `command_error`            | An unhandled error occurs during command execution (via `captureException`) | `src/lib/util/functions/errorHelpers.ts`               |
| `government_role_assigned` | An executive or minister role is assigned to a user                         | `src/commands/admin/government.ts`                     |

## Files changed

- **New**: `src/lib/setup/posthog.ts` — PostHog client initialization and container augmentation
- **New**: `.env` — `POSTHOG_API_KEY` and `POSTHOG_HOST` added
- **New**: `.npmignore` — excludes `.vscode/` and `.claude/` from pnpm self-copy
- **Edited**: `src/lib/setup/all.ts` — imports PostHog setup
- **Edited**: `src/lib/CobaltClient.ts` — calls `posthog.shutdown()` on destroy
- **Edited**: `src/config.ts` — exports `POSTHOG_API_KEY` and `POSTHOG_HOST`; adds Env type declarations
- **Edited**: `src/commands/economy/bank.ts` — `bank_deposit`, `bank_withdrawal`, `bank_transfer` events
- **Edited**: `src/commands/economy/work.ts` — `work_completed` event + user identify
- **Edited**: `src/commands/economy/rob.ts` — `rob_succeeded` and `rob_failed` events (all outcomes)
- **Edited**: `src/commands/economy/store.ts` — `item_purchased` event
- **Edited**: `src/commands/admin/government.ts` — `government_role_assigned` event
- **Edited**: `src/listeners/guilds/guildCreate.ts` — `guild_joined` event
- **Edited**: `src/listeners/guilds/members/guildMemberAddNotify.ts` — `member_joined` event + user identify
- **Edited**: `src/listeners/guilds/members/guildmemberRemove.ts` — `member_left` event
- **Edited**: `src/lib/util/functions/errorHelpers.ts` — `captureException` in command error handler
- **Edited**: `package.json` — added `posthog-node` dependency

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/369311/dashboard/1431433)
- **Insight**: [Daily Active Economy Users](https://us.posthog.com/project/369311/insights/tRBFHNNh) — DAU across work, rob, and item purchase
- **Insight**: [Member Churn — Joined vs Left](https://us.posthog.com/project/369311/insights/T9GZXHdt) — server growth and churn signals
- **Insight**: [Bank Transaction Volume](https://us.posthog.com/project/369311/insights/hRb3yKM1) — deposit, withdrawal, and transfer volume
- **Insight**: [Rob Success vs Failure Rate](https://us.posthog.com/project/369311/insights/VrftUs96) — economy balance indicator
- **Insight**: [Command Error Frequency](https://us.posthog.com/project/369311/insights/zVDcd4lj) — bot stability monitoring

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
