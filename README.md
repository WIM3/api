# Infinix Main API

- Install packages using `yarn`
- Fill-in `.env` file according to the provided `.env.example` file
- See `package.json` for all the options you can run it with

### Parameters

- `ENVIRONMENT` - e.g. `dev`, set to `local` as default, required
- `PORT` - e.g. `8000`, set to `3601` as default, required
- `RELOAD_RATE` - refresh rate in ms, e.g. `600`, set to `36000` as default, required
- `PROVIDER_KEY` - Infura provider key, no default value set, required
- `REGION` - e.g. `us-east 2`, set to `eu-central-1` as default, optional
- `ACCESS_KEY_ID` - only used for testing if you want to use access `DB` on a different `AWS` environment, optional
- `SECRET_ACCESS_KEY` - only used for testing if you want to use access `DB` on a different `AWS` environment, optional

### Socket.io messages

- `markets` - sends all market and pair information
- `amm_info` - ... (in progress)
- `pair_prices` - ... (in progress)
- `user_positions` - ... (in progress)
