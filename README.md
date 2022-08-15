# Infinix Main API

- Install packages using `yarn`
- Fill-in `.env` file according to the provided `.env.example` file
- See `package.json` for all the options you can run it with

### Parameters

- `ENVIRONMENT` - e.g. `dev`, set to `local` as default, required
- `PORT` - e.g. `8000`, set to `3601` as default, required
- `REGION` - e.g. `us-east 2`, set to `eu-central-1` as default, optional
- `ACCESS_KEY_ID` - only used for testing if you want to use access `DB` on a different `AWS` environment, optional
- `SECRET_ACCESS_KEY` - only used for testing if you want to use access `DB` on a different `AWS` environment, optional

### Endpoints

- `/markets/all` - get all market information
