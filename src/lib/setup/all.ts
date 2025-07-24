import '#lib/setup/prisma';
import '#lib/setup/redis';
import '#lib/setup/error-webhook';
import '#lib/setup/buckets';
import '#lib/setup/registry';
import '#lib/setup/metrics';
import '@sapphire/plugin-subcommands/register';
import '@sapphire/plugin-api/register';
