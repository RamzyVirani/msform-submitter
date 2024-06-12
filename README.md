# msform-submitter
Submit [MS forms](https://forms.office.com/) by puppeteer

### Config
Create .env file in the root directory and add the following variables
```env
URL=URL_TO_MS_FORM
EMAIL=YOUR_EMAIL
PASSWORD=YOUR_PASSWORD
RECEIPT=true
HEADLESS=true
HEADLESS_LOGIN=false
QUESTION_FILE=./questions.json
```

### ENV Options
- `URL`: URL to the MS form
- `EMAIL`: Your email
- `PASSWORD`: Your password
- `RECEIPT`: `true` if you want `Send me an email receipt of my responses` option to be checked
- `HEADLESS`: `true` if you want to run the browser in headless mode
- `HEADLESS_LOGIN`: `true` if you dont have MFA enabled (highly unlikely). If you have MFA enabled, set it to false
- `QUESTION_FILE`: Path to the JSON file containing the answers to the questions

### Creating Question File
JSON Format for questions is as follows
```json
{
  "QUESTION_ID": {
    "type": "select",
    "value": "Option 1",
    "values": ["Option 2", "Option 3"]
  }
}
```

- `type` can be one of `select | radio | checkbox | text | textarea`
- `values` is required for `checkbox`
- `value` is required for all other types

#### Getting Question IDs
For `radio`, `checkbox`:
Inspect the input element (`radio`, `checkbox`) and copy the value of `name` attribute.

For `select`, `text` and `textarea`:
Inspect the element and copy the value of `aria-labelledby`. The value is formatted like `QuestionId_{QUESTION_ID} QuestionInfo_${QUESTION_ID}`.

### Run
You can either use `npm run start` or directly execute `node index.js`. 

#### Additional Tip
[CronTab](https://crontab.guru/) Command  
E.g. `5 4 * * TUE cd /path/to/script/ && nvm use && node index.js`  
[At 04:05 on Tuesday](https://crontab.guru/#5_4_*_*_TUE)
