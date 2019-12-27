# AbbApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.2.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

- Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. 
- **IMPORTANT** For a production build `ng build --prod` is likely to result in a memory error
- Please use `npm run prod-build` instead

## Prototype Login Credentials

You can login with either of the two credentials mentioned below listed in `username` : `password` format
* `olduser` : `abboldsecret`
* `newuser` : `abbnewsecret`

The view will display according to different user type('old', 'new').

To edit the login credentials you can go to `src/assets/data/UserCredentials.json` and updated the SHA-256 hashed credentials. Note the `secret` for SHA-256 hashing to be used is `abbrcs`

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Localization
Ref this: https://gitlab.com/nildaine/abb-rcs-prototype/blob/f6c00cc2f5b91bf78d803ff34f7b638b2d59fb6a/src/locale/messages.fr.xlf  or locally check the /src/locale/message.fr.xlf;
This file contains all the text/labels used in the application. The <source>  tags contain the text to be converted  & <target> specifies it’s translated text
Update the translated text as desired. To run the translated version use the command

```
npm run start:fr
```
& to run the usual english version use the command
```npm start or npm run start```

To generate a new translation file run ` ng xi18n --output-path src/i18n `
check this (https://angular.io/guide/i18n) for more details.

## Adding new translation 
these are automatically generated.

### For the first time, we have to run 
`npm run xi18n` 
This generates `src/locale/message.xlf` this file contains the list of all the text/labels that can be translated.  (i.e. text in tags with keyword _i18n_)

after this make a copy of this file (say `src/locale/message.fr.xlf`) . In this file add the  `<target> translated text </target>` after every `<source> original text </source>` tag. 

Once these changes are made, start the application  by running `npm run start:fr` for the French version . & to build the command is `npm run build:fr`


### Adding new translation text/keywords at a later stage to existing `message.xlf` file or `message.fr.xlf` file:
  
If we have to add new text for translation then add "i18n" keyword to the desired tags. After this run `npm run xi18n` to generate the updated version of `message.xlf`. This time, from the newly generated `message.xlf` only copy the new text/labes to `message.fr.xlf` & add their translation by adding `<target>` tags next to the the `<source>` tags.

To run & build the updated version run `npm run start:fr` & `npm run build:fr`
  

ref this: https://angular.io/guide/i18n for more details.
1. Add the `i18n` keyword to the tag containing text that you want to translate ref: https://d.pr/free/i/2vU7bA+
2. Then run `npm run xi18n` to regenerate the 'src/locale/message.xlf`
3. Then copy the text those text (<trans-unit> ...,</trans-unit> tags) are to converted to `src/locale/message.fr.xlf`  & add the (<target...</target> tags) contaning the translated text.
4. To run the translated development build run `npm run start:fr`
5. & to build the prodicution versin run `npm run build:fr`

ref this: https://angular.io/guide/i18n for more details.
