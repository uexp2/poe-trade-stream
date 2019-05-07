const puppeteer = require('puppeteer')
const browserless = require('browserless')({ timeout: 60*1000 })

exports.scrapeEndStreamId = async () => {
    const browser = await puppeteer.launch({ headless: false , timeout: 0 });
    const [page] = await browser.pages();
    await page.goto('https://poe.ninja/stats', {timeout: 0});
    await page.waitForSelector('#container > div > table > tbody > tr:nth-child(1) > td.text-right > a');
    const result = await page.evaluate(() => {
      return document.querySelector('#container > div > table > tbody > tr:nth-child(1) > td.text-right > a').innerHTML;
    })
    browser.close();
  
    // const page = await browserless.page()
    // await browserless.goto(page, {
    //   url: 'https://poe.ninja/stats',
    //   abortTypes: ['image', 'media', 'stylesheet', 'font'],
    //   waitFor: 0
    // })
    // await page.waitForSelector('#container > div > table > tbody > tr:nth-child(1) > td.text-right > a');
    // const result = await page.evaluate(() => {
    //   return document.querySelector('#container > div > table > tbody > tr:nth-child(1) > td.text-right > a').innerHTML;
    // })
    return result;
  }