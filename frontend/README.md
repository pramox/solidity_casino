# Angular Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.4.

## Development server

Run `npm run start` for a dev server. Navigate to http://localhost:3000/.

The application will automatically reload if you change any of the source files.
You may also see any lint errors in the console.

## Learn More

To learn Angular, check out the [Angular Documentation](https://angular.io/).

## Project Overview

### Folder structure:

- `main.ts`: The entrance point for the Angular application.
- `/app`: Contains UI components, services, modules and models for the Beer Bar.
- `/app/models.ts`: Contains types/interfaces for the app states.
- `/app/app.module.ts`: Contains declarations of used components and imports/providers of other module (e.g. components/modules from PrimeNG).
- `/app/shared/contract.service.ts`: A service handling the global app state and providing functions for interaction.

### State management:

This app uses a simple service class together with observables and [RxJs](https://rxjs.dev/) to handle app state. 

