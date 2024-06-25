import puppeteer from 'puppeteer'; // or import puppeteer from 'puppeteer-core';
import {readFile as rf, writeFile as wf} from 'fs';
import {promisify} from 'util';
import {config} from 'dotenv';
const readFile = promisify(rf);
const writeFile = promisify(wf);
config();

const login = async (page, config) => {
    await page.waitForSelector('[name="loginfmt"]')
    await page.type('[name="loginfmt"]', config.email)
    await page.click('input[type="submit"]')

    await page.waitForNavigation()
    await page.waitForNetworkIdle();

    await page.waitForSelector('input[type="password"]', {visible: true})
    await page.type('input[type="password"]', config.password)
    await page.keyboard.press('Enter');

    await page.waitForNetworkIdle();

    await page.waitForSelector('input[name="rememberMFA"][type="checkbox"]', {visible: true})
    await page.click('input[name="rememberMFA"][type="checkbox"]')
    // waiting for 5 minutes for manual interaction from your MFA device.
    await page.waitForNavigation({timeout: 5*60*1000})
    await page.waitForNetworkIdle();

    await page.waitForSelector('input[name="DontShowAgain"][type="checkbox"]', {visible: true})
    await page.click('input[name="DontShowAgain"][type="checkbox"]')
    await page.waitForSelector('input[type="submit"]', {visible: true})
    await page.click('input[type="submit"]');
    await page.waitForNavigation()
    await page.waitForNetworkIdle();

    if(page.url()===config.url) {
        const cookies = await page.cookies();
        await writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
    }
}

const submit = async (page, questions, receipt = true, submit=true) => {
    for await (const questionKey of Object.keys(questions)) {
        const details = questions[questionKey];
        const ariaSelector = `[aria-labelledby="QuestionId_${questionKey} QuestionInfo_${questionKey}"]`;
        switch(details.type){
            case 'select':
                await page.locator(ariaSelector).click({delay: 1000});
                const optionSelector = `[role="listbox"] [role="option"]:has([aria-label="${details.value}"])`;
                await page.waitForSelector(optionSelector, {visible: true});
                await page.locator(optionSelector).click({delay: 1000});
                break
            case 'radio':
                const choice = `label:has(input[type="radio"][name="${questionKey}"][value="${details.value}"])`;
                await page.locator(choice).click({delay: 1000});
                break;
            case 'checkbox':
                for await (const value of details.values) {
                    const choice = `label:has(input[type="checkbox"][name="${questionKey}"][value="${value}"])`;
                    await page.locator(choice).click({delay: 1000});
                }
                break;
            case 'text':
                const textInput = `input${ariaSelector}`;
                await page.waitForSelector(textInput, {visible: true});
                await page.click(textInput);
                await page.type(textInput, details.value, {delay: 50});
                break;
            case 'textarea':
                const textareaInput = `textarea${ariaSelector}`;
                await page.waitForSelector(textareaInput, {visible: true});
                await page.click(textareaInput);
                await page.type(textareaInput, details.value, {delay: 50});
                break;
        }
    }
    if(receipt) {
        await page.locator('[data-automation-value="Receipt"]').click({delay: 1000});
    }
    if (submit) {
        await page.locator('[data-automation-id="submitButton"]').click({delay: 1000});
    }
}

const init = async (config) => {
    const browser = await puppeteer.launch({headless: config.headless, timeout: 300000, args: ['--start-maximized'], devtools: false});
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try {
        const cookiesString = await readFile('./cookies.json', 'utf8');
        if(cookiesString && cookiesString.length>0) {
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
        }
    } catch (e) {
        console.log(e.message);
    }
    await page.goto(config.url);
    try {
        console.log('waiting for navigation in case login session is expired...');
        await page.waitForNavigation({timeout: 30000});
    } catch(e){
        console.log('Did not navigate, proceeding with submit.');
    }
    await page.waitForNetworkIdle();
    if(page.url()===config.url){
        await submit(page, config.questions, config.receipt, config.headless);
    } else {
        if(config.headless && !config.headlessLogin) {
            console.log('======================================================');
            console.log('Login in headless mode is disabled.');
            console.log('Please disable headless mode or enable headless login.');
            await browser.close();
        } else {
            await login(page, config);
            await submit(page, config.questions, config.receipt, config.headless);
        }
    }
    if(config.headless) {
        await browser.close();
    }
}
const {
    URL,
    EMAIL,
    PASSWORD,
    RECEIPT = "true",
    HEADLESS = "true",
    HEADLESS_LOGIN= "false",
    QUESTION_FILE = './questions.json'
} = process.env;
readFile(QUESTION_FILE, 'utf8').then(async (data) => {
    await init({
        url: URL,
        email: EMAIL,
        password: PASSWORD,
        receipt: RECEIPT === "true",
        headless: HEADLESS === "true",
        headlessLogin: HEADLESS_LOGIN === "true",
        questions: JSON.parse(data),
    });
});






